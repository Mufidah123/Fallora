import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { formatRupiah } from "@/lib/format";
import { deleteProductAsAdmin } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead, Thumb, Empty } from "@/components/dashboard/parts";

export const metadata = { title: "Produk | Admin Fallora" };

export default async function AdminProducts({ searchParams }) {
    await requireAdmin();
    const sp = await searchParams;
    const q = String(sp?.q || "").trim();

    const res = await query(
        `SELECT p.id, p.name, p.price, p.stock, c.name AS category_name, s.name AS store_name, pi.image_path
        FROM products p
        JOIN categories c ON c.id = p.category_id
        JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
        WHERE ($1::text IS NULL OR p.name ILIKE $1 OR s.name ILIKE $1)
        ORDER BY p.created_at DESC, p.id DESC LIMIT 200`,
        [q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : null]
    );

    return (
        <>
            <PageHead
                title="Produk"
                note="Hapus produk yang melanggar ketentuan dari toko mana pun."
                action={
                    <form className="flex gap-2">
                        <input name="q" defaultValue={q} placeholder="Cari produk atau toko" className="dash-input !w-56 !py-1.5" />
                        <button className="btn btn-line">Cari</button>
                    </form>
                }
            />

            {res.rows.length === 0 ? (
                <Empty>Tidak ada produk.</Empty>
            ) : (
                <div className="overflow-x-auto">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Toko</th>
                                <th>Kategori</th>
                                <th className="text-right">Harga</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {res.rows.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <Thumb src={p.image_path} alt={p.name} />
                                            <Link href={`/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                                        </div>
                                    </td>
                                    <td className="text-[var(--color-muted)]">{p.store_name}</td>
                                    <td className="text-[var(--color-muted)]">{p.category_name}</td>
                                    <td className="whitespace-nowrap text-right">{formatRupiah(p.price)}</td>
                                    <td>
                                        <div className="flex justify-end">
                                            <ActionForm
                                                action={deleteProductAsAdmin}
                                                label="Hapus"
                                                buttonClass="btn btn-danger btn-sm"
                                                confirm={`Hapus produk "${p.name}" dari platform?`}
                                            >
                                                <input type="hidden" name="id" value={p.id} />
                                            </ActionForm>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
