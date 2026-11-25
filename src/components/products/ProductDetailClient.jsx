// src/components/products/ProductDetailClient.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatRupiah(val) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(val || 0));
}

export default function ProductDetailClient({
    product,
    images,
    reviews,
    avgRating,
    currentUser,
}) {
    const router = useRouter();
    const isBuyer = currentUser?.role === "BUYER";

    const [activeImage, setActiveImage] = useState(
        images[0]?.image_path || "/images/product-1.jpg"
    );
    const [qty, setQty] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleAddToCart = async () => {
        if (!currentUser) {
            router.push("/login");
            return;
        }
        if (!isBuyer) {
            setFeedback({ type: "error", text: "Aksi Add to Cart khusus untuk Buyer." });
            return;
        }

        setSubmitting(true);
        setFeedback(null);
        try {
            const res = await fetch("/api/cart/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, quantity: qty }),
            });
            const data = await res.json();
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            if (!res.ok) {
                setFeedback({ type: "error", text: data.message || "Gagal menambah ke keranjang." });
                return;
            }
            setFeedback({ type: "success", text: data.message || "Berhasil ditambahkan ke keranjang!" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-dark)]">
            <header className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] text-white shadow">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
                    <Link href="/" className="font-brand text-xl">
                        Fallora
                    </Link>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <Link href="/products" className="hover:text-[var(--color-peach)]">
                            Semua Produk
                        </Link>
                        {isBuyer ? (
                            <Link
                                href="/buyer"
                                className="rounded-lg bg-[var(--color-cream)] px-3 py-1.5 text-[var(--color-primary)]"
                            >
                                Buyer Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-lg bg-[var(--color-cream)] px-3 py-1.5 text-[var(--color-primary)]"
                            >
                                Log In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 rounded-xl border border-[#E7E2DC] bg-white p-5 md:grid-cols-12 shadow-xs">
                    {/* Galeri Gambar */}
                    <div className="md:col-span-5 space-y-3">
                        <div className="aspect-square w-full overflow-hidden rounded-lg border border-[#E7E2DC] bg-[var(--color-surface)]">
                            <img
                                src={activeImage}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => setActiveImage(img.image_path)}
                                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border cursor-pointer ${activeImage === img.image_path
                                                ? "border-2 border-[var(--color-primary)]"
                                                : "border-[#E7E2DC]"
                                            }`}
                                    >
                                        <img
                                            src={img.image_path}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Produk & Aksi */}
                    <div className="md:col-span-7 flex flex-col justify-between space-y-5">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-[var(--color-cream)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary)]">
                                    {product.category_name}
                                </span>
                                <span className="text-xs text-[var(--color-muted)]">
                                    Stok: <strong>{product.stock}</strong>
                                </span>
                                <span className="text-xs font-semibold text-[var(--color-secondary)]">
                                    ★ {avgRating > 0 ? `${avgRating} / 5` : "Belum ada rating"}
                                </span>
                            </div>

                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-dark)]">
                                {product.name}
                            </h1>

                            <div className="rounded-lg bg-[var(--color-cream)]/60 px-4 py-3">
                                <span className="text-2xl font-bold text-[var(--color-primary)]">
                                    {formatRupiah(product.price)}
                                </span>
                            </div>

                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                    Deskripsi Produk
                                </h2>
                                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-dark)]">
                                    {product.description || "Tidak ada deskripsi tambahan."}
                                </p>
                            </div>

                            {/* Informasi Toko */}
                            <div className="rounded-lg border border-[#EDE8E2] bg-[var(--color-surface)] p-3.5">
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                    Informasi Toko
                                </div>
                                <div className="mt-1 text-sm font-bold text-[var(--color-primary)]">
                                    {product.store_name}
                                </div>
                                {product.store_description && (
                                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                                        {product.store_description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Kontrol Qty & Add to Cart (Public User hanya melihat detail) */}
                        <div className="border-t border-[#EDE8E2] pt-4 space-y-3">
                            {isBuyer ? (
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center rounded-lg border border-[#D6CFC6] bg-white">
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                                            className="px-3 py-2 text-sm font-bold text-[var(--color-dark)] hover:bg-[var(--color-cream)] cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="px-4 py-2 text-sm font-semibold">{qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
                                            className="px-3 py-2 text-sm font-bold text-[var(--color-dark)] hover:bg-[var(--color-cream)] cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={submitting || product.stock <= 0}
                                        onClick={handleAddToCart}
                                        className="flex-1 rounded-lg bg-[var(--color-secondary)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary)] transition cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? "Menambahkan..." : "Add to Cart"}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--color-cream)]/50 p-3 text-xs">
                                    <span className="text-[var(--color-muted)]">
                                        Mode tamu: Anda hanya dapat melihat detail produk. Login sebagai Buyer untuk menambah ke keranjang atau favorit.
                                    </span>
                                    <Link
                                        href="/login"
                                        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 font-bold text-white hover:bg-[var(--color-secondary)]"
                                    >
                                        Log In Buyer
                                    </Link>
                                </div>
                            )}

                            {feedback && (
                                <p
                                    className={`text-xs font-semibold ${feedback.type === "error" ? "text-red-700" : "text-[var(--color-primary)]"
                                        }`}
                                >
                                    {feedback.text}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating & Review Produk */}
                <section className="rounded-xl border border-[#E7E2DC] bg-white p-5 shadow-xs space-y-4">
                    <h2 className="text-base font-bold text-[var(--color-dark)]">
                        Rating & Review ({reviews.length})
                    </h2>

                    {reviews.length === 0 ? (
                        <p className="text-xs text-[var(--color-muted)]">
                            Belum ada ulasan untuk produk ini.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map((rev) => (
                                <div
                                    key={rev.id}
                                    className="rounded-lg border border-[#EDE8E2] bg-[var(--color-surface)] p-3.5 text-xs space-y-1"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-[var(--color-dark)]">
                                            @{rev.username}
                                        </span>
                                        <span className="font-bold text-[var(--color-accent)]">
                                            ★ {rev.rating}/5
                                        </span>
                                    </div>
                                    <p className="text-[var(--color-dark)]">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}