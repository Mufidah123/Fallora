import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const res = await query(
        `SELECT id, name, username, email, phone, profile_photo
     FROM users WHERE id = $1 LIMIT 1`,
        [session.userId]
    );

    return NextResponse.json({ profile: res.rows[0] || null });
}

export async function PUT(request) {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim();
    const phone = String(body.phone || "").trim() || null;

    if (!name || !username) {
        return NextResponse.json(
            { message: "Nama lengkap dan username wajib diisi." },
            { status: 400 }
        );
    }

    try {
        const updated = await query(
            `UPDATE users
       SET name = $1, username = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, username, email, phone, profile_photo`,
            [name, username, phone, session.userId]
        );

        return NextResponse.json({
            message: "Profil berhasil diperbarui.",
            profile: updated.rows[0],
        });
    } catch (err) {
        if (err.code === "23505") {
            return NextResponse.json(
                { message: "Username sudah digunakan akun lain." },
                { status: 409 }
            );
        }
        return NextResponse.json({ message: "Gagal memperbarui profil." }, { status: 500 });
    }
}