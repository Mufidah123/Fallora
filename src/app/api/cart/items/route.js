import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { message: "Silakan login terlebih dahulu.", requireLogin: true },
                { status: 401 }
            );
        }

        if (session.role !== "BUYER") {
            return NextResponse.json(
                { message: "Hanya akun Buyer yang dapat menambahkan produk ke keranjang." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const productId = Number(body.productId);
        const addQty = Math.max(Number(body.quantity || 1), 1);

        if (!Number.isInteger(productId) || productId <= 0) {
            return NextResponse.json(
                { message: "Produk tidak valid." },
                { status: 400 }
            );
        }

        // Cek stok & status aktif produk
        const productRes = await query(
            `SELECT id, name, stock, is_active FROM products WHERE id = $1 LIMIT 1`,
            [productId]
        );
        const product = productRes.rows[0];

        if (!product || !product.is_active) {
            return NextResponse.json(
                { message: "Produk tidak tersedia." },
                { status: 404 }
            );
        }

        if (product.stock < addQty) {
            return NextResponse.json(
                { message: "Stok produk tidak mencukupi." },
                { status: 400 }
            );
        }

        // Memastikan Buyer memiliki row di tabel carts
        const cartRes = await query(
            `INSERT INTO carts (buyer_id)
            VALUES ($1)
            ON CONFLICT (buyer_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
            RETURNING id`,
            [session.userId]
        );
        const cartId = cartRes.rows[0].id;

        // Cek apakah produk sudah ada di cart_items
        const existingItemRes = await query(
            `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 LIMIT 1`,
            [cartId, productId]
        );

        if (existingItemRes.rows[0]) {
            const nextQty = existingItemRes.rows[0].quantity + addQty;
            if (nextQty > product.stock) {
                return NextResponse.json(
                    { message: `Maksimal pembelian untuk produk ini adalah ${product.stock} item.` },
                    { status: 400 }
                );
            }

            await query(
                `UPDATE cart_items SET quantity = $1 WHERE id = $2`,
                [nextQty, existingItemRes.rows[0].id]
            );
        } else {
            await query(
                `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [cartId, productId, addQty]
            );
        }

        // Hitung total item di keranjang untuk update badge navbar
        const countRes = await query(
            `SELECT COALESCE(SUM(quantity), 0)::int AS total_items
            FROM cart_items
            WHERE cart_id = $1`,
            [cartId]
        );

        return NextResponse.json(
            {
                message: `"${product.name}" berhasil ditambahkan ke keranjang.`,
                cartCount: countRes.rows[0]?.total_items || 0,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("ADD_TO_CART_ERROR:", err);
        return NextResponse.json(
            { message: "Gagal menambahkan produk ke keranjang." },
            { status: 500 }
        );
    }
}