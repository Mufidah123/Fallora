import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const adminHash = await bcrypt.hash("Admin123!", 10);
    const sellerHash = await bcrypt.hash("Seller123!", 10);
    const buyerHash = await bcrypt.hash("Buyer123!", 10);

    const sql = `
    INSERT INTO users (
      name, username, email, phone, password_hash, profile_photo, role, status, rejection_reason
    )
    VALUES
      ('Admin Fallora', 'admin_fallora', 'admin@fallora.com', '081234560001', $1, NULL, 'ADMIN', 'ACTIVE', NULL),
      ('Rina Wulandari', 'rina_craft', 'rina.seller@fallora.com', '081234560002', $2, NULL, 'SELLER', 'ACTIVE', NULL),
      ('Dimas Pratama', 'dimas_loom', 'dimas.seller@fallora.com', '081234560003', $2, NULL, 'SELLER', 'ACTIVE', NULL),
      ('Budi Santoso', 'budi_store', 'budi.seller@fallora.com', '081234560004', $2, NULL, 'SELLER', 'PENDING', NULL),
      ('Ayu Lestari', 'ayu_autumn', 'ayu.seller@fallora.com', '081234560005', $2, NULL, 'SELLER', 'PENDING', NULL),
      ('Hendra Wijaya', 'hendra_shop', 'hendra.seller@fallora.com', '081234560006', $2, NULL, 'SELLER', 'REJECTED', 'Informasi identitas toko belum lengkap.'),
      ('Siti Rahma', 'siti_rahma', 'siti.buyer@fallora.com', '081234560007', $3, NULL, 'BUYER', 'ACTIVE', NULL),
      ('Fajar Nugroho', 'fajar_nugroho', 'fajar.buyer@fallora.com', '081234560008', $3, NULL, 'BUYER', 'ACTIVE', NULL),
      ('Nadia Putri', 'nadia_putri', 'nadia.buyer@fallora.com', '081234560009', $3, NULL, 'BUYER', 'ACTIVE', NULL)
    ON CONFLICT (email) DO NOTHING;
  `;

    try {
        await pool.query(sql, [adminHash, sellerHash, buyerHash]);
        console.log("Berhasil memasukkan 1 Admin, 5 Seller, dan 3 Buyer!");
    } catch (err) {
        console.error("Gagal insert users:", err);
    } finally {
        await pool.end();
    }
}

main();