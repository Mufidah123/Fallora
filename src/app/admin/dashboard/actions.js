"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import pool, { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { hashPassword } from "@/lib/auth";
import { removeUploaded } from "@/lib/upload";

const text = (fd, key) => String(fd.get(key) ?? "").trim();
const refresh = () => revalidatePath("/admin/dashboard", "layout");

// ---------- VERIFIKASI SELLER ----------
export async function approveSeller(_prev, fd) {
    await requireAdmin();
    const id = Number(text(fd, "id"));

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const res = await client.query(
            `UPDATE users SET status = 'ACTIVE', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND role = 'SELLER' RETURNING id, name`,
            [id]
        );
        if (!res.rows[0]) {
            await client.query("ROLLBACK");
            return { error: "Seller tidak ditemukan." };
        }
        // Siapkan toko bawaan agar seller bisa langsung menambah produk
        await client.query(
            `INSERT INTO stores (seller_id, name, description)
            VALUES ($1, $2, 'Toko baru di Fallora.') ON CONFLICT (seller_id) DO NOTHING`,
            [id, `Toko ${res.rows[0].name}`]
        );
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("APPROVE_SELLER_ERROR:", err);
        return { error: "Gagal menyetujui seller." };
    } finally {
        client.release();
    }

    refresh();
    return { ok: "Seller disetujui." };
}

export async function rejectSeller(_prev, fd) {
    await requireAdmin();
    const id = Number(text(fd, "id"));
    const reason = text(fd, "reason");
    if (reason.length < 5) return { error: "Tulis alasan penolakan (minimal 5 karakter)." };

    const res = await query(
        `UPDATE users SET status = 'REJECTED', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND role = 'SELLER' RETURNING id`,
        [reason, id]
    );
    if (!res.rows[0]) return { error: "Seller tidak ditemukan." };

    refresh();
    return { ok: "Seller ditolak." };
}

