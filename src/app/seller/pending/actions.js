"use server";

import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { requirePendingSeller } from "@/lib/guards";
import { clearSessionCookie } from "@/lib/auth";

// Seller yang ditolak boleh menghapus akunnya sendiri
export async function deleteRejectedAccount() {
    const user = await requirePendingSeller();
    if (user.status !== "REJECTED") return;

    await query(`DELETE FROM users WHERE id = $1 AND role = 'SELLER' AND status = 'REJECTED'`, [user.id]);
    await clearSessionCookie();
    redirect("/");
}
