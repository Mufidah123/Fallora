import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(_request, context) {
    try {
        const { id } = await context.params;
        const productId = Number(id);

        if (!Number.isInteger(productId) || productId <= 0) {
            return NextResponse.json({ message: "ID produk tidak valid." }, { status: 400 });
        }

        const productRes = await query(
            `SELECT p.id, p.name, p.description, p.price, p.stock, p.is_active,
            c.id AS category_id, c.name AS category_name, s.id AS store_id,
            s.name AS store_name, s.description AS store_description, s.image_path AS store_image
            FROM products p
            JOIN categories c ON c.id = p.category_id
            JOIN stores s ON s.id = p.store_id
            WHERE p.id = $1 AND p.is_active = TRUE
            LIMIT 1`,
                [productId]
        );

        const product = productRes.rows[0];
        if (!product) {
            return NextResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
        }

        const imagesRes = await query(
            `SELECT id, image_path, is_primary
        FROM product_images
        WHERE product_id = $1
        ORDER BY is_primary DESC, id ASC`,
            [productId]
        );

        // Cek opsional jika tabel reviews ada di database
        let reviews = [];
        let avgRating = 0;
        try {
            const revRes = await query(
                `SELECT r.id, r.rating, r.comment, r.created_at, u.username, u.name
         FROM reviews r
         JOIN users u ON u.id = r.buyer_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
                [productId]
            );
            reviews = revRes.rows;
            if (reviews.length > 0) {
                const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
                avgRating = Number((sum / reviews.length).toFixed(1));
            }
        } catch {
            reviews = [];
            avgRating = 0;
        }

        return NextResponse.json({
            product,
            images: imagesRes.rows,
            reviews,
            avgRating,
        });
    } catch (err) {
        console.error("PRODUCT_DETAIL_ERROR:", err);
        return NextResponse.json({ message: "Gagal memuat detail produk." }, { status: 500 });
    }
}