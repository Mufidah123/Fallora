import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import CatalogView from "@/components/catalog/CatalogView";
import { categoryPath } from "@/lib/slug";
import {
    PAGE_SIZE,
    getAllCategories,
    getCatalogProducts,
    parseCatalogQuery,
} from "@/services/productService";

export const dynamic = "force-dynamic";
export const metadata = { title: "Semua Produk | Fallora" };

// Daftar produk lengkap (publik)
export default async function ProductListPage({ searchParams }) {
    const query = parseCatalogQuery(await searchParams);
    const [categories, data] = await Promise.all([
        getAllCategories(),
        getCatalogProducts({
            sort: query.sort,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            limit: PAGE_SIZE,
            offset: (query.page - 1) * PAGE_SIZE,
        }),
    ]);

    return (
        <div className="flex min-h-screen flex-col bg-[var(--color-surface)] text-[var(--color-dark)]">
            <SiteHeader />
            <CatalogView
                heading={
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-primary)] sm:text-2xl">
                            Semua Produk
                        </h1>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {data.total} produk tersedia
                        </p>
                    </div>
                }
                categories={categories}
                categoryHref={(cat) => categoryPath(cat)}
                basePath="/products"
                query={query}
                data={data}
            />
            <Footer />
        </div>
    );
}
