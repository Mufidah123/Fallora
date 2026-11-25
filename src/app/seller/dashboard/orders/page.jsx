import Link from "next/link";
import { query } from "@/lib/db";
import { requireStore } from "@/lib/guards";
import { formatRupiah, formatDate, ORDER_STATUS, ORDER_FLOW, ORDER_ACTION_LABEL } from "@/lib/format";
import { updateOrderStatus } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead, OrderTag, Empty } from "@/components/dashboard/parts";

export const metadata = { title: "Pesanan | Seller Fallora" };
export const dynamic = "force-dynamic";

export default async function SellerOrders({ searchParams }) {
    const { store } = await requireStore();
    const sp = await searchParams;
    const filter = ORDER_STATUS[sp?.status] ? sp.status : null;

    const subs = await query(
        `SELECT so.id, so.status, so.subtotal, so.created_at, so.updated_at,
        o.order_number, o.shipping_recipient, o.shipping_phone, o.shipping_address,
        o.shipping_city, o.shipping_postal_code, u.name AS buyer_name
        FROM sub_orders so
        JOIN orders o ON o.id = so.order_id
        JOIN users u ON u.id = o.buyer_id
        WHERE so.store_id = $1 AND ($2::text IS NULL OR so.status = $2)
        ORDER BY (so.status IN ('PENDING_PAYMENT','PROCESSING')) DESC, so.created_at DESC`,
        [store.id, filter]
    );

    const ids = subs.rows.map((r) => r.id);
    const items = ids.length
        ? await query(
              `SELECT id, sub_order_id, product_name, price, quantity, subtotal
              FROM order_items WHERE sub_order_id = ANY($1::bigint[]) ORDER BY id ASC`,
              [ids]
          )
        : { rows: [] };

    const bySub = new Map();
    for (const it of items.rows) {
        const list = bySub.get(it.sub_order_id) || [];
        list.push(it);
        bySub.set(it.sub_order_id, list);
    }

    const tabs = [["", "Semua"], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])];

    return (
        <>
            <PageHead title="Pesanan masuk" note="Pesanan untuk produk dari toko Anda. Perbarui statusnya seiring pesanan berjalan." />

            <div className="mb-6 flex flex-wrap gap-x-5 gap-y-1 border-b border-[#e6dacb] text-sm">
                {tabs.map(([key, label]) => {
                    const active = (filter || "") === key;
                    return (
                        <Link
                            key={key || "all"}
                            href={key ? `/seller/dashboard/orders?status=${key}` : "/seller/dashboard/orders"}
                            className={`-mb-px border-b-2 pb-2 ${
                                active
                                    ? "border-[var(--color-primary)] font-bold text-[var(--color-primary)]"
                                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-dark)]"
                            }`}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>

            {subs.rows.length === 0 ? (
                <Empty>Tidak ada pesanan{filter ? " dengan status ini" : ""}.</Empty>
            ) : (
                <div className="space-y-6">
                    {subs.rows.map((o) => (
                        <article key={o.id} className="border border-[#cdbfae] bg-white">
                            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6dacb] bg-[#faf1e6] px-4 py-2.5">
                                <div>
                                    <span className="font-bold">{o.order_number}</span>
                                    <span className="ml-3 text-xs text-[var(--color-muted)]">{formatDate(o.created_at, true)}</span>
                                </div>
                                <OrderTag status={o.status} />
                            </header>

                            <div className="grid gap-5 px-4 py-4 md:grid-cols-[1.4fr_1fr]">
                                <table className="tbl">
                                    <tbody>
                                        {(bySub.get(o.id) || []).map((it) => (
                                            <tr key={it.id}>
                                                <td>{it.product_name}</td>
                                                <td className="whitespace-nowrap text-[var(--color-muted)]">
                                                    {it.quantity} × {formatRupiah(it.price)}
                                                </td>
                                                <td className="whitespace-nowrap text-right">{formatRupiah(it.subtotal)}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={2} className="text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                                Subtotal toko
                                            </td>
                                            <td className="text-right font-bold">{formatRupiah(o.subtotal)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="text-sm">
                                    <p className="dash-label">Dikirim ke</p>
                                    <p className="font-semibold">{o.shipping_recipient}</p>
                                    <p className="text-[var(--color-muted)]">{o.shipping_phone}</p>
                                    <p className="mt-1">
                                        {o.shipping_address}, {o.shipping_city} {o.shipping_postal_code}
                                    </p>
                                    <p className="mt-2 text-xs text-[var(--color-muted)]">Akun pembeli: {o.buyer_name}</p>
                                </div>
                            </div>

                            {ORDER_FLOW[o.status].length > 0 && (
                                <footer className="flex flex-wrap gap-2 border-t border-[#e6dacb] px-4 py-3">
                                    {ORDER_FLOW[o.status].map((next) => (
                                        <ActionForm
                                            key={next}
                                            action={updateOrderStatus}
                                            label={ORDER_ACTION_LABEL[next]}
                                            buttonClass={next === "CANCELLED" ? "btn btn-danger btn-sm" : "btn btn-solid btn-sm"}
                                            confirm={next === "CANCELLED" ? "Batalkan pesanan ini? Stok produk akan dikembalikan." : undefined}
                                        >
                                            <input type="hidden" name="sub_order_id" value={o.id} />
                                            <input type="hidden" name="status" value={next} />
                                        </ActionForm>
                                    ))}
                                </footer>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
