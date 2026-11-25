import { NextResponse } from "next/server";
import { getCatalogProducts, parseCatalogQuery } from "@/services/productService";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = String(searchParams.get("q") || "");
        const categoryId = searchParams.get("categoryId");
        const limit = Math.min(Math.max(Number(searchParams.get("limit") || 10), 1), 40);
        const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

        const { sort, minPrice, maxPrice } = parseCatalogQuery(Object.fromEntries(searchParams));
        const data = await getCatalogProducts({ q, categoryId, sort, minPrice, maxPrice, limit, offset });
        return NextResponse.json(data);
    } catch (err) {
        console.error("GET_PRODUCTS_ERROR:", err);
        return NextResponse.json(
            { message: "Gagal memuat daftar produk." },
            { status: 500 }
        );
    }
}