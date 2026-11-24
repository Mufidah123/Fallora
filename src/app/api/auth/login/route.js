import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request) {
    try {
        const body = await request.json();
        const identifier = String(body.identifier || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!identifier || !password) {
            return NextResponse.json(
                { message: "Email/Username dan password wajib diisi." },
                { status: 400 }
            );
        }

        const result = await query(
            `SELECT id, name, username, email, phone, password_hash, role, status, rejection_reason
       FROM users
       WHERE LOWER(email) = $1 OR LOWER(username) = $1
       LIMIT 1`,
            [identifier]
        );

        const user = result.rows[0];
        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json(
                { message: "Email/Username atau password salah." },
                { status: 401 }
            );
        }

        await setSessionCookie(user);

        let redirectTo = "/";
        if (user.role === "ADMIN") {
            redirectTo = "/admin/dashboard";
        } else if (user.role === "SELLER") {
            redirectTo = user.status === "ACTIVE" ? "/seller/dashboard" : "/seller/pending";
        } else if (user.role === "BUYER") {
            redirectTo = "/";
        }

        return NextResponse.json(
            {
                message: "Login berhasil.",
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    rejection_reason: user.rejection_reason,
                },
                redirectTo,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("LOGIN_ERROR:", err);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server saat login." },
            { status: 500 }
        );
    }
}