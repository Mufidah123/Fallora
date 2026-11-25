import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { createCategory, updateCategory, deleteCategory } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead } from "@/components/dashboard/parts";

export const metadata = { title: "Kategori | Admin Fallora" };

export default async function CategoriesPage() {
    await requireAdmin();
    const res = await query(
        `SELECT c.id, c.name, c.description, COUNT(p.id)::int AS product_count
        FROM categories c LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id ORDER BY c.name ASC`
    );

    return (
        <>
            <PageHead title="Kategori produk" note="Kategori ini dipilih seller saat menambahkan produk." />

            <section className="mb-10 max-w-2xl border border-[#cdbfae] bg-white p-4">
                <h2 className="mb-3 text-sm font-bold">Tambah kategori</h2>
                <ActionForm action={createCategory} label="Tambah" className="grid gap-3 sm:grid-cols-[1fr_1.6fr_auto] sm:items-start">
                    <input name="name" required maxLength={100} placeholder="Nama, mis. Buku" aria-label="Nama kategori" className="dash-input" />
                    <input name="description" placeholder="Deskripsi singkat (opsional)" aria-label="Deskripsi kategori" className="dash-input" />
                </ActionForm>
            </section>

            <ul className="divide-y divide-[#e6dacb] border-y border-[#cdbfae]">
                {res.rows.map((c) => (
                    <li key={c.id} className="grid gap-2 py-3 lg:grid-cols-[1fr_auto] lg:items-start">
                        <ActionForm
                            action={updateCategory}
                            label="Simpan"
                            buttonClass="btn btn-line btn-sm"
                            className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto] sm:items-start"
                        >
                            <input type="hidden" name="id" value={c.id} />
                            <input name="name" required maxLength={100} defaultValue={c.name} aria-label="Nama kategori" className="dash-input" />
                            <input name="description" defaultValue={c.description || ""} aria-label="Deskripsi kategori" className="dash-input" />
                        </ActionForm>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--color-muted)]">{c.product_count} produk</span>
                            <ActionForm
                                action={deleteCategory}
                                label="Hapus"
                                buttonClass="btn btn-danger btn-sm"
                                confirm={`Hapus kategori "${c.name}"?`}
                            >
                                <input type="hidden" name="id" value={c.id} />
                            </ActionForm>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}
