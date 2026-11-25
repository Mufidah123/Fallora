"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import pool, { query } from "@/lib/db";
import { requireSeller, requireStore } from "@/lib/guards";
import { isFile, saveImage, removeUploaded } from "@/lib/upload";
import { ORDER_FLOW } from "@/lib/format";

const MAX_IMAGES = 5;

const text = (fd, key) => String(fd.get(key) ?? "").trim();

// ---------- TOKO ----------
export async function saveStore(_prev, fd) {
    const { user, store } = await requireSeller();

    const name = text(fd, "name");
    const description = text(fd, "description");
    if (!name) return { error: "Nama toko wajib diisi." };
    if (name.length > 150) return { error: "Nama toko maksimal 150 karakter." };
    if (!description) return { error: "Deskripsi toko wajib diisi." };

    let imagePath = store?.image_path || null;
    const file = fd.get("image");
    if (isFile(file)) {
        try {
            const saved = await saveImage(file);
            await removeUploaded(imagePath);
            imagePath = saved;
        } catch (err) {
            return { error: err.message };
        }
    }

    if (store) {
        await query(
            `UPDATE stores SET name = $1, description = $2, image_path = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4`,
            [name, description, imagePath, store.id]
        );
    } else {
        await query(
            `INSERT INTO stores (seller_id, name, description, image_path) VALUES ($1, $2, $3, $4)`,
            [user.id, name, description, imagePath]
        );
    }

    revalidatePath("/seller/dashboard", "layout");
    return { ok: "Informasi toko tersimpan." };
}

// ---------- PRODUK ----------
async function readProductFields(fd) {
    const name = text(fd, "name");
    const description = text(fd, "description");
    const price = Number(text(fd, "price"));
    const stockRaw = text(fd, "stock");
    const stock = Number(stockRaw);
    const categoryId = Number(text(fd, "category_id"));

    if (!name) return { error: "Nama produk wajib diisi." };
    if (name.length > 200) return { error: "Nama produk maksimal 200 karakter." };
    if (!description) return { error: "Deskripsi produk wajib diisi." };
    if (!Number.isFinite(price) || price <= 0) return { error: "Harga harus berupa angka lebih dari 0." };
    if (price > 9999999999) return { error: "Harga terlalu besar." };
    if (stockRaw === "" || !Number.isInteger(stock) || stock < 0) {
        return { error: "Stok harus berupa bilangan bulat, minimal 0." };
    }
    if (!Number.isInteger(categoryId) || categoryId <= 0) return { error: "Pilih kategori produk." };

    const cat = await query(`SELECT id FROM categories WHERE id = $1`, [categoryId]);
    if (!cat.rows[0]) return { error: "Kategori tidak ditemukan." };

    return { values: { name, description, price, stock, categoryId } };
}

async function saveAll(files) {
    const saved = [];
    try {
        for (const f of files) saved.push(await saveImage(f));
    } catch (err) {
        await Promise.all(saved.map(removeUploaded));
        throw err;
    }
    return saved;
}

