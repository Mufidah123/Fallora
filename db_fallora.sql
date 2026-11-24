CREATE DATABASE db_fallora;

-- 1. USERS
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    profile_photo TEXT,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'SELLER', 'BUYER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PENDING', 'REJECTED')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. STORES
CREATE TABLE stores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id BIGINT NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCTS
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id BIGINT NOT NULL
        REFERENCES stores(id) ON DELETE RESTRICT,
    category_id BIGINT NOT NULL
        REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL
        CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0
        CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCT IMAGES
CREATE TABLE product_images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Maksimal satu gambar utama per produk
CREATE UNIQUE INDEX unique_primary_product_image
ON product_images(product_id)
WHERE is_primary = TRUE;

-- 6. WISHLIST ITEMS (OPTIONAL FEATURE)
CREATE TABLE wishlist_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    buyer_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_buyer_wishlist_product
        UNIQUE (buyer_id, product_id)
);

-- 7. CARTS
CREATE TABLE carts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    buyer_id BIGINT NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. CART ITEMS
CREATE TABLE cart_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id BIGINT NOT NULL
        REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1
        CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cart_product
        UNIQUE (cart_id, product_id)
);

-- 9. ADDRESSES
CREATE TABLE addresses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    buyer_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Satu Buyer hanya memiliki satu alamat default
CREATE UNIQUE INDEX unique_default_address
ON addresses(buyer_id)
WHERE is_default = TRUE;

-- 10. ORDERS (ORDER INDUK)
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    buyer_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    total_amount NUMERIC(14,2) NOT NULL
        CHECK (total_amount >= 0),
		
    -- Snapshot alamat ketika checkout
    shipping_recipient VARCHAR(100) NOT NULL,
    shipping_phone VARCHAR(30) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(10) NOT NULL,

    -- Referensi alamat tersimpan (boleh NULL)
    address_id BIGINT
        REFERENCES addresses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. SUB ORDERS
CREATE TABLE sub_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL
        REFERENCES stores(id) ON DELETE RESTRICT,
    subtotal NUMERIC(14,2) NOT NULL
        CHECK (subtotal >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
        CHECK (
            status IN (
                'PENDING_PAYMENT',
                'PROCESSING',
                'SHIPPED',
                'COMPLETED',
                'CANCELLED'
            )
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_store
        UNIQUE (order_id, store_id)
);

-- 12. ORDER ITEMS
CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sub_order_id BIGINT NOT NULL
        REFERENCES sub_orders(id) ON DELETE CASCADE,
    product_id BIGINT
        REFERENCES products(id) ON DELETE SET NULL,
		
    -- Snapshot informasi produk ketika dibeli
    product_name VARCHAR(200) NOT NULL,
    price NUMERIC(12,2) NOT NULL
        CHECK (price >= 0),
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    subtotal NUMERIC(14,2) NOT NULL
        CHECK (subtotal >= 0)
);

