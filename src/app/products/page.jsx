"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";

export default function ProductListPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetch("/api/categories")
            .then((r) => (r.ok ? r.json() : { categories: [] }))
            .then((d) => setCategories(d.categories || []))
            .catch(() => { });
    }, []);

    const loadProducts = useCallback(async (qVal, catVal) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (qVal.trim()) params.set("q", qVal.trim());
            if (catVal) params.set("categoryId", catVal);
            params.set("limit", "40");
            params.set("offset", "0");

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setProducts(data.products || []);
                setTotal(data.total || 0);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts(search, selectedCategory);
    }, [selectedCategory, loadProducts]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadProducts(search, selectedCategory);
    };

    const handleAddToCart = async (product) => {
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
            showToast(data.message || "Gagal menambahkan ke keranjang.", "error");
            return;
        }

        showToast(data.message || "Produk masuk keranjang!");
    };

    return (
        <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-dark)]">
            {toast && (
                <div
                    className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-xs font-semibold text-white shadow-lg ${toast.type === "error" ? "bg-red-700" : "bg-[var(--color-primary)]"
                        }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Navbar */}
            <header className="sticky top-0 z-30 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] text-white shadow">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
                    <Link href="/" className="font-brand text-xl tracking-wide text-white">
                        Fallora
                    </Link>

                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex flex-1 max-w-xl items-center rounded-lg bg-white p-1"
                    >
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama produk..."
                            className="w-full px-3 py-1.5 text-sm text-[var(--color-dark)] focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-secondary)] cursor-pointer"
                        >
                            Cari
                        </button>
                    </form>

                    <div className="flex items-center gap-3 text-xs font-semibold">
                        <Link href="/" className="hover:text-[var(--color-peach)]">
                            Beranda
                        </Link>
                        <Link
                            href="/buyer"
                            className="rounded-lg bg-[var(--color-cream)] px-3 py-1.5 text-[var(--color-primary)] hover:bg-white"
                        >
                            Buyer Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7E2DC] bg-white p-4 shadow-xs">
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-primary)]">
                            Daftar Produk Lengkap
                        </h1>
                        <p className="text-xs text-[var(--color-muted)]">
                            Menampilkan {products.length} dari {total} produk tersedia
                        </p>
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-dark)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-72 animate-pulse rounded-lg border border-[#E7E2DC] bg-white"
                            />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-xl border border-[#E7E2DC] bg-white py-12 text-center text-sm text-[var(--color-muted)]">
                        Tidak ada produk yang sesuai dengan pencarian/filter.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}