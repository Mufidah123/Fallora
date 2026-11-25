import Link from "next/link";
import { getSession } from "@/lib/auth";
import { categoryPath } from "@/lib/slug";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
// import Leaves from "@/components/home/Leaves";
import ProductGrid from "@/components/catalog/ProductGrid";
import {
  getAllCategories,
  getBuyerHeaderContext,
  getCatalogProducts,
  getPopularProducts,
  getRandomRecommendedProducts,
} from "@/services/productService";

export const dynamic = "force-dynamic";

function SectionTitle({ children, tone = "primary" }) {
  return (
    <h2
      className={`border-b-2 pb-2 text-base font-bold uppercase tracking-wide sm:text-lg ${tone === "primary"
        ? "border-[var(--color-primary)] text-[var(--color-primary)]"
        : "border-[var(--color-accent)] text-[var(--color-secondary)]"
        }`}
    >
      {children}
    </h2>
  );
}

export default async function HomePage() {
  const session = await getSession();
  const { currentUser, initialCartCount } = await getBuyerHeaderContext(
    session?.userId
  );
  const isBuyer = currentUser?.role === "BUYER";

  const [categories, popularProducts, recommendedProducts, latest] =
    await Promise.all([
      getAllCategories(),
      getPopularProducts(5),
      isBuyer ? getRandomRecommendedProducts(5) : Promise.resolve([]),
      getCatalogProducts({ sort: "latest", limit: 10, offset: 0 }),
    ]);

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)] text-[var(--color-dark)]">
      <Navbar currentUser={currentUser} cartCount={initialCartCount} />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-6">
        {/* BANNER */}
        <section className="space-y-3">
          <img
            src="/assets/Autumn_Sale_Banner.png"
            alt="Autumn Sale Fallora, diskon hingga 30%"
            className="w-full rounded-xl border border-[#E7E2DC] object-cover shadow-sm"
          />
          <img
            src="/assets/Fallora_Banner.png"
            alt="Fallora Essentials: produk premium pilihan, koleksi eksklusif dan autentik Indonesia"
            className="w-full rounded-xl border border-[#E7E2DC] object-cover shadow-sm"
          />
        </section>

        {/* KATEGORI */}
        <section className="rounded-xl border border-[#E7E2DC] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-1 text-center text-lg font-bold uppercase tracking-wide">
            Kategori
          </h2>
          <div className="mx-auto mb-4 h-0.5 w-14 bg-[var(--color-primary)]" />
          {categories.length === 0 ? (
            <p className="text-center text-xs text-[var(--color-muted)]">
              Belum ada kategori tersedia.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={categoryPath(cat)}
                  className="rounded bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[var(--color-secondary)]"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* PRODUK TERLARIS */}
        {popularProducts.length > 0 && (
          <section id="produk-terlaris" className="space-y-3.5">
            <SectionTitle>Produk Terlaris</SectionTitle>
            <ProductGrid products={popularProducts} badgeLabel="Terlaris" />
          </section>
        )}

        {/* REKOMENDASI ACAK (KHUSUS BUYER) */}
        {isBuyer && recommendedProducts.length > 0 && (
          <section className="space-y-3.5">
            <SectionTitle tone="accent">Rekomendasi Untukmu</SectionTitle>
            <ProductGrid products={recommendedProducts} badgeLabel="Rekomendasi" />
          </section>
        )}

        {/* PRODUK TERBARU */}
        <section id="semua-produk" className="space-y-3.5">
          <SectionTitle>Produk Terbaru</SectionTitle>
          {latest.products.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-muted)]">
              Belum ada produk.
            </p>
          ) : (
            <ProductGrid products={latest.products} />
          )}
          <div className="pt-2 text-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-primary)] bg-white px-8 py-2.5 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-cream)]"
            >
              Lihat Lainnya
            </Link>
          </div>
        </section>

        {/* DIREKTORI KATEGORI */}
        <section className="rounded-xl border border-[#E7E2DC] bg-white p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Kategori Produk Fallora
          </h3>
          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <Link
                  href={categoryPath(cat)}
                  className="font-bold uppercase text-[var(--color-dark)] transition hover:text-[var(--color-secondary)]"
                >
                  {cat.name}
                </Link>
                <p className="leading-relaxed text-[var(--color-muted)]">
                  {cat.description || `Koleksi produk pilihan kategori ${cat.name}.`}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
