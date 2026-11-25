import Link from "next/link";
import { query } from "@/lib/db";
import { requireSeller } from "@/lib/guards";
import { formatRupiah, formatDate } from "@/lib/format";
import { PageHead, OrderTag, Empty } from "@/components/dashboard/parts";

export const metadata = { title: "Ringkasan | Seller Fallora" };

export default async function SellerHome() {
    const { user, store } = await requireSeller();

    if (!store) {
        return (
            <>
                <PageHead title={`Halo, ${user.name.split(" ")[0]}`} note="Akun Anda sudah disetujui." />
                <Empty href="/seller/dashboard/store" hrefLabel="Buat toko">
                    Anda belum punya toko. Isi nama dan deskripsi toko dulu sebelum mulai menambah produk.
                </Empty>
            </>
        );
    }

    const [stats, recent, lowStock] = await Promise.all([
        query(
            `SELECT
            (SELECT COUNT(*) FROM products WHERE store_id = $1)::int AS products,
            (SELECT COUNT(*) FROM sub_orders WHERE store_id = $1 AND status IN ('PENDING_PAYMENT','PROCESSING'))::int AS open_orders,
            (SELECT COALESCE(SUM(subtotal), 0) FROM sub_orders WHERE store_id = $1 AND status = 'COMPLETED') AS revenue,
            (SELECT COUNT(*) FROM sub_orders WHERE store_id = $1 AND status = 'COMPLETED')::int AS done_orders`,
            [store.id]
        ),
        query(
            `SELECT so.id, so.status, so.subtotal, so.created_at, o.order_number, u.name AS buyer_name
            FROM sub_orders so
            JOIN orders o ON o.id = so.order_id
            JOIN users u ON u.id = o.buyer_id
            WHERE so.store_id = $1
            ORDER BY so.created_at DESC LIMIT 5`,
            [store.id]
        ),
        query(
            `SELECT id, name, stock FROM products
            WHERE store_id = $1 AND stock <= 5 ORDER BY stock ASC, name ASC LIMIT 6`,
            [store.id]
        ),
    ]);
    const s = stats.rows[0];

    return (
        <>
            <PageHead title={store.name} note="Gambaran singkat toko Anda hari ini." />

            <dl className="mb-10 grid grid-cols-2 divide-[#e6dacb] border-y border-[#cdbfae] md:grid-cols-4 md:divide-x">
                {[
                    ["Produk", s.products],
                    ["Pesanan perlu ditangani", s.open_orders],
                    ["Pesanan selesai", s.done_orders],
                    ["Pendapatan selesai", formatRupiah(s.revenue)],
                ].map(([label, value]) => (
                    <div key={label} className="px-4 py-4 first:pl-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-muted)]">
                            {label}
                        </dt>
                        <dd className="mt-1 font-brand text-2xl text-[var(--color-dark)]">{value}</dd>
                    </div>
                ))}
            </dl>

            <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                <section>
                    <div className="mb-2 flex items-baseline justify-between">
                        <h2 className="text-base font-bold">Pesanan terbaru</h2>
                        <Link href="/seller/dashboard/orders" className="text-xs underline underline-offset-2">
                            Semua pesanan
                        </Link>
                    </div>
                    {recent.rows.length === 0 ? (
                        <p className="py-6 text-sm text-[var(--color-muted)]">Belum ada pesanan masuk.</p>
                    ) : (
                        <table className="tbl">
                            <tbody>
                                {recent.rows.map((r) => (
                                    <tr key={r.id}>
                                        <td>
                                            <div className="font-semibold">{r.order_number}</div>
                                            <div className="text-xs text-[var(--color-muted)]">
                                                {r.buyer_name} · {formatDate(r.created_at)}
                                            </div>
                                        </td>
                                        <td><OrderTag status={r.status} /></td>
                                        <td className="text-right font-semibold">{formatRupiah(r.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <section>
                    <h2 className="mb-2 text-base font-bold">Stok menipis</h2>
                    {lowStock.rows.length === 0 ? (
                        <p className="py-6 text-sm text-[var(--color-muted)]">Semua stok masih aman.</p>
                    ) : (
                        <ul className="divide-y divide-[#e6dacb] border-y border-[#e6dacb] text-sm">
                            {lowStock.rows.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                                    <Link
                                        href={`/seller/dashboard/products/${p.id}/edit`}
                                        className="truncate hover:underline"
                                    >
                                        {p.name}
                                    </Link>
                                    <span
                                        className={`shrink-0 text-xs font-bold ${
                                            p.stock === 0 ? "text-red-700" : "text-[var(--color-secondary)]"
                                        }`}
                                    >
                                        {p.stock === 0 ? "Habis" : `Sisa ${p.stock}`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
