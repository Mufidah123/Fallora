"use client";

import { useRouter } from "next/navigation";

// Dropdown "Harga" pada toolbar urutan. Href dihitung di server.
export default function PriceSortSelect({ value, ascHref, descHref }) {
    const router = useRouter();

    return (
        <select
            value={value === "price_asc" || value === "price_desc" ? value : ""}
            onChange={(e) =>
                router.push(e.target.value === "price_asc" ? ascHref : descHref)
            }
            aria-label="Urutkan berdasarkan harga"
            className={`h-9 min-w-40 cursor-pointer rounded border px-3 text-sm focus:outline-none ${value === "price_asc" || value === "price_desc"
                ? "border-[var(--color-secondary)] font-semibold text-[var(--color-secondary)]"
                : "border-[#E7E2DC] bg-white text-[var(--color-dark)]"
                }`}
        >
            <option value="" disabled>
                Harga
            </option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
        </select>
    );
}
