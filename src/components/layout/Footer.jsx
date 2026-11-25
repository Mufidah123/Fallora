import Link from "next/link";

export default function Footer() {
    return (
        <footer className="relative z-10 mt-10 border-t-4 border-[var(--color-primary)] bg-[var(--color-cream)]/65 text-[var(--color-dark)]">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <div className="font-brand text-xl text-[var(--color-primary)]">Fallora</div>
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
    );
}
