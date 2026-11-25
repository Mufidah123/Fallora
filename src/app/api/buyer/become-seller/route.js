import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";

// Buyer mendaftar menjadi seller dari Profile Management.
// Skema memakai satu kolom users.role, jadi role diubah ke SELLER (status PENDING)
// dan menunggu persetujuan Admin.
export async function POST(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const storeName = String(body.store_name || "").trim().slice(0, 150);
    if (!storeName) {
        return NextResponse.json({ message: "Nama toko wajib diisi." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const u = await client.query(
            `SELECT id, name, username, email, phone, role, status FROM users WHERE id = $1 FOR UPDATE`,
            [session.userId]
        );
        const user = u.rows[0];
        if (!user || user.role !== "BUYER") {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "Hanya akun Buyer yang dapat mendaftar sebagai Seller." }, { status: 403 });
        }

        // Pesanan yang masih berjalan harus selesai dulu agar tidak hilang dari halaman pesanan
        const active = await client.query(
            `SELECT 1 FROM orders o JOIN sub_orders s ON s.order_id = o.id
        WHERE o.buyer_id = $1 AND s.status IN ('PENDING_PAYMENT','PROCESSING','SHIPPED') LIMIT 1`,
            [user.id]
        );
        if (active.rowCount > 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "Selesaikan dulu pesanan yang masih berjalan sebelum mendaftar sebagai Seller." },
                { status: 409 }
            );
        }

        await client.query(
            `UPDATE users SET role = 'SELLER', status = 'PENDING', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
        );
        await client.query(
            `INSERT INTO stores (seller_id, name) VALUES ($1, $2)
        ON CONFLICT (seller_id) DO UPDATE SET name = EXCLUDED.name`,
            [user.id, storeName]
        );
        await client.query("COMMIT");

        await setSessionCookie({ ...user, role: "SELLER", status: "PENDING" });
        return NextResponse.json({
            message: "Pendaftaran Seller terkirim. Menunggu persetujuan Admin.",
            redirectTo: "/seller/pending",
        });
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("BECOME_SELLER_ERROR:", err);
        return NextResponse.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
    } finally {
        client.release();
    }
}
