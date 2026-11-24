"use client";

import { useState } from "react";
import Link from "next/link";

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export default function ProductCard({ product, onAddToCart, badgeLabel }) {
    const [adding, setAdding] = useState(false);

    const isOutOfStock = Number(product.stock) <= 0;

    const handleAddClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock || adding) return;

        setAdding(true);
        try {
            await onAddToCart(product);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-lg border border-[#E7E2DC] bg-white shadow-[0_1px_3px_rgba(41,37,36,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md">
            {/* Area Foto Produk 1:1 */}
            <Link
                href={`/products/${product.id}`}
                className="relative aspect-square w-full overflow-hidden bg-[var(--color-surface)]"
            >
                {product.primary_image ? (
                    <img
                        src={product.primary_image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--color-cream)]/45 p-4 text-center">
                        <svg
                            className="h-9 w-9 text-[var(--color-primary)]/45"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                        <span className="mt-1.5 text-[11px] font-medium text-[var(--color-muted)]">
                            Foto Produk
                        </span>
                    </div>
                )}

                {/* Badge Pojok Kiri Atas (Kategori / Terlaris / Rekomendasi) */}
                <span className="absolute top-2 left-2 rounded bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm">
                    {badgeLabel || product.category_name}
                </span>

                {/* Badge Stok Habis */}
                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--color-dark)]">
                            Stok Habis
                        </span>
                    </div>
                )}
            </Link>

            {/* Detail Produk */}
            <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
                <div>
                    <Link href={`/products/${product.id}`}>
                        <h3 className="line-clamp-2 min-h-[2.4rem] text-xs sm:text-[13px] font-medium leading-snug text-[var(--color-dark)] group-hover:text-[var(--color-secondary)] transition-colors">
                            {product.name}
                        </h3>
                    </Link>

                    <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="rounded border border-[var(--color-accent)]/50 bg-[var(--color-cream)]/50 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-secondary)]">
                            {product.category_name}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">
                            Stok {product.stock}
                        </span>
                    </div>
                </div>

                <div className="mt-2.5">
                    {/* Harga & Terjual */}
                    <div className="flex items-baseline justify-between gap-1">
                        <span className="text-sm sm:text-[15px] font-bold text-[var(--color-primary)]">
                            {formatRupiah(product.price)}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[var(--color-muted)] shrink-0">
                            {product.sold_count || 0} terjual
                        </span>
                    </div>

                    {/* Nama Toko */}
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-muted)] truncate">
                        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
                        </svg>
                        <span className="truncate">{product.store_name}</span>
                    </div>

                    {/* Tombol Add to Cart */}
                    <button
                        type="button"
                        disabled={isOutOfStock || adding}
                        onClick={handleAddClick}
                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded bg-[var(--color-secondary)] py-1.5 px-2.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 cursor-pointer"
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                        >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                        </svg>
                        <span>
                            {isOutOfStock
                                ? "Habis"
                                : adding
                                    ? "Menambahkan..."
                                    : "Add to Cart"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}