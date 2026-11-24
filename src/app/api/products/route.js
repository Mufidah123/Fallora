import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = String(searchParams.get("q") || "").trim();
        const categoryId = searchParams.get("categoryId");
        const limit = Math.min(Math.max(Number(searchParams.get("limit") || 10), 1), 40);
        const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

        const conditions = ["p.is_active = TRUE"];
        const params = [];

        if (q) {
            params.push(`%${q}%`);
            conditions.push(`p.name ILIKE $${params.length}`);
        }

        if (categoryId && Number(categoryId) > 0) {
            params.push(Number(categoryId));
            conditions.push(`p.category_id = $${params.length}`);
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        const countRes = await query(
            `SELECT COUNT(*)::int AS total
       FROM products p
       ${whereClause}`,
            params
        );
        const total = countRes.rows[0]?.total || 0;

        const listParams = [...params, limit, offset];
        const productsRes = await query(
            `SELECT p.id, p.name, p.description, p.price, p.stock, p.created_at,
            c.id AS category_id, c.name AS category_name, s.id AS store_id,
            s.name AS store_name, pi.image_path AS primary_image,
            COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN oi.quantity ELSE 0 END), 0)::int AS sold_count
            FROM products p
            JOIN categories c ON c.id = p.category_id
            JOIN stores s ON s.id = p.store_id
            LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
            LEFT JOIN order_items oi ON oi.product_id = p.id
            LEFT JOIN sub_orders so ON so.id = oi.sub_order_id
            ${whereClause}
            GROUP BY p.id, c.id, s.id, pi.image_path
            ORDER BY p.created_at DESC
            LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );

        return NextResponse.json({
            products: productsRes.rows,
            total,
            hasMore: offset + productsRes.rows.length < total,
        });
    } catch (err) {
        console.error("GET_PRODUCTS_ERROR:", err);
        return NextResponse.json(
            { message: "Gagal memuat daftar produk." },
            { status: 500 }
        );
    }
}