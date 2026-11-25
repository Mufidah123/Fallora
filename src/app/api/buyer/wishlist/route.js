import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function buyerOnly() {
    const session = await getSession();
    if (!session) {
        return { response: NextResponse.json({ message: "Silakan login terlebih dahulu.", requireLogin: true }, { status: 401 }) };
    }
    if (session.role !== "BUYER") {
        return { response: NextResponse.json({ message: "Wishlist khusus akun Buyer." }, { status: 403 }) };
    }
    return { session };
}

export async function GET() {
    const { session, response } = await buyerOnly();
    if (response) return response;

    const res = await query(
        `SELECT p.id AS product_id, p.name, p.price, p.stock, s.name AS store_name,
        pi.image_path AS primary_image, w.created_at
        FROM wishlist_items w
        JOIN products p ON p.id = w.product_id
        JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
        WHERE w.buyer_id = $1 AND p.is_active = TRUE
        ORDER BY w.created_at DESC`,
        [session.userId]
    );
    return NextResponse.json({ items: res.rows });
}

export async function POST(request) {
    const { session, response } = await buyerOnly();
    if (response) return response;

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
    }
    const productId = Number(body.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json({ message: "Produk tidak valid." }, { status: 400 });
    }

    const prod = await query(`SELECT id FROM products WHERE id = $1 AND is_active = TRUE`, [productId]);
    if (!prod.rows[0]) return NextResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });

    await query(
        `INSERT INTO wishlist_items (buyer_id, product_id) VALUES ($1, $2)
        ON CONFLICT (buyer_id, product_id) DO NOTHING`,
        [session.userId, productId]
    );
    return NextResponse.json({ message: "Ditambahkan ke wishlist.", wished: true }, { status: 201 });
}

export async function DELETE(request) {
    const { session, response } = await buyerOnly();
    if (response) return response;

    const productId = Number(new URL(request.url).searchParams.get("productId"));
    if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json({ message: "Produk tidak valid." }, { status: 400 });
    }
    await query(`DELETE FROM wishlist_items WHERE buyer_id = $1 AND product_id = $2`, [session.userId, productId]);
    return NextResponse.json({ message: "Dihapus dari wishlist.", wished: false });
}
