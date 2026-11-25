import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { requireStore } from "@/lib/guards";
import { updateProduct } from "../../../actions";
import ProductForm from "../../ProductForm";
import { PageHead } from "@/components/dashboard/parts";

export const metadata = { title: "Edit Produk | Seller Fallora" };

export default async function EditProductPage({ params }) {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) notFound();

    const { store } = await requireStore();

    // Hanya produk milik toko sendiri
    const [prod, imgs, cats] = await Promise.all([
        query(`SELECT * FROM products WHERE id = $1 AND store_id = $2`, [productId, store.id]),
        query(`SELECT id, image_path FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, id ASC`, [productId]),
        query(`SELECT id, name FROM categories ORDER BY name ASC`),
    ]);
    if (!prod.rows[0]) notFound();

    return (
        <>
            <PageHead
                title="Edit produk"
                action={<Link href="/seller/dashboard/products" className="text-sm underline underline-offset-2">Kembali</Link>}
            />
            <ProductForm
                action={updateProduct}
                categories={cats.rows}
                product={prod.rows[0]}
                images={imgs.rows}
                submitLabel="Simpan perubahan"
            />
        </>
    );
}
