import { getSession } from "@/lib/auth";
import { getBuyerHeaderContext } from "@/services/productService";
import Navbar from "./Navbar";

// Navbar versi server: mengambil user & jumlah keranjang sendiri.
// Dipakai di semua halaman selain homepage (kategori, search, produk, detail).
export default async function SiteHeader({ keyword = "" }) {
    const session = await getSession();
    const { currentUser, initialCartCount } = await getBuyerHeaderContext(session?.userId);

    return <Navbar currentUser={currentUser} cartCount={initialCartCount} keyword={keyword} />;
}
