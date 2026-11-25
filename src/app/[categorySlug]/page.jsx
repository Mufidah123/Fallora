import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import CatalogView from "@/components/catalog/CatalogView";
import { categoryPath, parseCategorySlug } from "@/lib/slug";
import {
    PAGE_SIZE,
    getAllCategories,
    getCatalogProducts,
    getCategoryById,
    parseCatalogQuery,
} from "@/services/productService";

export const dynamic = "force-dynamic";

// Halaman kategori: /Elektronik-Gadget-cat.3
export async function generateMetadata({ params }) {
    const { categorySlug } = await params;
    const parsed = parseCategorySlug(categorySlug);
    const category = parsed && (await getCategoryById(parsed.id));
    return { title: category ? `${category.name} | Fallora` : "Fallora E-Commerce" };
}

export default async function CategoryPage({ params, searchParams }) {
    const { categorySlug } = await params;
    const parsed = parseCategorySlug(categorySlug);
    if (!parsed) notFound();

    const category = await getCategoryById(parsed.id);
    if (!category) notFound();

    const rawSearch = await searchParams;

    // Slug tidak sesuai nama kategori -> arahkan ke URL kanonik
    const canonical = categoryPath(category);
    if (decodeURIComponent(categorySlug) !== canonical.slice(1)) {
        const qs = new URLSearchParams(
            Object.entries(rawSearch).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]))
        ).toString();
        redirect(qs ? `${canonical}?${qs}` : canonical);
    }

    const query = parseCatalogQuery(rawSearch);
    const [categories, data] = await Promise.all([
        getAllCategories(),
        getCatalogProducts({
            categoryId: category.id,
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
                        <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)]">
                            <Link href="/" className="hover:text-[var(--color-secondary)]">Beranda</Link>
                            <span className="mx-1.5">›</span>
                            <span className="font-semibold text-[var(--color-dark)]">{category.name}</span>
                        </nav>
                        <h1 className="mt-1 text-xl font-bold text-[var(--color-primary)] sm:text-2xl">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{category.description}</p>
                        )}
                    </div>
                }
                categories={categories}
                activeCategoryId={category.id}
                categoryHref={(cat) => categoryPath(cat)}
                basePath={canonical}
                query={query}
                data={data}
            />
            <Footer />
        </div>
    );
}
