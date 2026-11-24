import { getSession } from "@/lib/auth";
import HomepageClient from "@/components/home/HomepageClient";
import {
  getAllCategories,
  getBuyerHeaderContext,
  getCatalogProducts,
  getPopularProducts,
  getRandomRecommendedProducts,
} from "@/services/productService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const { currentUser, initialCartCount } = await getBuyerHeaderContext(
    session?.userId
  );

  const isBuyer = currentUser?.role === "BUYER";
  const initialLimit = isBuyer ? 8 : 5;

  const [categories, popularProducts, recommendedProducts, catalogData] =
    await Promise.all([
      getAllCategories(),
      getPopularProducts(5),
      isBuyer ? getRandomRecommendedProducts(5) : Promise.resolve([]),
      getCatalogProducts({ limit: initialLimit, offset: 0 }),
    ]);

  return (
    <HomepageClient
      currentUser={currentUser}
      initialCategories={categories}
      popularProducts={popularProducts}
      recommendedProducts={recommendedProducts}
      initialAllProducts={catalogData.products}
      initialHasMore={catalogData.hasMore}
      initialCartCount={initialCartCount}
    />
  );
}