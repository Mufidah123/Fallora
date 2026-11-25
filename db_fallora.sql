-- Langkah 1: jalankan baris CREATE DATABASE ini saja.
-- Langkah 2: connect ke database db_fallora, lalu jalankan seluruh sisa file ini.
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

CREATE INDEX idx_order_items_product
ON order_items(product_id);

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

-- ===========
-- INSERT DATA
-- ===========

-- Stores (Toko untuk Seller yang ACTIVE)
INSERT INTO stores (seller_id, name, description, image_path)
VALUES
    (
        (SELECT id FROM users WHERE username = 'rina_craft'),
        'Rina Craft & Living',
        'Produk fashion harian, tas rajut, aksesori, dan perlengkapan rumah terjangkau.',
        '/images/stores/rina-craft.png'
    ),
    (
        (SELECT id FROM users WHERE username = 'dimas_loom'),
        'Dimas Goods & Tech',
        'Aksesori elektronik, perlengkapan kerja, gaya hidup, dan kebutuhan harian.',
        '/images/stores/dimas-goods.png'
    )
ON CONFLICT (seller_id) DO NOTHING;

-- Categories (7 Kategori)
INSERT INTO categories (name, description)
VALUES
    ('Fashion & Pakaian', 'Kemeja, kaus, outer, dan pakaian harian nyaman untuk berbagai aktivitas.'),
    ('Tas & Aksesori', 'Tote bag, ransel, dompet, jam tangan, dan aksesori pelengkap gaya.'),
    ('Elektronik & Gadget', 'Earbuds, charger, kabel data, lampu meja, dan aksesori digital.'),
    ('Perlengkapan Rumah', 'Mug keramik, botol minum, wadah penyimpanan, dan kebutuhan rumah tangga.'),
    ('Perawatan Diri', 'Skincare, sabun mandi, lip balm, dan perawatan tubuh sehari-hari.'),
    ('Sepatu & Alas Kaki', 'Sneakers, sandal harian, kaus kaki, dan alas kaki kasual.'),
    ('Alat Tulis & Kantor', 'Buku catatan, pulpen, alas meja kerja, dan perlengkapan belajar.'),
    ('Hobi & Kerajinan', 'Perlengkapan merajut, benang rajut, bahan DIY, dan hobi kreatif.')
ON CONFLICT (name) DO NOTHING;

