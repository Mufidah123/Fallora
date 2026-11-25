import Link from "next/link";
import { query } from "@/lib/db";
import { requireStore } from "@/lib/guards";
import { formatRupiah } from "@/lib/format";
import { deleteProduct } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead, Thumb, Empty } from "@/components/dashboard/parts";

export const metadata = { title: "Produk | Seller Fallora" };

export default async function SellerProducts() {
    const { store } = await requireStore();

    const res = await query(
        `SELECT p.id, p.name, p.price, p.stock, c.name AS category_name, pi.image_path
        FROM products p
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
        WHERE p.store_id = $1
        ORDER BY p.created_at DESC, p.id DESC`,
        [store.id]
    );

    return (
        <>
            <PageHead
                title="Produk"
                note={`${res.rows.length} produk di ${store.name}.`}
                action={
                    <Link href="/seller/dashboard/products/new" className="btn btn-solid">
                        Tambah produk
                    </Link>
                }
            />

            {res.rows.length === 0 ? (
                <Empty href="/seller/dashboard/products/new" hrefLabel="Tambah produk pertama">
                    Belum ada produk di toko ini.
                </Empty>
            ) : (
                <div className="overflow-x-auto">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Kategori</th>
                                <th className="text-right">Harga</th>
                                <th className="text-right">Stok</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {res.rows.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <Thumb src={p.image_path} alt={p.name} />
                                            <Link href={`/products/${p.id}`} className="font-semibold hover:underline">
                                                {p.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="text-[var(--color-muted)]">{p.category_name}</td>
                                    <td className="whitespace-nowrap text-right">{formatRupiah(p.price)}</td>
                                    <td
                                        className={`text-right font-semibold ${
                                            p.stock === 0 ? "text-red-700" : p.stock <= 5 ? "text-[var(--color-secondary)]" : ""
                                        }`}
                                    >
                                        {p.stock}
                                    </td>
                                    <td>
                                        <div className="flex items-start justify-end gap-2">
                                            <Link href={`/seller/dashboard/products/${p.id}/edit`} className="btn btn-line btn-sm">
                                                Edit
                                            </Link>
                                            <ActionForm
                                                action={deleteProduct}
                                                label="Hapus"
                                                buttonClass="btn btn-danger btn-sm"
                                                confirm={`Hapus "${p.name}"? Produk juga hilang dari keranjang pembeli.`}
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