// ---------- USER ----------
export async function updateUser(_prev, fd) {
    const admin = await requireAdmin();
    const id = Number(text(fd, "id"));

    const name = text(fd, "name");
    const username = text(fd, "username").toLowerCase();
    const email = text(fd, "email").toLowerCase();
    const phone = text(fd, "phone") || null;
    const status = text(fd, "status");
    const newPassword = String(fd.get("password") ?? "");

    if (!name || !username || !email) return { error: "Nama, username, dan email wajib diisi." };
    if (!/^[a-z0-9_.]{3,50}$/.test(username)) {
        return { error: "Username 3-50 karakter: huruf kecil, angka, titik, atau garis bawah." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Format email tidak valid." };
    if (newPassword && newPassword.length < 6) return { error: "Password baru minimal 6 karakter." };

    const target = await query(`SELECT id, role FROM users WHERE id = $1`, [id]);
    if (!target.rows[0]) return { error: "Pengguna tidak ditemukan." };

    // Status hanya relevan untuk Seller; Admin/Buyer selalu ACTIVE
    let nextStatus = "ACTIVE";
    if (target.rows[0].role === "SELLER") {
        if (!["ACTIVE", "PENDING", "REJECTED"].includes(status)) return { error: "Status tidak valid." };
        nextStatus = status;
    }
    if (id === admin.id) nextStatus = "ACTIVE";

    try {
        const params = [name, username, email, phone, nextStatus, id];
        let sql = `UPDATE users SET name = $1, username = $2, email = $3, phone = $4,
            status = $5, updated_at = CURRENT_TIMESTAMP`;
        if (nextStatus !== "REJECTED") sql += `, rejection_reason = NULL`;
        if (newPassword) {
            params.push(await hashPassword(newPassword));
            sql += `, password_hash = $${params.length}`;
        }
        await query(`${sql} WHERE id = $6`, params);
    } catch (err) {
        if (err.code === "23505") {
            return { error: String(err.detail || "").includes("email") ? "Email sudah dipakai akun lain." : "Username sudah dipakai akun lain." };
        }
        console.error("UPDATE_USER_ERROR:", err);
        return { error: "Gagal menyimpan perubahan." };
    }

    refresh();
    redirect("/admin/dashboard/users");
}

export async function deleteUser(_prev, fd) {
    const admin = await requireAdmin();
    const id = Number(text(fd, "id"));
    if (id === admin.id) return { error: "Anda tidak bisa menghapus akun sendiri." };

    const client = await pool.connect();
    let files = [];
    try {
        await client.query("BEGIN");
        const found = await client.query(`SELECT id, role FROM users WHERE id = $1`, [id]);
        if (!found.rows[0]) {
            await client.query("ROLLBACK");
            return { error: "Pengguna tidak ditemukan." };
        }

        if (found.rows[0].role === "SELLER") {
            const store = await client.query(`SELECT id, image_path FROM stores WHERE seller_id = $1`, [id]);
            if (store.rows[0]) {
                const sold = await client.query(`SELECT 1 FROM sub_orders WHERE store_id = $1 LIMIT 1`, [store.rows[0].id]);
                if (sold.rows[0]) {
                    await client.query("ROLLBACK");
                    return { error: "Seller ini sudah punya riwayat pesanan, jadi tidak bisa dihapus." };
                }
                const imgs = await client.query(
                    `SELECT pi.image_path FROM product_images pi JOIN products p ON p.id = pi.product_id WHERE p.store_id = $1`,
                    [store.rows[0].id]
                );
                files = [store.rows[0].image_path, ...imgs.rows.map((r) => r.image_path)];
                await client.query(
                    `DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE store_id = $1)`,
                    [store.rows[0].id]
                );
                await client.query(`DELETE FROM products WHERE store_id = $1`, [store.rows[0].id]);
            }
        }

        await client.query(`DELETE FROM users WHERE id = $1`, [id]);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        if (err.code === "23503") {
            return { error: "Pengguna ini masih punya data pesanan atau ulasan, jadi tidak bisa dihapus." };
        }
        console.error("DELETE_USER_ERROR:", err);
        return { error: "Gagal menghapus pengguna." };
    } finally {
        client.release();
    }

    await Promise.all(files.map(removeUploaded));
    refresh();
    return { ok: "Pengguna dihapus." };
}

// ---------- KATEGORI ----------
export async function createCategory(_prev, fd) {
    await requireAdmin();
    const name = text(fd, "name");
    const description = text(fd, "description") || null;
    if (!name) return { error: "Nama kategori wajib diisi." };
    if (name.length > 100) return { error: "Nama kategori maksimal 100 karakter." };

    try {
        await query(`INSERT INTO categories (name, description) VALUES ($1, $2)`, [name, description]);
    } catch (err) {
        if (err.code === "23505") return { error: "Kategori dengan nama itu sudah ada." };
        console.error("CREATE_CATEGORY_ERROR:", err);
        return { error: "Gagal menambah kategori." };
    }
    revalidatePath("/", "layout");
    return { ok: "Kategori ditambahkan." };
}

export async function updateCategory(_prev, fd) {
    await requireAdmin();
    const id = Number(text(fd, "id"));
    const name = text(fd, "name");
    const description = text(fd, "description") || null;
    if (!name) return { error: "Nama kategori wajib diisi." };
    if (name.length > 100) return { error: "Nama kategori maksimal 100 karakter." };

    try {
        const res = await query(`UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING id`, [name, description, id]);
        if (!res.rows[0]) return { error: "Kategori tidak ditemukan." };
    } catch (err) {
        if (err.code === "23505") return { error: "Kategori dengan nama itu sudah ada." };
        console.error("UPDATE_CATEGORY_ERROR:", err);
        return { error: "Gagal menyimpan kategori." };
    }
    revalidatePath("/", "layout");
    return { ok: "Tersimpan." };
}

export async function deleteCategory(_prev, fd) {
    await requireAdmin();
    const id = Number(text(fd, "id"));

    const used = await query(`SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1`, [id]);
    if (used.rows[0].n > 0) {
        return { error: `Kategori masih dipakai ${used.rows[0].n} produk, tidak bisa dihapus.` };
    }
    await query(`DELETE FROM categories WHERE id = $1`, [id]);
    revalidatePath("/", "layout");
    return { ok: "Kategori dihapus." };
}

// ---------- MODERASI PRODUK ----------
export async function deleteProductAsAdmin(_prev, fd) {
    await requireAdmin();
    const id = Number(text(fd, "id"));

    const client = await pool.connect();
    let files = [];
    try {
        await client.query("BEGIN");
        const imgs = await client.query(`SELECT image_path FROM product_images WHERE product_id = $1`, [id]);
        files = imgs.rows.map((r) => r.image_path);
        await client.query(`DELETE FROM cart_items WHERE product_id = $1`, [id]);
        const res = await client.query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
        if (!res.rows[0]) {
            await client.query("ROLLBACK");
            return { error: "Produk tidak ditemukan." };
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("ADMIN_DELETE_PRODUCT_ERROR:", err);
        return { error: "Gagal menghapus produk." };
    } finally {
        client.release();
    }

    await Promise.all(files.map(removeUploaded));
    refresh();
    return { ok: "Produk dihapus." };
}
