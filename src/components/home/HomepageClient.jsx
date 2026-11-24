"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import { FallingLeaves } from "falling-leaves/react";

export default function HomepageClient({
    currentUser,
    initialCategories,
    popularProducts,
    recommendedProducts,
    initialAllProducts,
    initialHasMore,
    initialCartCount,
}) {
    const router = useRouter();
    const isBuyer = currentUser?.role === "BUYER";

    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [allProducts, setAllProducts] = useState(initialAllProducts);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [cartCount, setCartCount] = useState(initialCartCount || 0);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // Fetch ulang daftar produk saat search atau kategori dipilih
    const fetchFilteredProducts = async ({ q, categoryId }) => {
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (categoryId) params.set("categoryId", String(categoryId));
            params.set("limit", isBuyer ? "10" : "8");
            params.set("offset", "0");

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setAllProducts(data.products || []);
                setHasMore(Boolean(data.hasMore));
            }
        } catch {
            showToast("Gagal memuat produk.", "error");
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        setActiveSearch(trimmed);
        fetchFilteredProducts({ q: trimmed, categoryId: selectedCategory });
    };

    const handleSelectCategory = (categoryId) => {
        const nextCat = selectedCategory === categoryId ? null : categoryId;
        setSelectedCategory(nextCat);
        fetchFilteredProducts({ q: activeSearch, categoryId: nextCat });
    };

    const handleResetFilters = () => {
        setSearchInput("");
        setActiveSearch("");
        setSelectedCategory(null);
        setAllProducts(initialAllProducts);
        setHasMore(initialHasMore);
    };

    const handleLoadMore = async () => {
        if (!isBuyer || loadingMore) return;
        setLoadingMore(true);
        try {
            const params = new URLSearchParams();
            if (activeSearch) params.set("q", activeSearch);
            if (selectedCategory) params.set("categoryId", String(selectedCategory));
            params.set("limit", "10");
            params.set("offset", String(allProducts.length));

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setAllProducts((prev) => [...prev, ...(data.products || [])]);
                setHasMore(Boolean(data.hasMore));
            }
        } finally {
            setLoadingMore(false);
        }
    };

    const handleAddToCart = async (product) => {
        if (!currentUser) {
            router.push("/login");
            return;
        }

        if (!isBuyer) {
            showToast("Login sebagai Buyer untuk menggunakan keranjang.", "error");
            return;
        }

        try {
            const res = await fetch("/api/cart/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });

            const data = await res.json();
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            if (!res.ok) {
                showToast(data.message || "Gagal menambahkan produk.", "error");
                return;
            }

            setCartCount(data.cartCount);
            showToast(data.message || "Produk masuk keranjang!");
        } catch {
            showToast("Terjadi gangguan jaringan.", "error");
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
    };

    const isFiltering = Boolean(activeSearch || selectedCategory);

    return (
        <div className="relative min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-dark)]">
            <div aria-hidden="true"
                className="pointer-events-none select-none fixed inset-0 z-0 overflow-hidden opacity-45">
                <FallingLeaves count={14} minSize={22} maxSize={32} />
            </div>
            {toast && (
                <div
                    className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg transition ${toast.type === "error"
                        ? "bg-red-700"
                        : "bg-[var(--color-primary)] border border-[var(--color-peach)]"
                        }`}
                >
                    {toast.message}
                </div>
            )}

            {/* HEADER & NAVBAR */}
            <header className="sticky top-0 z-40 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] text-white shadow-md">
                <div className="border-b border-white/15 bg-black/10">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
                        <div className="flex items-center gap-3 text-white/90">
                            <span>Selamat datang di Fallora E-Commerce</span>
                            {currentUser?.role === "SELLER" && (
                                <Link
                                    href="/seller/dashboard"
                                    className="underline hover:text-[var(--color-peach)]"
                                >
                                    Dashboard Seller
                                </Link>
                            )}
                            {currentUser?.role === "ADMIN" && (
                                <Link
                                    href="/admin/dashboard"
                                    className="underline hover:text-[var(--color-peach)]"
                                >
                                    Dashboard Admin
                                </Link>
                            )}
                        </div>

                        {currentUser ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={isBuyer ? "/buyer/profile" : "/"}
                                    className="flex items-center gap-2 rounded-full bg-white/15 py-0.5 pl-1 pr-3 hover:bg-white/25 transition"
                                >
                                    {currentUser.profile_photo ? (
                                        <img
                                            src={currentUser.profile_photo}
                                            alt={currentUser.username}
                                            className="h-5 w-5 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-cream)] text-[11px] font-bold text-[var(--color-primary)] uppercase">
                                            {currentUser.username?.[0] || "U"}
                                        </span>
                                    )}
                                    <span className="font-semibold text-white">
                                        @{currentUser.username}
                                    </span>
                                </Link>

                                {isBuyer && (
                                    <Link
                                        href="/buyer/orders"
                                        className="hidden sm:inline text-white/90 hover:text-[var(--color-peach)]"
                                    >
                                        Pesanan Saya
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-white/85 hover:text-white underline cursor-pointer"
                                >
                                    Keluar
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 font-semibold">
                                <Link
                                    href="/signup"
                                    className="hover:text-[var(--color-peach)] transition"
                                >
                                    Sign Up
                                </Link>
                                <span className="text-white/40">|</span>
                                <Link
                                    href="/login"
                                    className="rounded bg-[var(--color-cream)] px-2.5 py-0.5 text-[var(--color-primary)] hover:bg-white transition"
                                >
                                    Log In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Navbar */}
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
                    {/* Logo */}
                    <Link
                        href="/"
                        onClick={handleResetFilters}
                        className="flex items-center gap-2.5 shrink-0"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-cream)] font-brand text-lg font-bold text-[var(--color-primary)] shadow-sm">
                            F
                        </div>
                        <div className="leading-tight">
                            <div className="font-brand text-xl tracking-wide text-white">
                                Fallora
                            </div>
                            <div className="font-subtitle text-[9px] font-medium tracking-[0.2em] text-white/90">
                                E-Commerce
                            </div>
                        </div>
                    </Link>

                    {/* Search Bar Produk */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex flex-1 max-w-2xl items-center overflow-hidden rounded-lg bg-white p-1 shadow-sm"
                    >
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Cari produk pilihanmu di Fallora..."
                            className="w-full px-3 py-1.5 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-dark)] cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                        <button
                            type="submit"
                            aria-label="Cari produk"
                            className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-secondary)] transition cursor-pointer"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.3"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span className="hidden sm:inline">Cari</span>
                        </button>
                    </form>

                    {/* Cart Button */}
                    <Link
                        href={currentUser ? "/buyer/cart" : "/login"}
                        className="relative flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition shrink-0"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                        </svg>
                        <span className="hidden md:inline">Keranjang</span>
                        {isBuyer && cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cream)] px-1 text-[11px] font-bold text-[var(--color-primary)] shadow">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 space-y-8">                {/* HERO BANNER GRID*/}
                {!isFiltering && (
                    <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div className="relative overflow-hidden rounded-xl border border-[#E7E2DC] bg-[var(--color-cream)] lg:col-span-8 shadow-sm">
                            <img
                                src="/images/fallora-banner.png"
                                alt="Banner Utama Fallora"
                                className="h-48 sm:h-64 lg:h-72 w-full object-cover"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-1">
                            <div className="relative overflow-hidden rounded-xl border border-[#E7E2DC] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-4 sm:p-5 text-white shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="inline-block rounded bg-[var(--color-peach)]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-cream)]">
                                        Pilihan Lokal
                                    </span>
                                    <h2 className="mt-1.5 text-base sm:text-lg font-bold leading-snug">
                                        Produk Asli & Terkurasi
                                    </h2>
                                    <p className="mt-0.5 text-xs text-white/85">
                                        Langsung dari seller terverifikasi di Fallora.
                                    </p>
                                </div>
                                <a
                                    href="#semua-produk"
                                    className="mt-3 inline-flex w-fit items-center text-xs font-bold text-[var(--color-peach)] hover:text-white"
                                >
                                    Jelajahi Katalog →
                                </a>
                            </div>

                            <div className="relative overflow-hidden rounded-xl border border-[#E7E2DC] bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-accent)] p-4 sm:p-5 text-white shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="inline-block rounded bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                        Harga Terbaik
                                    </span>
                                    <h2 className="mt-1.5 text-base sm:text-lg font-bold leading-snug">
                                        Terjangkau & Kualitas Unggulan
                                    </h2>
                                    <p className="mt-0.5 text-xs text-white/90">
                                        Belanja kebutuhan harian lebih hemat dan aman.
                                    </p>
                                </div>
                                <a
                                    href="#produk-terlaris"
                                    className="mt-3 inline-flex w-fit items-center text-xs font-bold text-[var(--color-cream)] hover:underline"
                                >
                                    Cek Produk Terlaris →
                                </a>
                            </div>
                        </div>
                    </section>
                )}

                {/* KATEGORI PILIHAN */}
                <section className="rounded-xl border border-[#E7E2DC] bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--color-dark)]">
                            Kategori
                        </h2>
                        {selectedCategory && (
                            <button
                                type="button"
                                onClick={() => handleSelectCategory(selectedCategory)}
                                className="text-xs font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer"
                            >
                                Reset Filter Kategori
                            </button>
                        )}
                    </div>

                    {initialCategories.length === 0 ? (
                        <p className="text-xs text-[var(--color-muted)]">
                            Belum ada kategori tersedia.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                            {initialCategories.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleSelectCategory(cat.id)}
                                        className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition cursor-pointer ${isSelected
                                            ? "border-[var(--color-primary)] bg-[var(--color-cream)] text-[var(--color-primary)] shadow-xs"
                                            : "border-[#EDE8E2] bg-[var(--color-surface)] text-[var(--color-dark)] hover:border-[var(--color-accent)] hover:bg-[var(--color-cream)]/40"
                                            }`}
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cream)] font-brand text-sm font-bold text-[var(--color-primary)]">
                                            {cat.name.slice(0, 2).toUpperCase()}
                                        </span>
                                        <span className="mt-2 line-clamp-1 text-xs font-semibold">
                                            {cat.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* PRODUK TERLARIS */}
                {!isFiltering && popularProducts.length > 0 && (
                    <section id="produk-terlaris" className="space-y-3.5">
                        <div className="flex items-center justify-between border-b-2 border-[var(--color-primary)] pb-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-[var(--color-primary)]">
                                    Produk Terlaris
                                </h2>
                                <span className="rounded-full bg-[var(--color-cream)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-secondary)]">
                                    Popular Items
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {popularProducts.map((product) => (
                                <ProductCard
                                    key={`popular-${product.id}`}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    badgeLabel="Terlaris"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* REKOMENDASI ACAK (KHUSUS BUYER YANG LOGIN) */}
                {!isFiltering && isBuyer && recommendedProducts.length > 0 && (
                    <section className="space-y-3.5">
                        <div className="flex items-center justify-between border-b-2 border-[var(--color-accent)] pb-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-[var(--color-secondary)]">
                                    Rekomendasi Untukmu
                                </h2>
                                <span className="rounded-full bg-[var(--color-cream)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                                    Pilihan Acak
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {recommendedProducts.map((product) => (
                                <ProductCard
                                    key={`rec-${product.id}`}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    badgeLabel="Rekomendasi"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* DAFTAR PRODUK */}
                <section id="semua-produk" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E2DC] pb-2.5">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-[var(--color-dark)]">
                                {activeSearch
                                    ? `Hasil Pencarian "${activeSearch}"`
                                    : selectedCategory
                                        ? "Produk Berdasarkan Kategori"
                                        : "Semua Produk"}
                            </h2>
                        </div>
                        {isFiltering && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="text-xs font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer"
                            >
                                Tampilkan Semua Produk
                            </button>
                        )}
                    </div>

                    {loadingProducts ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="h-72 animate-pulse rounded-lg border border-[#E7E2DC] bg-white p-3"
                                >
                                    <div className="aspect-square w-full rounded bg-[var(--color-cream)]/60" />
                                    <div className="mt-3 h-3 w-3/4 rounded bg-stone-200" />
                                    <div className="mt-2 h-3 w-1/2 rounded bg-stone-200" />
                                </div>
                            ))}
                        </div>
                    ) : allProducts.length === 0 ? (
                        <div className="rounded-xl border border-[#E7E2DC] bg-white py-12 text-center">
                            <p className="text-sm font-semibold text-[var(--color-dark)]">
                                Produk tidak ditemukan.
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">
                                Coba gunakan kata kunci lain atau pilih kategori berbeda.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {allProducts.map((product) => (
                                <ProductCard
                                    key={`all-${product.id}`}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    )}

                    <div className="pt-4 text-center">
                        {!currentUser ? (
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-8 py-3 text-sm font-bold text-white shadow-md hover:brightness-105 transition"
                            >
                                Log In untuk Lihat Lainnya
                            </Link>
                        ) : isBuyer ? (
                            <Link
                                href="/products"
                                className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-primary)] bg-white px-8 py-2.5 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-cream)] transition"
                            >
                                Lihat Lainnya
                            </Link>
                        ) : null}
                    </div>
                </section>

                {/* DIREKTORI KATEGORI */}
                <section className="rounded-xl border border-[#E7E2DC] bg-white p-5 sm:p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">
                        Kategori Produk Fallora
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-xs">
                        {initialCategories.map((cat) => (
                            <div key={`dir-${cat.id}`} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSelectCategory(cat.id);
                                        document
                                            .getElementById("semua-produk")
                                            ?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="font-bold uppercase text-[var(--color-dark)] hover:text-[var(--color-secondary)] transition cursor-pointer text-left"
                                >
                                    {cat.name}
                                </button>
                                <p className="text-[var(--color-muted)] leading-relaxed">
                                    {cat.description || `Koleksi produk pilihan kategori ${cat.name}.`}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 mt-10 border-t-4 border-[var(--color-primary)] bg-[var(--color-cream)]/65 text-[var(--color-dark)]">                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div>
                    <div className="font-brand text-xl text-[var(--color-primary)]">
                        Fallora
                    </div>
                    <p className="mt-2 leading-relaxed text-[var(--color-muted)]">
                        Platform e-commerce terpercaya untuk menemukan beragam produk
                        berkualitas dengan harga terjangkau langsung dari seller pilihan.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        Layanan Pelanggan
                    </h4>
                    <ul className="mt-2.5 space-y-1.5 text-[var(--color-muted)]">
                        <li>Bantuan & Pusat Panduan</li>
                        <li>Cara Pembelian</li>
                        <li>Pengiriman & Pelacakan</li>
                        <li>Kebijakan Pengembalian</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        Jelajahi Fallora
                    </h4>
                    <ul className="mt-2.5 space-y-1.5 text-[var(--color-muted)]">
                        <li>
                            <Link href="/signup" className="hover:text-[var(--color-primary)]">
                                Daftar Sebagai Seller
                            </Link>
                        </li>
                        <li>
                            <Link href="/login" className="hover:text-[var(--color-primary)]">
                                Masuk Akun
                            </Link>
                        </li>
                        <li>Syarat & Ketentuan</li>
                        <li>Kebijakan Privasi</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        Pembayaran & Keamanan
                    </h4>
                    <p className="mt-2.5 leading-relaxed text-[var(--color-muted)]">
                        Transaksi aman dengan verifikasi multi-toko dan perlindungan
                        pesanan untuk setiap pembeli.
                    </p>
                </div>
            </div>

                <div className="border-t border-[var(--color-peach)]/40 py-4 text-center text-xs text-[var(--color-muted)]">
                    © {new Date().getFullYear()} Fallora E-Commerce. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
}