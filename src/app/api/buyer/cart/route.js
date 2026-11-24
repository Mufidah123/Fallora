// src/app/api/buyer/cart/route.js
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const res = await query(
        `SELECTci.id AS cart_item_id,ci.quantity,
        p.id AS product_id, p.name AS product_name, p.price, p.stock,
        s.id AS store_id, s.name AS store_name, pi.image_path AS primary_image
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN products p ON p.id = ci.product_id
        JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
        WHERE c.buyer_id = $1 AND p.is_active = TRUE
        ORDER BY ci.created_at ASC`,
            [session.userId]
    );

    return NextResponse.json({ items: res.rows });
}