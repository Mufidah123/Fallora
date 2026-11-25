import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request) {
    try {
        const body = await request.json();
        const name = String(body.name || "").trim();
        const rawUsername = String(body.username || "").trim().toLowerCase();
        const rawEmail = String(body.email || "").trim().toLowerCase();
        const phone = body.phone ? String(body.phone).trim() : null;
        const password = String(body.password || "");
        const requestedRole = String(body.role || "BUYER").toUpperCase();

        if (!name || !rawUsername || !rawEmail || !password) {
            return NextResponse.json(
                { message: "Nama lengkap, username, email, dan password wajib diisi." },
                { status: 400 }
            );
        }

        if (!["BUYER", "SELLER"].includes(requestedRole)) {
            return NextResponse.json(
                { message: "Registrasi hanya tersedia untuk akun Buyer atau Seller." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password minimal 6 karakter." },
                { status: 400 }
            );
        }

        const storeName = String(body.store_name || "").trim().slice(0, 150);
        if (requestedRole === "SELLER" && !storeName) {
            return NextResponse.json(
                { message: "Nama toko wajib diisi." },
                { status: 400 }
            );
        }

        const status = requestedRole === "SELLER" ? "PENDING" : "ACTIVE";
        const passwordHash = await hashPassword(password);

        const client = await pool.connect();
        let createdUser;
        try {
            await client.query("BEGIN");
            const insertResult = await client.query(
                `INSERT INTO users (name, username, email, phone, password_hash, role, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, username, email, phone, role, status, created_at`,
                [name, rawUsername, rawEmail, phone, passwordHash, requestedRole, status]
            );
            createdUser = insertResult.rows[0];

            if (createdUser.role === "SELLER") {
                await client.query(
                    `INSERT INTO stores (seller_id, name) VALUES ($1, $2)`,
                    [createdUser.id, storeName]
                );
            } else {
                await client.query(
                    `INSERT INTO carts (buyer_id) VALUES ($1) ON CONFLICT (buyer_id) DO NOTHING`,
                    [createdUser.id]
                );
            }
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }

        await setSessionCookie(createdUser);

        return NextResponse.json(
            {
                message:
                    createdUser.role === "SELLER"
                        ? "Pendaftaran Seller berhasil. Akun Anda sedang menunggu persetujuan Admin."
                        : "Registrasi berhasil.",
                user: createdUser,
                redirectTo:
                    createdUser.role === "SELLER" ? "/seller/pending" : "/",
            },
            { status: 201 }
        );
    } catch (err) {
        if (err.code === "23505") {
            const detail = String(err.detail || "");
            if (detail.includes("username")) {
                return NextResponse.json(
                    { message: "Username sudah digunakan." },
                    { status: 409 }
                );
            }
            if (detail.includes("email")) {
                return NextResponse.json(
                    { message: "Email sudah terdaftar." },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { message: "Username atau email sudah digunakan." },
                { status: 409 }
            );
        }

        console.error("SIGNUP_ERROR:", err);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server saat mendaftar." },
            { status: 500 }
        );
    }
}