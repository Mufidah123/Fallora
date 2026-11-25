import Link from "next/link";
import { query } from "@/lib/db";
import { requireStore } from "@/lib/guards";
import { createProduct } from "../../actions";
import ProductForm from "../ProductForm";
import { PageHead } from "@/components/dashboard/parts";

export const metadata = { title: "Tambah Produk | Seller Fallora" };

export default async function NewProductPage() {
    await requireStore();
    const cats = await query(`SELECT id, name FROM categories ORDER BY name ASC`);

    return (
        <>
            <PageHead
                title="Tambah produk"
                action={<Link href="/seller/dashboard/products" className="text-sm underline underline-offset-2">Kembali</Link>}
            />
            <ProductForm action={createProduct} categories={cats.rows} submitLabel="Simpan produk" />
        </>
    );
}
