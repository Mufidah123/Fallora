import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Buyer memberi rating & ulasan untuk item pesanan yang sudah selesai (COMPLETED)
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

    const orderItemId = Number(body.order_item_id);
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!Number.isInteger(orderItemId) || orderItemId <= 0) {
        return NextResponse.json({ message: "Item pesanan tidak valid." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ message: "Rating harus antara 1 sampai 5." }, { status: 400 });
    }
    if (comment.length > 1000) {
        return NextResponse.json({ message: "Ulasan maksimal 1000 karakter." }, { status: 400 });
    }

    // Item harus milik buyer ini dan pesanan toko tersebut sudah selesai
    const itemRes = await query(
        `SELECT oi.id, oi.product_id, so.status
        FROM order_items oi
        JOIN sub_orders so ON so.id = oi.sub_order_id
        JOIN orders o ON o.id = so.order_id
        WHERE oi.id = $1 AND o.buyer_id = $2
        LIMIT 1`,
        [orderItemId, session.userId]
    );
    const item = itemRes.rows[0];
    if (!item) {
        return NextResponse.json({ message: "Item pesanan tidak ditemukan." }, { status: 404 });
    }
    if (item.status !== "COMPLETED") {
        return NextResponse.json(
            { message: "Ulasan baru bisa diberikan setelah pesanan selesai." },
            { status: 400 }
        );
    }

    try {
        await query(
            `INSERT INTO reviews (order_item_id, buyer_id, product_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)`,
            [orderItemId, session.userId, item.product_id, rating, comment || null]
        );
    } catch (err) {
        if (err.code === "23505") {
            return NextResponse.json({ message: "Kamu sudah memberi ulasan untuk item ini." }, { status: 409 });
        }
        console.error("REVIEW_ERROR:", err);
        return NextResponse.json({ message: "Gagal menyimpan ulasan." }, { status: 500 });
    }

    return NextResponse.json({ message: "Terima kasih, ulasanmu tersimpan." }, { status: 201 });
}
