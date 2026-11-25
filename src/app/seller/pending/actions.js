"use server";

import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { requirePendingSeller } from "@/lib/guards";
import { clearSessionCookie } from "@/lib/auth";

// Seller yang ditolak boleh menghapus akunnya sendiri
export async function deleteRejectedAccount() {
    const user = await requirePendingSeller();
    if (user.status !== "REJECTED") return;

    try {
        await query(`DELETE FROM users WHERE id = $1 AND role = 'SELLER' AND status = 'REJECTED'`, [user.id]);
    } catch (err) {
        // Akun yang pernah punya pesanan tidak bisa dihapus (FK RESTRICT)
        if (err.code === "23503") {
            return { error: "Akun ini punya riwayat transaksi sehingga tidak bisa dihapus. Pilih 'Kembali menjadi Pembeli'." };
        }
        throw err;
    }
    await clearSessionCookie();
    redirect("/");
}

// Seller yang ditolak (mis. dulunya buyer) kembali menjadi Buyer
export async function revertToBuyer() {
    const user = await requirePendingSeller();
    if (user.status !== "REJECTED") return;

    await query(`DELETE FROM stores WHERE seller_id = $1`, [user.id]).catch(() => {});
    await query(
        `UPDATE users SET role = 'BUYER', status = 'ACTIVE', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id]
    );
    await query(`INSERT INTO carts (buyer_id) VALUES ($1) ON CONFLICT (buyer_id) DO NOTHING`, [user.id]);
    redirect("/api/auth/refresh?next=/");
}
