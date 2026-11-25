import { requireSeller } from "@/lib/guards";
import { saveStore } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead, Thumb } from "@/components/dashboard/parts";

export const metadata = { title: "Toko Saya | Seller Fallora" };

export default async function StorePage() {
    const { store } = await requireSeller();

    return (
        <>
            <PageHead
                title={store ? "Toko saya" : "Buat toko"}
                note="Nama, deskripsi, dan gambar ini tampil di halaman produk Anda."
            />

            <ActionForm
                action={saveStore}
                label={store ? "Simpan perubahan" : "Buat toko"}
                className="max-w-xl space-y-5"
            >
                <div>
                    <label htmlFor="name" className="dash-label">Nama toko</label>
                    <input id="name" name="name" required maxLength={150} defaultValue={store?.name || ""} className="dash-input" />
                </div>
                <div>
                    <label htmlFor="description" className="dash-label">Deskripsi</label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows={4}
                        defaultValue={store?.description || ""}
                        placeholder="Ceritakan singkat apa yang Anda jual."
                        className="dash-input"
                    />
                </div>
                <div>
                    <span className="dash-label">Gambar toko</span>
                    <div className="flex items-center gap-4">
                        <Thumb src={store?.image_path} size={72} />
                        <input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif" className="text-sm" />
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--color-muted)]">PNG, JPG, WEBP, atau GIF. Maksimal 2 MB.</p>
                </div>
            </ActionForm>
        </>
    );
}
