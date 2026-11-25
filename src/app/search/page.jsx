import { redirect } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import CatalogView from "@/components/catalog/CatalogView";
import {
    PAGE_SIZE,
    getAllCategories,
    getCatalogProducts,
    parseCatalogQuery,
} from "@/services/productService";

export const dynamic = "force-dynamic";

// Halaman pencarian: /search?keyword=baju
export async function generateMetadata({ searchParams }) {
    const { keyword } = await searchParams;
    return { title: keyword ? `Hasil pencarian '${keyword}' | Fallora` : "Pencarian | Fallora" };
}

export default async function SearchPage({ searchParams }) {
    const rawSearch = await searchParams;
    const keyword = String(Array.isArray(rawSearch.keyword) ? rawSearch.keyword[0] : rawSearch.keyword || "").trim();
    if (!keyword) redirect("/products");

    const rawCategory = Number(Array.isArray(rawSearch.categoryId) ? rawSearch.categoryId[0] : rawSearch.categoryId);
    const categoryId = Number.isInteger(rawCategory) && rawCategory > 0 ? rawCategory : null;

    const query = parseCatalogQuery(rawSearch);
    const [categories, data] = await Promise.all([
        getAllCategories(),
        getCatalogProducts({
            q: keyword,
            categoryId,
            sort: query.sort,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            limit: PAGE_SIZE,
            offset: (query.page - 1) * PAGE_SIZE,
        }),
    ]);

    // Link kategori di sidebar menyaring hasil pencarian; klik lagi untuk melepas
    const categoryHref = (cat, active) => {
        const params = new URLSearchParams({ keyword });
        if (!active) params.set("categoryId", String(cat.id));
        return `/search?${params.toString()}`;
    };

    return (
        <div className="flex min-h-screen flex-col bg-[var(--color-surface)] text-[var(--color-dark)]">
            <SiteHeader keyword={keyword} />
            <CatalogView
                heading={
                    <div>
                        <h1 className="flex flex-wrap items-center gap-2 text-lg font-bold sm:text-xl">
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5 shrink-0 text-[var(--color-secondary)]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.3"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span>
                                Hasil pencarian untuk &apos;
                                <span className="text-[var(--color-secondary)]">{keyword}</span>&apos;
                            </span>
                        </h1>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {data.total} produk ditemukan
                        </p>
                    </div>
                }
                categories={categories}
                activeCategoryId={categoryId}
                categoryHref={categoryHref}
                basePath="/search"
                baseParams={{ keyword, categoryId }}
                query={query}
                data={data}
            />
            <Footer />
        </div>
    );
}
