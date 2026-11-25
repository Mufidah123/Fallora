"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";

// Grid produk + logika Add to Cart (dipakai homepage, kategori, search, dan /products)
export default function ProductGrid({
    products,
    badgeLabel,
    className = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
}) {
    const router = useRouter();
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddToCart = async (product) => {
        try {
            const res = await fetch("/api/cart/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });

            // Guest -> arahkan ke login
            if (res.status === 401) {
                router.push("/login");
                return;
            }

            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Gagal menambahkan produk.", "error");
                return;
            }

            showToast(data.message || "Produk masuk keranjang!");
            router.refresh(); // perbarui badge keranjang di navbar
        } catch {
            showToast("Terjadi gangguan jaringan.", "error");
        }
    };

    return (
        <>
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${toast.type === "error"
                        ? "bg-red-700"
                        : "border border-[var(--color-peach)] bg-[var(--color-primary)]"
                        }`}
                >
                    {toast.message}
                </div>
            )}

            <div className={className}>
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        badgeLabel={badgeLabel}
                    />
                ))}
            </div>
        </>
    );
}