-- 13. REVIEWS
CREATE TABLE reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_item_id BIGINT NOT NULL UNIQUE
        REFERENCES order_items(id) ON DELETE RESTRICT,
    buyer_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    product_id BIGINT
        REFERENCES products(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL
        CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_products_store
ON products(store_id);

CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_products_name
ON products(name);

CREATE INDEX idx_product_images_product
ON product_images(product_id);

CREATE INDEX idx_wishlist_buyer
ON wishlist_items(buyer_id);

CREATE INDEX idx_cart_items_cart
ON cart_items(cart_id);

CREATE INDEX idx_orders_buyer
ON orders(buyer_id);

CREATE INDEX idx_orders_created
ON orders(created_at);

CREATE INDEX idx_sub_orders_order
ON sub_orders(order_id);

CREATE INDEX idx_sub_orders_store
ON sub_orders(store_id);

CREATE INDEX idx_sub_orders_status
ON sub_orders(status);

CREATE INDEX idx_order_items_sub_order
ON order_items(sub_order_id);

CREATE INDEX idx_reviews_product
ON reviews(product_id);

CREATE INDEX idx_addresses_buyer
ON addresses(buyer_id);

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public';

-- SEED DATA USERS: 1 ADMIN, 5 SELLER, 3 BUYER
-- ============================================
-- Password Default
-- Admin  : Admin123!
-- Seller : Seller123!
-- Buyer  : Buyer123!
-- ============================================

INSERT INTO users (
    name,
    username,
    email,
    phone,
    password_hash,
    profile_photo,
    role,
    status,
    rejection_reason
)
VALUES
    -- 1 ADMIN (always ACTIVE)
    (
        'Admin Fallora',
        'admin_fallora',
        'admin@fallora.com',
        '081234560001',
        '$2b$10$fcsDIUVNaHC8qrn.LI4D2eK6QYQ70uqP0Z2NT/D/nLcR4249DIH1y',
        NULL,
        'ADMIN',
        'ACTIVE',
        NULL
    ),

    -- 5 SELLERS
    (
        'Rina Wulandari',
        'rina_craft',
        'rina.seller@fallora.com',
        '081234560002',
        '$2b$10$2yj2yjsgaY1J7t9Lhqg88u6ZXWlQIGQOOoyYMpOLm8scrU1CxlQT.',
        NULL,
        'SELLER',
        'ACTIVE',
        NULL
    ),
    (
        'Dimas Pratama',
        'dimas_loom',
        'dimas.seller@fallora.com',
        '081234560003',
        '$2b$10$2yj2yjsgaY1J7t9Lhqg88u6ZXWlQIGQOOoyYMpOLm8scrU1CxlQT.',
        NULL,
        'SELLER',
        'ACTIVE',
        NULL
    ),
    (
        'Budi Santoso',
        'budi_store',
        'budi.seller@fallora.com',
        '081234560004',
        '$2b$10$2yj2yjsgaY1J7t9Lhqg88u6ZXWlQIGQOOoyYMpOLm8scrU1CxlQT.',
        NULL,
        'SELLER',
        'PENDING',
        NULL
    ),
    (
        'Ayu Lestari',
        'ayu_autumn',
        'ayu.seller@fallora.com',
        '081234560005',
        '$2b$10$2yj2yjsgaY1J7t9Lhqg88u6ZXWlQIGQOOoyYMpOLm8scrU1CxlQT.',
        NULL,
        'SELLER',
        'PENDING',
        NULL
    ),
    (
        'Hendra Wijaya',
        'hendra_shop',
        'hendra.seller@fallora.com',
        '081234560006',
        '$2b$10$2yj2yjsgaY1J7t9Lhqg88u6ZXWlQIGQOOoyYMpOLm8scrU1CxlQT.',
        NULL,
        'SELLER',
        'REJECTED',
        'Informasi identitas toko belum lengkap.'
    ),

    -- 3 BUYERS (ACTIVE)
    (
        'Siti Rahma',
        'siti_rahma',
        'siti.buyer@fallora.com',
        '081234560007',
        '$2b$10$uSparrgKoL59PYf1iZcVQODY.GLxFt1FAy7ehhj48RfJbVg70toF.',
        NULL,
        'BUYER',
        'ACTIVE',
        NULL
    ),
    (
        'Fajar Nugroho',
        'fajar_nugroho',
        'fajar.buyer@fallora.com',
        '081234560008',
        '$2b$10$uSparrgKoL59PYf1iZcVQODY.GLxFt1FAy7ehhj48RfJbVg70toF.',
        NULL,
        'BUYER',
        'ACTIVE',
        NULL
    ),
    (
        'Nadia Putri',
        'nadia_putri',
        'nadia.buyer@fallora.com',
        '081234560009',
        '$2b$10$uSparrgKoL59PYf1iZcVQODY.GLxFt1FAy7ehhj48RfJbVg70toF.',
        NULL,
        'BUYER',
        'ACTIVE',
        NULL
    )
ON CONFLICT (email) DO NOTHING;