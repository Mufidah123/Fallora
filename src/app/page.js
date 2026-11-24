import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import HomepageClient from "@/components/home/HomepageClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  let currentUser = null;
  let initialCartCount = 0;

  if (session?.userId) {
    const userRes = await query(
      `SELECT id, name, username, email, profile_photo, role, status
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [session.userId]
    );
    currentUser = userRes.rows[0] || null;

    if (currentUser?.role === "BUYER") {
      const cartRes = await query(
        `SELECT COALESCE(SUM(ci.quantity), 0)::int AS total_items
         FROM carts c
         LEFT JOIN cart_items ci ON ci.cart_id = c.id
         WHERE c.buyer_id = $1`,
        [currentUser.id]
      );
      initialCartCount = cartRes.rows[0]?.total_items || 0;
    }
  }

  const isBuyer = currentUser?.role === "BUYER";
  const initialLimit = isBuyer ? 8 : 5;

  // Kategori dari database
  const categoriesRes = await query(
    `SELECT id, name, description
     FROM categories
     ORDER BY name ASC`
  );

  // Produk Terlaris (Popular Items) berdasarkan total quantity terjual
  const popularRes = await query(
    `SELECT p.id, p.name, p.description, p.price, p.stock,
        c.id AS category_id, c.name AS category_name,
        s.id AS store_id, s.name AS store_name,
        pi.image_path AS primary_image,
        COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN oi.quantity ELSE 0 END), 0)::int AS sold_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN sub_orders so ON so.id = oi.sub_order_id
      WHERE p.is_active = TRUE
      GROUP BY p.id, c.id, s.id, pi.image_path
      ORDER BY sold_count DESC, p.created_at DESC LIMIT 5`
  );

  // Rekomendasi Produk Secara Acak (Khusus Buyer yang login)
  let recommendedProducts = [];
  if (isBuyer) {
    const recRes = await query(
      `SELECT p.id, p.name, p.description, p.price, p.stock,
          c.id AS category_id, c.name AS category_name,
          s.id AS store_id, s.name AS store_name,
          pi.image_path AS primary_image,
          COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN oi.quantity ELSE 0 END), 0)::int AS sold_count
        FROM products p
        JOIN categories c ON c.id = p.category_id
        JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN sub_orders so ON so.id = oi.sub_order_id
        WHERE p.is_active = TRUE AND p.stock > 0
        GROUP BY p.id, c.id, s.id, pi.image_path
        ORDER BY RANDOM() LIMIT 5`
    );
    recommendedProducts = recRes.rows;
  }

  const totalRes = await query(
    `SELECT COUNT(*)::int AS total FROM products WHERE is_active = TRUE`
  );
  const totalProducts = totalRes.rows[0]?.total || 0;

  const allProductsRes = await query(
    `SELECT p.id, p.name, p.description, p.price, p.stock,
       c.id AS category_id, c.name AS category_name, s.id AS store_id, s.name AS store_name,
       pi.image_path AS primary_image,
       COALESCE(SUM(CASE WHEN so.status <> 'CANCELLED' THEN oi.quantity ELSE 0 END), 0)::int AS sold_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN stores s ON s.id = p.store_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN sub_orders so ON so.id = oi.sub_order_id
     WHERE p.is_active = TRUE
     GROUP BY p.id, c.id, s.id, pi.image_path
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [initialLimit]
  );

  return (
    <HomepageClient
      currentUser={currentUser}
      initialCategories={categoriesRes.rows}
      popularProducts={popularRes.rows}
      recommendedProducts={recommendedProducts}
      initialAllProducts={allProductsRes.rows}
      initialHasMore={allProductsRes.rows.length < totalProducts}
      initialCartCount={initialCartCount}
    />
  );
}