import DashShell from "@/components/dashboard/DashShell";
import { requireSeller } from "@/lib/guards";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SellerLayout({ children }) {
    const { user, store } = await requireSeller();

    let openOrders = 0;
    if (store) {
        const res = await query(
            `SELECT COUNT(*)::int AS n FROM sub_orders
            WHERE store_id = $1 AND status IN ('PENDING_PAYMENT', 'PROCESSING')`,
            [store.id]
        );
        openOrders = res.rows[0].n;
    }

    const nav = [
        { href: "/seller/dashboard", label: "Ringkasan", exact: true },
        { href: "/seller/dashboard/products", label: "Produk" },
        { href: "/seller/dashboard/orders", label: "Pesanan", count: openOrders },
        { href: "/seller/dashboard/store", label: "Toko saya" },
    ];

    return (
        <DashShell area="Seller Centre" user={user} nav={nav}>
            {children}
        </DashShell>
    );
}
