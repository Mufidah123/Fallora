import { query } from "@/lib/db";

const BASE_PRODUCT_SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.stock, p.created_at,
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
`;

export async function getAllCategories() {
    const res = await query(
        `SELECT id, name, description FROM categories
        ORDER BY name ASC`
    );
    return res.rows;
}

export async function getPopularProducts(limit = 5) {
    const res = await query(
        `${BASE_PRODUCT_SELECT}
        WHERE p.is_active = TRUE
        GROUP BY p.id, c.id, c.name, s.id, s.name, pi.image_path
        ORDER BY sold_count DESC, p.created_at DESC
        LIMIT $1`,
            [limit]
    );
    return res.rows;
}

export async function getRandomRecommendedProducts(limit = 5) {
    const res = await query(
        `${BASE_PRODUCT_SELECT}
        WHERE p.is_active = TRUE AND p.stock > 0
        GROUP BY p.id, c.id, c.name, s.id, s.name, pi.image_path
        ORDER BY RANDOM()
        LIMIT $1`,
            [limit]
    );
    return res.rows;
}

export async function getCatalogProducts({
    q = "",
    categoryId = null,
    limit = 10,
    offset = 0,
} = {}) {
    const conditions = ["p.is_active = TRUE"];
    const params = [];

    if (q.trim()) {
        params.push(`%${q.trim()}%`);
        conditions.push(`p.name ILIKE $${params.length}`);
    }

    if (categoryId && Number(categoryId) > 0) {
        params.push(Number(categoryId));
        conditions.push(`p.category_id = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countRes = await query(
        `SELECT COUNT(*)::int AS total FROM products p
        ${whereClause}`,
        params
    );
    const total = countRes.rows[0]?.total || 0;

    const listParams = [...params, limit, offset];
    const productsRes = await query(
        `${BASE_PRODUCT_SELECT}
        ${whereClause}
        GROUP BY p.id, c.id, c.name, s.id, s.name, pi.image_path
        ORDER BY p.created_at DESC
        LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
    );

    return {
        products: productsRes.rows,
        total,
        hasMore: offset + productsRes.rows.length < total,
    };
}

export async function getBuyerHeaderContext(userId) {
    if (!userId) {
        return { currentUser: null, initialCartCount: 0 };
    }

    const userRes = await query(
        `SELECT id, name, username, email, profile_photo, role, status
        FROM users WHERE id = $1 LIMIT 1`, [userId]
    );

    const currentUser = userRes.rows[0] || null;
    let initialCartCount = 0;

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

    return { currentUser, initialCartCount };
}