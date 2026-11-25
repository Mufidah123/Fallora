import DashShell from "@/components/dashboard/DashShell";
import { requireAdmin } from "@/lib/guards";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
    const user = await requireAdmin();
    const pending = await query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'SELLER' AND status = 'PENDING'`);

    const nav = [
        { href: "/admin/dashboard", label: "Ringkasan", exact: true },
        { href: "/admin/dashboard/sellers", label: "Verifikasi seller", count: pending.rows[0].n },
        { href: "/admin/dashboard/users", label: "Pengguna" },
        { href: "/admin/dashboard/categories", label: "Kategori" },
        { href: "/admin/dashboard/products", label: "Produk" },
    ];

    return (
        <DashShell area="Admin" user={user} nav={nav}>
            {children}
        </DashShell>
    );
}
