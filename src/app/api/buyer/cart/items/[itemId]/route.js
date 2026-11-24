// src/app/api/buyer/cart/items/[itemId]/route.js
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request, context) {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const { itemId } = await context.params;
    const cartItemId = Number(itemId);
    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!Number.isInteger(cartItemId) || cartItemId <= 0 || !Number.isInteger(quantity)) {
        return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
    }

    // Pastikan item milik buyer yang sedang login
    const ownerRes = await query(
        `SELECT ci.id, ci.cart_id, p.stock
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = $1 AND c.buyer_id = $2
     LIMIT 1`,
        [cartItemId, session.userId]
    );

    const row = ownerRes.rows[0];
    if (!row) {
        return NextResponse.json({ message: "Item keranjang tidak ditemukan." }, { status: 404 });
    }

    if (quantity <= 0) {
        await query(`DELETE FROM cart_items WHERE id = $1`, [cartItemId]);
        return NextResponse.json({ message: "Item dihapus dari keranjang." });
    }

    if (quantity > row.stock) {
        return NextResponse.json(
            { message: `Stok maksimal tersedia ${row.stock} item.` },
            { status: 400 }
        );
    }

    await query(`UPDATE cart_items SET quantity = $1 WHERE id = $2`, [quantity, cartItemId]);
    return NextResponse.json({ message: "Jumlah produk diperbarui." });
}

export async function DELETE(_request, context) {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const { itemId } = await context.params;
    const cartItemId = Number(itemId);

    await query(
        `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.id = $1 AND ci.cart_id = c.id AND c.buyer_id = $2`,
        [cartItemId, session.userId]
    );

    return NextResponse.json({ message: "Item dihapus." });
}