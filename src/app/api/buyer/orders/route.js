import { NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const ordersRes = await query(
        `SELECT o.id, o.order_number, o.total_amount, o.shipping_recipient,
        o.shipping_phone, o.shipping_address, o.shipping_city,
        o.shipping_postal_code, o.created_at
        FROM orders o
        WHERE o.buyer_id = $1
        ORDER BY o.created_at DESC`,
            [session.userId]
    );

    const subRes = await query(
        `SELECT
       so.id AS sub_order_id,
       so.order_id,
       so.store_id,
       s.name AS store_name,
       so.subtotal,
       so.status,
       so.updated_at
     FROM sub_orders so
     JOIN orders o ON o.id = so.order_id
     JOIN stores s ON s.id = so.store_id
     WHERE o.buyer_id = $1
     ORDER BY so.id ASC`,
        [session.userId]
    );

    const itemsRes = await query(
        `SELECT
       oi.id,
       oi.sub_order_id,
       oi.product_id,
       oi.product_name,
       oi.price,
       oi.quantity,
       oi.subtotal
     FROM order_items oi
     JOIN sub_orders so ON so.id = oi.sub_order_id
     JOIN orders o ON o.id = so.order_id
     WHERE o.buyer_id = $1
     ORDER BY oi.id ASC`,
        [session.userId]
    );

    const itemsBySub = new Map();
    for (const it of itemsRes.rows) {
        const arr = itemsBySub.get(it.sub_order_id) || [];
        arr.push(it);
        itemsBySub.set(it.sub_order_id, arr);
    }

    const subsByOrder = new Map();
    for (const sub of subRes.rows) {
        const arr = subsByOrder.get(sub.order_id) || [];
        arr.push({
            ...sub,
            items: itemsBySub.get(sub.sub_order_id) || [],
        });
        subsByOrder.set(sub.order_id, arr);
    }

    const orders = ordersRes.rows.map((ord) => ({
        ...ord,
        sub_orders: subsByOrder.get(ord.id) || [],
    }));

    return NextResponse.json({ orders });
}

export async function POST(request) {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const body = await request.json();
    const shippingRecipient = String(body.shipping_recipient || "").trim();
    const shippingPhone = String(body.shipping_phone || "").trim();
    const shippingAddress = String(body.shipping_address || "").trim();
    const shippingCity = String(body.shipping_city || "").trim();
    const shippingPostalCode = String(body.shipping_postal_code || "").trim();

    if (
        !shippingRecipient ||
        !shippingPhone ||
        !shippingAddress ||
        !shippingCity ||
        !shippingPostalCode
    ) {
        return NextResponse.json(
            { message: "Lengkapi seluruh data alamat pengiriman untuk checkout." },
            { status: 400 }
        );
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const cartRes = await client.query(
            `SELECT ci.id AS cart_item_id, ci.quantity,
            p.id AS product_id, p.name AS product_name,
            p.price, p.stock, p.store_id
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN products p ON p.id = ci.product_id
        WHERE c.buyer_id = $1 AND p.is_active = TRUE
        FOR UPDATE OF p`,
            [session.userId]
        );

        const cartRows = cartRes.rows;
        if (cartRows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "Keranjang belanja masih kosong." },
                { status: 400 }
            );
        }

        // Validasi stok & kelompokkan berdasarkan store_id
        const byStore = new Map();
        let grandTotal = 0;

        for (const row of cartRows) {
            if (row.quantity > row.stock) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    { message: `Stok "${row.product_name}" hanya tersisa ${row.stock}.` },
                    { status: 400 }
                );
            }

            const subtotalItem = Number(row.price) * Number(row.quantity);
            grandTotal += subtotalItem;

            const storeGroup = byStore.get(row.store_id) || {
                storeId: row.store_id,
                subtotal: 0,
                items: [],
            };
            storeGroup.subtotal += subtotalItem;
            storeGroup.items.push({
                product_id: row.product_id,
                product_name: row.product_name,
                price: Number(row.price),
                quantity: Number(row.quantity),
                subtotal: subtotalItem,
            });
            byStore.set(row.store_id, storeGroup);
        }

        const orderNumber = `FLR-${Date.now()}-${session.userId}`;

        const orderInsert = await client.query(
            `INSERT INTO orders (
            buyer_id,
            order_number,
            total_amount,
            shipping_recipient,
            shipping_phone,
            shipping_address,
            shipping_city,
            shipping_postal_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, order_number`,
            [
                session.userId,
                orderNumber,
                grandTotal.toFixed(2),
                shippingRecipient,
                shippingPhone,
                shippingAddress,
                shippingCity,
                shippingPostalCode,
            ]
        );

        const orderId = orderInsert.rows[0].id;

        for (const group of byStore.values()) {
            const subInsert = await client.query(
                `INSERT INTO sub_orders (order_id, store_id, subtotal, status)
                VALUES ($1, $2, $3, 'PENDING_PAYMENT') RETURNING id`,
                [orderId, group.storeId, group.subtotal.toFixed(2)]
            );
            const subOrderId = subInsert.rows[0].id;

            for (const item of group.items) {
                await client.query(
                    `INSERT INTO order_items (sub_order_id, product_id, product_name, price, quantity, subtotal)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        subOrderId,
                        item.product_id,
                        item.product_name,
                        item.price.toFixed(2),
                        item.quantity,
                        item.subtotal.toFixed(2),
                    ]
                );
                await client.query(
                    `UPDATE products
           SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
                    [item.quantity, item.product_id]
                );
            }
        }

        await client.query(
            `DELETE FROM cart_items
       WHERE cart_id = (SELECT id FROM carts WHERE buyer_id = $1)`,
            [session.userId]
        );

        await client.query("COMMIT");

        return NextResponse.json(
            {
                message: `Checkout berhasil! Nomor pesanan: ${orderNumber}`,
                orderId,
                orderNumber,
            },
            { status: 201 }
        );
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("CHECKOUT_ERROR:", err);
        return NextResponse.json({ message: "Gagal memproses checkout." }, { status: 500 });
    } finally {
        client.release();
    }
}