export async function createProduct(_prev, fd) {
    const { store } = await requireStore();

    const parsed = await readProductFields(fd);
    if (parsed.error) return { error: parsed.error };
    const v = parsed.values;

    const files = fd.getAll("images").filter(isFile);
    if (files.length === 0) return { error: "Unggah minimal satu gambar produk." };
    if (files.length > MAX_IMAGES) return { error: `Maksimal ${MAX_IMAGES} gambar per produk.` };

    let paths;
    try {
        paths = await saveAll(files);
    } catch (err) {
        return { error: err.message };
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const ins = await client.query(
            `INSERT INTO products (store_id, category_id, name, description, price, stock)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [store.id, v.categoryId, v.name, v.description, v.price, v.stock]
        );
        const productId = ins.rows[0].id;
        for (let i = 0; i < paths.length; i += 1) {
            await client.query(
                `INSERT INTO product_images (product_id, image_path, is_primary) VALUES ($1, $2, $3)`,
                [productId, paths[i], i === 0]
            );
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        await Promise.all(paths.map(removeUploaded));
        console.error("CREATE_PRODUCT_ERROR:", err);
        return { error: "Produk gagal disimpan. Coba lagi." };
    } finally {
        client.release();
    }

    revalidatePath("/seller/dashboard", "layout");
    redirect("/seller/dashboard/products");
}

export async function updateProduct(_prev, fd) {
    const { store } = await requireStore();
    const productId = Number(text(fd, "id"));

    const own = await query(`SELECT id FROM products WHERE id = $1 AND store_id = $2`, [productId, store.id]);
    if (!own.rows[0]) return { error: "Produk tidak ditemukan di toko Anda." };

    const parsed = await readProductFields(fd);
    if (parsed.error) return { error: parsed.error };
    const v = parsed.values;

    const removeIds = fd
        .getAll("remove")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);
    const files = fd.getAll("images").filter(isFile);

    const current = await query(`SELECT id, image_path FROM product_images WHERE product_id = $1`, [productId]);
    const toRemove = current.rows.filter((r) => removeIds.includes(Number(r.id)));
    const remaining = current.rows.length - toRemove.length;

    if (remaining + files.length < 1) return { error: "Produk harus punya minimal satu gambar." };
    if (remaining + files.length > MAX_IMAGES) return { error: `Maksimal ${MAX_IMAGES} gambar per produk.` };

    let newPaths;
    try {
        newPaths = await saveAll(files);
    } catch (err) {
        return { error: err.message };
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `UPDATE products SET name = $1, description = $2, price = $3, stock = $4,
            category_id = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND store_id = $7`,
            [v.name, v.description, v.price, v.stock, v.categoryId, productId, store.id]
        );
        if (toRemove.length) {
            await client.query(`DELETE FROM product_images WHERE product_id = $1 AND id = ANY($2::bigint[])`, [
                productId,
                toRemove.map((r) => r.id),
            ]);
        }
        for (const p of newPaths) {
            await client.query(
                `INSERT INTO product_images (product_id, image_path, is_primary) VALUES ($1, $2, FALSE)`,
                [productId, p]
            );
        }
        // Pastikan tepat satu gambar utama (index unik: maksimal satu per produk)
        await client.query(`UPDATE product_images SET is_primary = FALSE WHERE product_id = $1`, [productId]);
        await client.query(
            `UPDATE product_images SET is_primary = TRUE
            WHERE id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY id ASC LIMIT 1)`,
            [productId]
        );
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        await Promise.all(newPaths.map(removeUploaded));
        console.error("UPDATE_PRODUCT_ERROR:", err);
        return { error: "Perubahan gagal disimpan. Coba lagi." };
    } finally {
        client.release();
    }

    await Promise.all(toRemove.map((r) => removeUploaded(r.image_path)));
    revalidatePath("/seller/dashboard", "layout");
    redirect("/seller/dashboard/products");
}

export async function deleteProduct(_prev, fd) {
    const { store } = await requireStore();
    const productId = Number(text(fd, "id"));

    const client = await pool.connect();
    let imagePaths = [];
    try {
        await client.query("BEGIN");
        const own = await client.query(`SELECT id FROM products WHERE id = $1 AND store_id = $2`, [productId, store.id]);
        if (!own.rows[0]) {
            await client.query("ROLLBACK");
            return { error: "Produk tidak ditemukan di toko Anda." };
        }
        const imgs = await client.query(`SELECT image_path FROM product_images WHERE product_id = $1`, [productId]);
        imagePaths = imgs.rows.map((r) => r.image_path);

        // cart_items.product_id memakai ON DELETE RESTRICT, jadi kosongkan dulu
        await client.query(`DELETE FROM cart_items WHERE product_id = $1`, [productId]);
        await client.query(`DELETE FROM products WHERE id = $1`, [productId]);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("DELETE_PRODUCT_ERROR:", err);
        return { error: "Produk gagal dihapus." };
    } finally {
        client.release();
    }

    await Promise.all(imagePaths.map(removeUploaded));
    revalidatePath("/seller/dashboard", "layout");
    return { ok: "Produk dihapus." };
}

// ---------- PESANAN ----------
export async function updateOrderStatus(_prev, fd) {
    const { store } = await requireStore();
    const subOrderId = Number(text(fd, "sub_order_id"));
    const next = text(fd, "status");

    if (!Number.isInteger(subOrderId) || subOrderId <= 0) return { error: "Pesanan tidak valid." };

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const res = await client.query(
            `SELECT id, status FROM sub_orders WHERE id = $1 AND store_id = $2 FOR UPDATE`,
            [subOrderId, store.id]
        );
        const sub = res.rows[0];
        if (!sub) {
            await client.query("ROLLBACK");
            return { error: "Pesanan tidak ditemukan di toko Anda." };
        }
        if (!(ORDER_FLOW[sub.status] || []).includes(next)) {
            await client.query("ROLLBACK");
            return { error: "Perubahan status tersebut tidak diizinkan." };
        }

        await client.query(
            `UPDATE sub_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [next, subOrderId]
        );

        // Pesanan dibatalkan -> stok dikembalikan (stok dipotong saat checkout)
        if (next === "CANCELLED") {
            await client.query(
                `UPDATE products p SET stock = p.stock + oi.quantity, updated_at = CURRENT_TIMESTAMP
                FROM order_items oi
                WHERE oi.sub_order_id = $1 AND oi.product_id = p.id`,
                [subOrderId]
            );
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("UPDATE_ORDER_STATUS_ERROR:", err);
        return { error: "Status pesanan gagal diperbarui." };
    } finally {
        client.release();
    }

    revalidatePath("/seller/dashboard", "layout");
    return { ok: "Status diperbarui." };
}