-- Products (Total: 35 produk)
INSERT INTO products (store_id, category_id, name, description, price, stock, is_active)
VALUES
    -- Kategori 1: Fashion & Pakaian (5 produk)
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Fashion & Pakaian'),
        'Kemeja Linen Lengan Pendek Polos',
        'Bahan katun linen adem, potongan santai cocok untuk kuliah atau kerja.',
        89000.00,
        25,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Fashion & Pakaian'),
        'Kaos Oversize Cotton Combed 24s',
        'Kaos katun tebal lembut dengan jahitan rapi dan warna tidak mudah pudar.',
        54000.00,
        40,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Fashion & Pakaian'),
        'Cardigan Rajut Ringan Unisex',
        'Outer rajut halus yang nyaman dipakai di ruangan ber-AC maupun perjalanan.',
        95000.00,
        18,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Fashion & Pakaian'),
        'Celana Chino Slim Fit Harian',
        'Celana bahan twill stretch yang fleksibel dan nyaman dipakai seharian.',
        115000.00,
        20,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Fashion & Pakaian'),
        'Kaus Polos Basic Pack Isi 2',
        'Paket hemat dua kaus polos harian dengan bahan menyerap keringat.',
        79000.00,
        30,
        TRUE
    ),

    -- Kategori 2: Tas & Aksesori (5 produk)
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Tas & Aksesori'),
        'Tote Bag Kanvas Resleting',
        'Tas bahu kanvas kuat dengan kompartemen dalam dan resleting aman.',
        45000.00,
        35,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Tas & Aksesori'),
        'Ransel Minimalis Anti Air 15 Inch',
        'Tas punggung fungsional dengan slot laptop dan bahan tahan percikan air.',
        149000.00,
        15,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Tas & Aksesori'),
        'Dompet Lipat Kulit Sintetis',
        'Dompet ringkas dengan banyak slot kartu dan tempat uang kertas rapi.',
        49000.00,
        28,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Tas & Aksesori'),
        'Jam Tangan Analog Strap Kulit',
        'Jam tangan kasual klasik dengan strap kulit lembut dan dial mudah dibaca.',
        125000.00,
        14,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Tas & Aksesori'),
        'Sling Bag Selempang Harian',
        'Tas selempang ringan untuk membawa ponsel, dompet, dan kunci.',
        58000.00,
        22,
        TRUE
    ),

    -- Kategori 3: Elektronik & Gadget (5 produk)
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Elektronik & Gadget'),
        'Wireless Earbuds Bluetooth 5.3',
        'Earbuds nirkabel dengan suara jernih, koneksi stabil, dan charging case ringkas.',
        135000.00,
        20,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Elektronik & Gadget'),
        'Kabel Data USB-C Braided 1.5m',
        'Kabel pengisian cepat berlapis anyaman nilon anti kusut.',
        32000.00,
        50,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Elektronik & Gadget'),
        'Charger Fast Charging 25W',
        'Adaptor daya ringkas dengan perlindungan suhu dan arus berlebih.',
        75000.00,
        24,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Elektronik & Gadget'),
        'Lampu Meja LED Baca Sentuh',
        'Lampu meja dengan tiga tingkat kecerahan dan pencahayaan ramah mata.',
        68000.00,
        19,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Elektronik & Gadget'),
        'Stand HP & Tablet Lipat Aluminium',
        'Penyangga perangkat sudut pandang adjustable untuk belajar atau meeting.',
        42000.00,
        32,
        TRUE
    ),

    -- Kategori 4: Perlengkapan Rumah (6 produk)
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perlengkapan Rumah'),
        'Mug Keramik Matte 350ml',
        'Cangkir keramik tebal untuk kopi, teh, atau minuman hangat sehari-hari.',
        35000.00,
        45,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perlengkapan Rumah'),
        'Storage Box Organizer Serbaguna',
        'Kotak penyimpanan lipat untuk merapikan pakaian, buku, atau barang kecil.',
        48000.00,
        27,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Perlengkapan Rumah'),
        'Diffuser Aroma Ruangan Minimalis',
        'Pelembap udara dan pengharum ruangan ukuran kompak untuk kamar atau meja kerja.',
        85000.00,
        16,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perlengkapan Rumah'),
        'Set Toples Kedap Udara 3 pcs',
        'Wadah penyimpanan bahan makanan atau camilan dengan tutup rapat.',
        52000.00,
        30,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perlengkapan Rumah'),
        'Keset Kaki Microfiber Anti Slip',
        'Keset berdaya serap tinggi dengan bagian bawah anti licin.',
        29000.00,
        40,
        TRUE
    ),
	(
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Perlengkapan Rumah'),
        'Botol Minum Kaca 600ml Tutup Kayu',
        'Tumbler kaca bening dengan penutup anti tumpah dan strap tenteng.',
        55000.00,
        26,
        TRUE
    ),

    -- Kategori 5: Perawatan Diri (4 produk)
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perawatan Diri'),
        'Facial Wash Gentle Hydrating 100ml',
        'Pembersih wajah lembut yang menjaga kelembapan kulit setiap hari.',
        38000.00,
        35,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perawatan Diri'),
        'Body Lotion Pelembap Harian 200ml',
        'Losion tubuh cepat meresap untuk kulit terasa halus dan terawat.',
        44000.00,
        28,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Perawatan Diri'),
        'Lip Balm Shea Butter Original',
        'Pelembap bibir praktis dibawa kemana saja agar tidak kering.',
        22000.00,
        55,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Perawatan Diri'),
        'Hand Cream Aromaterapi 50ml',
        'Krim tangan ukuran saku dengan aroma lembut menyegarkan.',
        27000.00,
        38,
        TRUE
    ),

    -- Kategori 6: Sepatu & Alas Kaki (4 produk)
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Sepatu & Alas Kaki'),
        'Sneakers Kasual Putih Harian',
        'Sepatu kets ringan dengan sol empuk untuk aktivitas santai maupun kampus.',
        159000.00,
        17,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Sepatu & Alas Kaki'),
        'Sandal Slide Empuk Anti Slip',
        'Sandal selop nyaman dipakai di rumah maupun jalan santai.',
        34000.00,
        42,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Sepatu & Alas Kaki'),
        'Kaus Kaki Crew Pack Isi 3 Pasang',
        'Kaus kaki katun elastis setinggi mata kaki/betis untuk sepatu kasual.',
        36000.00,
        50,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Sepatu & Alas Kaki'),
        'Slip-On Kanvas Nyaman',
        'Sepatu slip-on praktis tanpa tali dengan bantalan kaki empuk.',
        119000.00,
        21,
        TRUE
    ),

    -- Kategori 7: Alat Tulis & Kantor (3 produk)
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Alat Tulis & Kantor'),
        'Notebook Hardcover Grid A5',
        'Buku catatan rapi untuk kuliah, catatan harian, atau perencana tugas.',
        39000.00,
        36,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        (SELECT id FROM categories WHERE name = 'Alat Tulis & Kantor'),
        'Set Pulpen Gel Hitam 0.5mm (6 pcs)',
        'Pulpen tinta hitam lancar kering cepat untuk menulis catatan panjang.',
        25000.00,
        60,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Alat Tulis & Kantor'),
        'Desk Mat Kulit Sintetis Meja Kerja',
        'Alas meja kerja dan belajar yang rapi, halus, serta mudah dibersihkan.',
        47000.00,
        23,
        TRUE
    ),

    -- Kategori 8: Hobi & Kerajinan (3 produk)
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Hobi & Kerajinan'),
        'Benang Rajut Milk Cotton 5 Ply',
        'Benang rajut lembut tidak berbulu untuk amigurumi, syal, atau tas rajut.',
        18000.00,
        55,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Hobi & Kerajinan'),
        'Set Hakpen Crochet Gagang Silikon',
        'Paket jarum rajut ergonomis berbagai ukuran nyaman digenggam lama.',
        45000.00,
        24,
        TRUE
    ),
    (
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        (SELECT id FROM categories WHERE name = 'Hobi & Kerajinan'),
        'DIY Kit Gantungan Kunci Macrame',
        'Paket lengkap tali katun dan pengait untuk membuat kerajinan tangan sendiri.',
        32000.00,
        30,
        TRUE
    );

