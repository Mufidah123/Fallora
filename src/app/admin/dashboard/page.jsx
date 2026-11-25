import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { formatDate, formatRupiah } from "@/lib/format";
import { PageHead } from "@/components/dashboard/parts";

export const metadata = { title: "Ringkasan | Admin Fallora" };

export default async function AdminHome() {
    await requireAdmin();

    const [counts, waiting] = await Promise.all([
        query(
            `SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'BUYER')::int AS buyers,
            (SELECT COUNT(*) FROM users WHERE role = 'SELLER' AND status = 'ACTIVE')::int AS sellers,
            (SELECT COUNT(*) FROM users WHERE role = 'SELLER' AND status = 'PENDING')::int AS pending,
            (SELECT COUNT(*) FROM products)::int AS products,
            (SELECT COUNT(*) FROM categories)::int AS categories,
            (SELECT COUNT(*) FROM orders)::int AS orders,
            (SELECT COALESCE(SUM(subtotal), 0) FROM sub_orders WHERE status = 'COMPLETED') AS gmv`
        ),
        query(
            `SELECT id, name, username, email, created_at FROM users
            WHERE role = 'SELLER' AND status = 'PENDING' ORDER BY created_at ASC LIMIT 5`
        ),
    ]);
    const c = counts.rows[0];

    const rows = [
        ["Buyer", c.buyers],
        ["Seller aktif", c.sellers],
        ["Produk", c.products],
        ["Kategori", c.categories],
        ["Pesanan dibuat", c.orders],
        ["Nilai pesanan selesai", formatRupiah(c.gmv)],
    ];

    return (
        <>
            <PageHead title="Ringkasan platform" note="Kondisi Fallora saat ini." />

            <div className="grid gap-10 lg:grid-cols-2">
                <section>
                    <h2 className="mb-2 text-base font-bold">Angka singkat</h2>
                    <dl className="divide-y divide-[#e6dacb] border-y border-[#e6dacb] text-sm">
                        {rows.map(([k, v]) => (
                            <div key={k} className="flex justify-between py-2.5">
                                <dt className="text-[var(--color-muted)]">{k}</dt>
                                <dd className="font-bold">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section>
                    <div className="mb-2 flex items-baseline justify-between">
                        <h2 className="text-base font-bold">Menunggu verifikasi ({c.pending})</h2>
                        <Link href="/admin/dashboard/sellers" className="text-xs underline underline-offset-2">
                            Buka
                        </Link>
                    </div>
                    {waiting.rows.length === 0 ? (
                        <p className="py-6 text-sm text-[var(--color-muted)]">Tidak ada seller yang menunggu.</p>
                    ) : (
                        <ul className="divide-y divide-[#e6dacb] border-y border-[#e6dacb] text-sm">
                            {waiting.rows.map((s) => (
                                <li key={s.id} className="py-2.5">
                                    <span className="font-semibold">{s.name}</span>
                                    <span className="text-[var(--color-muted)]"> · @{s.username}</span>
                                    <div className="text-xs text-[var(--color-muted)]">
                                        {s.email} · daftar {formatDate(s.created_at)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
