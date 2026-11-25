import { NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { readAddress } from "../route";

async function authorize(context) {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return { response: NextResponse.json({ message: "Akses ditolak." }, { status: 401 }) };
    }
    const { id } = await context.params;
    const addressId = Number(id);
    if (!Number.isInteger(addressId) || addressId <= 0) {
        return { response: NextResponse.json({ message: "Alamat tidak valid." }, { status: 400 }) };
    }
    return { session, addressId };
}

export async function PUT(request, context) {
    const auth = await authorize(context);
    if (auth.response) return auth.response;

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
    }
    const parsed = readAddress(body);
    if (parsed.error) return NextResponse.json({ message: parsed.error }, { status: 400 });
    const a = parsed.value;

    const res = await query(
        `UPDATE addresses SET recipient_name = $1, phone = $2, address = $3, city = $4,
        postal_code = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND buyer_id = $7 RETURNING id`,
        [a.recipient_name, a.phone, a.address, a.city, a.postal_code, auth.addressId, auth.session.userId]
    );
    if (!res.rows[0]) return NextResponse.json({ message: "Alamat tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ message: "Alamat diperbarui." });
}

// Jadikan alamat utama
export async function PATCH(_request, context) {
    const auth = await authorize(context);
    if (auth.response) return auth.response;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const own = await client.query(`SELECT id FROM addresses WHERE id = $1 AND buyer_id = $2`, [
            auth.addressId,
            auth.session.userId,
        ]);
        if (!own.rows[0]) {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "Alamat tidak ditemukan." }, { status: 404 });
        }
        await client.query(`UPDATE addresses SET is_default = FALSE WHERE buyer_id = $1`, [auth.session.userId]);
        await client.query(`UPDATE addresses SET is_default = TRUE WHERE id = $1`, [auth.addressId]);
        await client.query("COMMIT");
        return NextResponse.json({ message: "Alamat utama diubah." });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("DEFAULT_ADDRESS_ERROR:", err);
        return NextResponse.json({ message: "Gagal mengubah alamat utama." }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(_request, context) {
    const auth = await authorize(context);
    if (auth.response) return auth.response;

    const res = await query(
        `DELETE FROM addresses WHERE id = $1 AND buyer_id = $2 RETURNING is_default`,
        [auth.addressId, auth.session.userId]
    );
    if (!res.rows[0]) return NextResponse.json({ message: "Alamat tidak ditemukan." }, { status: 404 });

    // Kalau yang dihapus alamat utama, jadikan alamat terbaru berikutnya sebagai utama
    if (res.rows[0].is_default) {
        await query(
            `UPDATE addresses SET is_default = TRUE
            WHERE id = (SELECT id FROM addresses WHERE buyer_id = $1 ORDER BY id DESC LIMIT 1)`,
            [auth.session.userId]
        );
    }
    return NextResponse.json({ message: "Alamat dihapus." });
}