-- Product Images
INSERT INTO product_images (product_id, image_path, is_primary)
SELECT
    p.id,
    '/images/products/product-' || p.id || '.png',
    TRUE
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.is_primary = TRUE
);

-- Carts Awal untuk Buyer ACTIVE
INSERT INTO carts (buyer_id)
SELECT id
FROM users
WHERE role = 'BUYER' AND status = 'ACTIVE'
ON CONFLICT (buyer_id) DO NOTHING;

-- Contoh Data Pesanan (orders, sub_orders, order_items)
WITH inserted_order AS (
    INSERT INTO orders (
        buyer_id,
        order_number,
        total_amount,
        shipping_recipient,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code
    )
    VALUES (
        (SELECT id FROM users WHERE username = 'siti_rahma'),
        'ORD-FALLORA-1001',
        318000.00,
        'Siti Rahma',
        '081234560007',
        'Jl. A. P. Pettarani No. 45',
        'Makassar',
        '90222'
    )
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id
),
sub_rina AS (
    INSERT INTO sub_orders (order_id, store_id, subtotal, status)
    SELECT
        id,
        (SELECT id FROM stores WHERE name = 'Rina Craft & Living'),
        124000.00,
        'COMPLETED'
    FROM inserted_order
    RETURNING id
),
sub_dimas AS (
    INSERT INTO sub_orders (order_id, store_id, subtotal, status)
    SELECT
        id,
        (SELECT id FROM stores WHERE name = 'Dimas Goods & Tech'),
        194000.00,
        'COMPLETED'
    FROM inserted_order
    RETURNING id
)
INSERT INTO order_items (sub_order_id, product_id, product_name, price, quantity, subtotal)
SELECT
    (SELECT id FROM sub_rina),
    (SELECT id FROM products WHERE name = 'Tote Bag Kanvas Resleting' LIMIT 1),
    'Tote Bag Kanvas Resleting',
    45000.00,
    2,
    90000.00
WHERE EXISTS (SELECT 1 FROM sub_rina)
UNION ALL
SELECT
    (SELECT id FROM sub_rina),
    (SELECT id FROM products WHERE name = 'Mug Keramik Matte 350ml' LIMIT 1),
    'Mug Keramik Matte 350ml',
    35000.00,
    1,
    35000.00
WHERE EXISTS (SELECT 1 FROM sub_rina)
UNION ALL
SELECT
    (SELECT id FROM sub_dimas),
    (SELECT id FROM products WHERE name = 'Wireless Earbuds Bluetooth 5.3' LIMIT 1),
    'Wireless Earbuds Bluetooth 5.3',
    135000.00,
    1,
    135000.00
WHERE EXISTS (SELECT 1 FROM sub_dimas)
UNION ALL
SELECT
    (SELECT id FROM sub_dimas),
    (SELECT id FROM products WHERE name = 'Botol Minum Kaca 600ml Tutup Kayu' LIMIT 1),
    'Botol Minum Kaca 600ml Tutup Kayu',
    55000.00,
    1,
    55000.00
WHERE EXISTS (SELECT 1 FROM sub_dimas);