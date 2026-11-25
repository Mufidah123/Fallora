import { NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export function readAddress(body) {
    const a = {
        recipient_name: String(body.recipient_name || "").trim(),
        phone: String(body.phone || "").trim(),
        address: String(body.address || "").trim(),
        city: String(body.city || "").trim(),
        postal_code: String(body.postal_code || "").trim(),
        is_default: body.is_default === true,
    };
    if (!a.recipient_name || !a.phone || !a.address || !a.city || !a.postal_code) {
        return { error: "Semua kolom alamat wajib diisi." };
    }
    if (a.recipient_name.length > 100 || a.city.length > 100) {
        return { error: "Nama penerima dan kota maksimal 100 karakter." };
    }
    if (!/^[0-9+\-\s]{6,30}$/.test(a.phone)) {
        return { error: "Nomor telepon tidak valid." };
    }
    if (!/^[0-9]{5}$/.test(a.postal_code)) {
        return { error: "Kode pos harus 5 digit angka." };
    }
    return { value: a };
}

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }
    const res = await query(
        `SELECT id, recipient_name, phone, address, city, postal_code, is_default
        FROM addresses WHERE buyer_id = $1 ORDER BY is_default DESC, id DESC`,
        [session.userId]
    );
    return NextResponse.json({ addresses: res.rows });
}

export async function POST(request) {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
    }
    const parsed = readAddress(body);
    if (parsed.error) return NextResponse.json({ message: parsed.error }, { status: 400 });
    const a = parsed.value;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const count = await client.query(`SELECT COUNT(*)::int AS n FROM addresses WHERE buyer_id = $1`, [session.userId]);
        // Alamat pertama otomatis jadi default
        const makeDefault = a.is_default || count.rows[0].n === 0;
        if (makeDefault) {
            await client.query(`UPDATE addresses SET is_default = FALSE WHERE buyer_id = $1`, [session.userId]);
        }
        const ins = await client.query(
            `INSERT INTO addresses (buyer_id, recipient_name, phone, address, city, postal_code, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, recipient_name, phone, address, city, postal_code, is_default`,
            [session.userId, a.recipient_name, a.phone, a.address, a.city, a.postal_code, makeDefault]
        );
        await client.query("COMMIT");
        return NextResponse.json({ message: "Alamat ditambahkan.", address: ins.rows[0] }, { status: 201 });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("ADD_ADDRESS_ERROR:", err);
        return NextResponse.json({ message: "Gagal menyimpan alamat." }, { status: 500 });
    } finally {
        client.release();
    }
}
