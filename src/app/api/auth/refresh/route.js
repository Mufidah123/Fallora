import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

// Sinkronkan cookie sesi dengan data terbaru di DB (role/status bisa berubah
// setelah Admin menyetujui seller), lalu lanjut ke halaman tujuan.
export async function GET(request) {
    const url = new URL(request.url);
    const next = url.searchParams.get("next") || "/";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

    const session = await getSession();
    if (!session) return NextResponse.redirect(new URL("/login", url));

    const res = await query(
        `SELECT id, name, username, role, status FROM users WHERE id = $1 LIMIT 1`,
        [session.userId]
    );
    const user = res.rows[0];

    if (!user) {
        await clearSessionCookie();
        return NextResponse.redirect(new URL("/login", url));
    }

    await setSessionCookie(user);

    // Seller yang belum aktif selalu diarahkan ke halaman pending
    if (user.role === "SELLER" && user.status !== "ACTIVE" && safeNext.startsWith("/seller/dashboard")) {
        return NextResponse.redirect(new URL("/seller/pending", url));
    }
    return NextResponse.redirect(new URL(safeNext, url));
}
