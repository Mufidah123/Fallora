// src/app/products/[id]/page.jsx
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }) {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
        notFound();
    }

    const session = await getSession();
    let currentUser = null;
    if (session?.userId) {
        const uRes = await query(
            `SELECT id, name, username, role FROM users WHERE id = $1 LIMIT 1`,
            [session.userId]
        );
        currentUser = uRes.rows[0] || null;
    }

    const pRes = await query(
        `SELECT
       p.id, p.name, p.description, p.price, p.stock,
       c.id AS category_id, c.name AS category_name,
       s.id AS store_id, s.name AS store_name, s.description AS store_description
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN stores s ON s.id = p.store_id
     WHERE p.id = $1 AND p.is_active = TRUE
     LIMIT 1`,
        [productId]
    );

    const product = pRes.rows[0];
    if (!product) {
        notFound();
    }

    const imgRes = await query(
        `SELECT id, image_path, is_primary
     FROM product_images
     WHERE product_id = $1
     ORDER BY is_primary DESC, id ASC`,
        [productId]
    );

    let reviews = [];
    let avgRating = 0;
    try {
        const revRes = await query(
            `SELECT r.id, r.rating, r.comment, u.username
       FROM reviews r
       JOIN users u ON u.id = r.buyer_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
            [productId]
        );
        reviews = revRes.rows;
        if (reviews.length > 0) {
            avgRating = Number(
                (reviews.reduce((a, b) => a + Number(b.rating || 0), 0) / reviews.length).toFixed(1)
            );
        }
    } catch {
        reviews = [];
    }

    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <ProductDetailClient
                product={product}
                images={imgRes.rows}
                reviews={reviews}
                avgRating={avgRating}
                currentUser={currentUser}
            />
            <Footer />
        </div>
    );
}