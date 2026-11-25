import ActionForm from "@/components/ui/ActionForm";

// Form tambah/ubah produk. Dipakai halaman "new" dan "edit".
export default function ProductForm({ action, categories, product, images = [], submitLabel }) {
    return (
        <ActionForm action={action} label={submitLabel} className="max-w-2xl space-y-5">
            {product && <input type="hidden" name="id" value={product.id} />}

            <div>
                <label htmlFor="name" className="dash-label">Nama produk</label>
                <input id="name" name="name" required maxLength={200} defaultValue={product?.name || ""} className="dash-input" />
            </div>

            <div>
                <label htmlFor="description" className="dash-label">Deskripsi</label>
                <textarea id="description" name="description" required rows={4} defaultValue={product?.description || ""} className="dash-input" />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
                <div>
                    <label htmlFor="category_id" className="dash-label">Kategori</label>
                    <select id="category_id" name="category_id" required defaultValue={product?.category_id || ""} className="dash-input">
                        <option value="" disabled>Pilih…</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="price" className="dash-label">Harga (Rp)</label>
                    <input id="price" name="price" type="number" required min="1" step="any" inputMode="numeric" defaultValue={product ? Number(product.price) : ""} className="dash-input" />
                </div>
                <div>
                    <label htmlFor="stock" className="dash-label">Stok</label>
                    <input id="stock" name="stock" type="number" required min="0" step="1" inputMode="numeric" defaultValue={product?.stock ?? ""} className="dash-input" />
                </div>
            </div>

            <div>
                <span className="dash-label">Gambar</span>
                {images.length > 0 && (
                    <ul className="mb-3 flex flex-wrap gap-3">
                        {images.map((img, i) => (
                            <li key={img.id} className="w-24 text-xs">
                                <img src={img.image_path} alt="" className="h-24 w-24 rounded-[3px] border border-[#e6dacb] object-cover" />
                                <label className="mt-1 flex cursor-pointer items-center gap-1.5">
                                    <input type="checkbox" name="remove" value={img.id} />
                                    Hapus{i === 0 ? " (utama)" : ""}
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
                <input
                    type="file"
                    name="images"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    required={!product}
                    className="text-sm"
                />
                <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                    Maksimal 5 gambar, masing-masing 2 MB. Gambar pertama menjadi gambar utama.
                </p>
            </div>
        </ActionForm>
    );
}
