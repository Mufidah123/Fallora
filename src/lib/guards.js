import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

// Data user terbaru dari DB. Cookie hanya dipakai untuk tahu siapa yang login,
// jadi role/status yang berubah (mis. seller baru disetujui) tetap terbaca benar.
export async function getFreshUser() {
    const session = await getSession();
    if (!session) return { session: null, user: null };
    const res = await query(
        `SELECT id, name, username, email, phone, profile_photo, role, status, rejection_reason, created_at
        FROM users WHERE id = $1 LIMIT 1`,
        [session.userId]
    );
    return { session, user: res.rows[0] || null };
}

async function requireUser() {
    const { session, user } = await getFreshUser();
    if (!session) redirect("/login");
    // Cookie masih ada tapi akun sudah dihapus -> bersihkan cookie lewat route handler
    if (!user) redirect("/api/auth/refresh");
    return user;
}

export async function requireAdmin() {
    const user = await requireUser();
    if (user.role !== "ADMIN") redirect("/");
    return user;
}

// Seller yang sudah disetujui. store bisa null kalau belum pernah dibuat.
export async function requireSeller() {
    const user = await requireUser();
    if (user.role !== "SELLER") redirect("/");
    if (user.status !== "ACTIVE") redirect("/api/auth/refresh?next=/seller/pending");
    const storeRes = await query(`SELECT * FROM stores WHERE seller_id = $1 LIMIT 1`, [user.id]);
    return { user, store: storeRes.rows[0] || null };
}

export async function requireStore() {
    const ctx = await requireSeller();
    if (!ctx.store) redirect("/seller/dashboard/store");
    return ctx;
}

export async function requirePendingSeller() {
    const user = await requireUser();
    if (user.role !== "SELLER") redirect("/");
    if (user.status === "ACTIVE") redirect("/api/auth/refresh?next=/seller/dashboard");
    return user;
}
