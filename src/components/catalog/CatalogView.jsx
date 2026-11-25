import Link from "next/link";
import ProductGrid from "./ProductGrid";
import PriceSortSelect from "./PriceSortSelect";
import { PAGE_SIZE } from "@/services/productService";

const SORT_BUTTONS = [
    { key: "popular", label: "Populer" },
    { key: "latest", label: "Terbaru" },
    { key: "bestseller", label: "Terlaris" },
];

export default function CatalogView({
    heading,
    categories,
    activeCategoryId = null,
    categoryHref,
    basePath,
    baseParams = {},
    query,
    data,
}) {
    const { sort, page, minPrice, maxPrice } = query;
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

    // Susun URL halaman ini dengan sebagian param diganti
    const href = (overrides = {}) => {
        const merged = {
            ...baseParams,
            sort: sort !== "popular" ? sort : undefined,
            minPrice: minPrice ?? undefined,
            maxPrice: maxPrice ?? undefined,
            ...overrides,
        };
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(merged)) {
            if (v !== undefined && v !== null && v !== "" && !(k === "page" && Number(v) <= 1)) {
                params.set(k, String(v));
            }
        }
        const qs = params.toString();
        return qs ? `${basePath}?${qs}` : basePath;
    };

    const hasPriceFilter = minPrice !== null || maxPrice !== null;

    return (
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6">
            <div className="mb-5">{heading}</div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
                {/* SIDEBAR */}
                <aside className="space-y-6">
                    <nav aria-label="Kategori" className="hidden lg:block">
                        <div className="flex items-center gap-2 border-b border-[#E7E2DC] pb-3 text-base font-bold">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <circle cx="3.5" cy="6" r="1" />
                                <circle cx="3.5" cy="12" r="1" />
                                <circle cx="3.5" cy="18" r="1" />
                            </svg>
                            Semua Kategori
                        </div>
                        <ul className="mt-3 space-y-1">
                            {categories.map((cat) => {
                                const active = String(cat.id) === String(activeCategoryId);
                                return (
                                    <li key={cat.id}>
                                        <Link
                                            href={categoryHref(cat, active)}
                                            className={`relative block rounded py-2 pl-5 pr-2 text-sm transition ${active
                                                ? "font-bold text-[var(--color-secondary)]"
                                                : "text-[var(--color-dark)] hover:bg-[var(--color-cream)]/60"
                                                }`}
                                        >
                                            {active && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px]"
                                                >
                                                    ▶
                                                </span>
                                            )}
                                            {cat.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Kategori versi mobile: baris yang bisa digeser */}
                    <nav aria-label="Kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
                        {categories.map((cat) => {
                            const active = String(cat.id) === String(activeCategoryId);
                            return (
                                <Link
                                    key={cat.id}
                                    href={categoryHref(cat, active)}
                                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${active
                                        ? "border-[var(--color-secondary)] bg-[var(--color-secondary)] text-white"
                                        : "border-[#E7E2DC] bg-white text-[var(--color-dark)]"
                                        }`}
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Filter harga (GET form, tanpa JS) */}
                    <form action={basePath} method="get" className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-[#E7E2DC] pb-3 text-base font-bold">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            FILTER
                        </div>
                        {Object.entries(baseParams).map(([k, v]) =>
                            v ? <input key={k} type="hidden" name={k} value={v} /> : null
                        )}
                        {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}

                        <div className="text-sm font-semibold">Rentang Harga (Rp)</div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="minPrice"
                                min="0"
                                inputMode="numeric"
                                placeholder="MIN"
                                defaultValue={minPrice ?? ""}
                                className="w-full rounded border border-[#DDD5CB] bg-white px-2 py-1.5 text-xs focus:border-[var(--color-accent)] focus:outline-none"
                            />
                            <span className="text-[var(--color-muted)]">–</span>
                            <input
                                type="number"
                                name="maxPrice"
                                min="0"
                                inputMode="numeric"
                                placeholder="MAX"
                                defaultValue={maxPrice ?? ""}
                                className="w-full rounded border border-[#DDD5CB] bg-white px-2 py-1.5 text-xs focus:border-[var(--color-accent)] focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full cursor-pointer rounded bg-[var(--color-secondary)] py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[var(--color-primary)]"
                        >
                            Terapkan
                        </button>
                        {hasPriceFilter && (
                            <Link
                                href={href({ minPrice: undefined, maxPrice: undefined, page: 1 })}
                                className="block text-center text-xs font-semibold text-[var(--color-secondary)] hover:underline"
                            >
                                Hapus filter harga
                            </Link>
                        )}
                    </form>
                </aside>

                {/* HASIL */}
                <section className="min-w-0 space-y-4">
                    {/* Toolbar urutan + paginasi */}
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--color-cream)]/60 px-3 py-2.5">
                        <span className="mr-1 text-sm text-[var(--color-muted)]">Urutkan</span>
                        {SORT_BUTTONS.map((s) => (
                            <Link
                                key={s.key}
                                href={href({ sort: s.key === "popular" ? undefined : s.key, page: 1 })}
                                aria-current={sort === s.key ? "true" : undefined}
                                className={`flex h-9 items-center rounded px-4 text-sm transition ${sort === s.key
                                    ? "bg-[var(--color-secondary)] font-semibold text-white"
                                    : "bg-white text-[var(--color-dark)] hover:bg-[var(--color-cream)]"
                                    }`}
                            >
                                {s.label}
                            </Link>
                        ))}
                        <PriceSortSelect
                            value={sort}
                            ascHref={href({ sort: "price_asc", page: 1 })}
                            descHref={href({ sort: "price_desc", page: 1 })}
                        />

                        <div className="ml-auto flex items-center gap-2 text-sm">
                            <span>
                                <span className="font-semibold text-[var(--color-secondary)]">{page}</span>
                                <span className="text-[var(--color-muted)]">/{totalPages}</span>
                            </span>
                            {[
                                { label: "Sebelumnya", icon: "‹", to: page - 1, disabled: page <= 1 },
                                { label: "Berikutnya", icon: "›", to: page + 1, disabled: page >= totalPages },
                            ].map((b) =>
                                b.disabled ? (
                                    <span
                                        key={b.label}
                                        aria-label={b.label}
                                        className="flex h-9 w-9 items-center justify-center rounded bg-white text-lg text-stone-300"
                                    >
                                        {b.icon}
                                    </span>
                                ) : (
                                    <Link
                                        key={b.label}
                                        href={href({ page: b.to })}
                                        aria-label={b.label}
                                        className="flex h-9 w-9 items-center justify-center rounded bg-white text-lg hover:bg-[var(--color-cream)]"
                                    >
                                        {b.icon}
                                    </Link>
                                )
                            )}
                        </div>
                    </div>

                    {data.products.length === 0 ? (
                        <div className="rounded-xl border border-[#E7E2DC] bg-white py-16 text-center">
                            <p className="text-sm font-semibold text-[var(--color-dark)]">
                                Produk tidak ditemukan.
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">
                                Coba gunakan kata kunci lain, ubah filter harga, atau pilih kategori berbeda.
                            </p>
                            <Link
                                href="/products"
                                className="mt-4 inline-block rounded bg-[var(--color-secondary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary)]"
                            >
                                Lihat Semua Produk
                            </Link>
                        </div>
                    ) : (
                        <ProductGrid
                            products={data.products}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
                        />
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-1.5 pt-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                <Link
                                    key={n}
                                    href={href({ page: n })}
                                    aria-current={n === page ? "page" : undefined}
                                    className={`flex h-9 min-w-9 items-center justify-center rounded px-2 text-sm font-semibold ${n === page
                                        ? "bg-[var(--color-secondary)] text-white"
                                        : "bg-white text-[var(--color-dark)] hover:bg-[var(--color-cream)]"
                                        }`}
                                >
                                    {n}
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
