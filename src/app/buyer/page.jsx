"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatRupiah(val) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(val || 0));
}

const STATUS_LABEL = {
    PENDING_PAYMENT: { label: "Menunggu Pembayaran", style: "bg-amber-100 text-amber-900" },
    PROCESSING: { label: "Sedang Diproses", style: "bg-orange-100 text-orange-900" },
    SHIPPED: { label: "Dalam Perjalanan", style: "bg-blue-100 text-blue-900" },
    COMPLETED: { label: "Telah Sampai / Selesai", style: "bg-emerald-100 text-emerald-900" },
    CANCELLED: { label: "Dibatalkan", style: "bg-red-100 text-red-900" },
};

export default function BuyerDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("cart");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [profile, setProfile] = useState({
        name: "",
        username: "",
        email: "",
        phone: "",
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const [cartItems, setCartItems] = useState([]);
    const [updatingItemId, setUpdatingItemId] = useState(null);

    const [shipping, setShipping] = useState({
        shipping_recipient: "",
        shipping_phone: "",
        shipping_address: "",
        shipping_city: "",
        shipping_postal_code: "",
    });
    const [checkingOut, setCheckingOut] = useState(false);

    const [orders, setOrders] = useState([]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [profRes, cartRes, ordRes] = await Promise.all([
                fetch("/api/buyer/profile"),
                fetch("/api/buyer/cart"),
                fetch("/api/buyer/orders"),
            ]);

            if (profRes.status === 401 || cartRes.status === 401) {
                router.push("/login");
                return;
            }

            if (profRes.ok) {
                const pData = await profRes.json();
                if (pData.profile) {
                    setProfile({
                        name: pData.profile.name || "",
                        username: pData.profile.username || "",
                        email: pData.profile.email || "",
                        phone: pData.profile.phone || "",
                    });
                    setShipping((prev) => ({
                        ...prev,
                        shipping_recipient: prev.shipping_recipient || pData.profile.name || "",
                        shipping_phone: prev.shipping_phone || pData.profile.phone || "",
                    }));
                }
            }

            if (cartRes.ok) {
                const cData = await cartRes.json();
                setCartItems(cData.items || []);
            }

            if (ordRes.ok) {
                const oData = await ordRes.json();
                setOrders(oData.orders || []);
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleUpdateQty = async (itemId, nextQty) => {
        setUpdatingItemId(itemId);
        try {
            const res = await fetch(`/api/buyer/cart/items/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: nextQty }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Gagal memperbarui jumlah.", "error");
                return;
            }
            const cartRes = await fetch("/api/buyer/cart");
            if (cartRes.ok) {
                const cData = await cartRes.json();
                setCartItems(cData.items || []);
            }
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            showToast("Keranjang masih kosong.", "error");
            return;
        }
        setCheckingOut(true);
        try {
            const res = await fetch("/api/buyer/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(shipping),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Checkout gagal.", "error");
                return;
            }
            showToast(data.message || "Checkout berhasil!");
            setCartItems([]);
            const ordRes = await fetch("/api/buyer/orders");
            if (ordRes.ok) {
                const oData = await ordRes.json();
                setOrders(oData.orders || []);
            }
            setActiveTab("orders");
        } finally {
            setCheckingOut(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await fetch("/api/buyer/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profile.name,
                    username: profile.username,
                    phone: profile.phone,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Gagal menyimpan profil.", "error");
                return;
            }
            showToast(data.message || "Profil tersimpan!");
        } finally {
            setSavingProfile(false);
        }
    };

    const cartTotal = cartItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
    );

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

            {/* Header */}
            <header className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] text-white shadow">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div>
                        <Link href="/" className="font-brand text-xl tracking-wide">
                            Fallora
                        </Link>
                        <p className="text-xs text-white/85">
                            Buyer Dashboard — @{profile.username || "buyer"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                        <Link href="/products" className="hover:text-[var(--color-peach)]">
                            Belanja Produk
                        </Link>
                        <Link
                            href="/"
                            className="rounded-lg bg-[var(--color-cream)] px-3 py-1.5 text-[var(--color-primary)]"
                        >
                            Homepage
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                {/* Navigasi Tab */}
                <div className="flex flex-wrap gap-2 border-b border-[#E7E2DC] pb-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab("cart")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "cart"
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white text-[var(--color-dark)] border border-[#E7E2DC] hover:bg-[var(--color-cream)]/50"
                            }`}
                    >
                        Shopping Cart ({cartItems.reduce((s, i) => s + i.quantity, 0)})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "orders"
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white text-[var(--color-dark)] border border-[#E7E2DC] hover:bg-[var(--color-cream)]/50"
                            }`}
                    >
                        Order History & Tracking ({orders.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "profile"
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white text-[var(--color-dark)] border border-[#E7E2DC] hover:bg-[var(--color-cream)]/50"
                            }`}
                    >
                        Profile Management
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-[#E7E2DC] bg-white p-8 text-center text-sm text-[var(--color-muted)]">
                        Memuat data Buyer Dashboard...
                    </div>
                ) : activeTab === "cart" ? (
                    /* TAB 1: SHOPPING CART & CHECKOUT */
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-7 space-y-3">
                            {cartItems.length === 0 ? (
                                <div className="rounded-xl border border-[#E7E2DC] bg-white p-8 text-center space-y-3">
                                    <p className="text-sm font-semibold">Keranjang belanja kamu masih kosong.</p>
                                    <Link
                                        href="/products"
                                        className="inline-block rounded-lg bg-[var(--color-secondary)] px-4 py-2 text-xs font-bold text-white"
                                    >
                                        Cari Produk
                                    </Link>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div
                                        key={item.cart_item_id}
                                        className="flex items-center justify-between gap-4 rounded-xl border border-[#E7E2DC] bg-white p-3.5 shadow-2xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={item.primary_image || "/images/products/product-1.png"}
                                                alt={item.product_name}
                                                className="h-16 w-16 rounded-lg object-cover border border-[#EDE8E2] shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-bold text-[var(--color-dark)]">
                                                    {item.product_name}
                                                </div>
                                                <div className="text-xs text-[var(--color-muted)]">
                                                    Toko: {item.store_name}
                                                </div>
                                                <div className="mt-1 text-sm font-bold text-[var(--color-primary)]">
                                                    {formatRupiah(item.price)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                disabled={updatingItemId === item.cart_item_id}
                                                onClick={() => handleUpdateQty(item.cart_item_id, item.quantity - 1)}
                                                className="h-7 w-7 rounded border border-[#D6CFC6] text-xs font-bold hover:bg-[var(--color-cream)] cursor-pointer"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                                            <button
                                                type="button"
                                                disabled={
                                                    updatingItemId === item.cart_item_id || item.quantity >= item.stock
                                                }
                                                onClick={() => handleUpdateQty(item.cart_item_id, item.quantity + 1)}
                                                className="h-7 w-7 rounded border border-[#D6CFC6] text-xs font-bold hover:bg-[var(--color-cream)] cursor-pointer disabled:opacity-40"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Form Pengiriman & Checkout */}
                        <form
                            onSubmit={handleCheckout}
                            className="lg:col-span-5 rounded-xl border border-[#E7E2DC] bg-white p-5 space-y-3.5 h-fit shadow-2xs"
                        >
                            <h2 className="text-base font-bold text-[var(--color-primary)]">
                                Ringkasan & Checkout
                            </h2>

                            <input
                                type="text"
                                required
                                placeholder="Nama Penerima"
                                value={shipping.shipping_recipient}
                                onChange={(e) =>
                                    setShipping((p) => ({ ...p, shipping_recipient: e.target.value }))
                                }
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                            <input
                                type="text"
                                required
                                placeholder="No. Telepon Penerima"
                                value={shipping.shipping_phone}
                                onChange={(e) =>
                                    setShipping((p) => ({ ...p, shipping_phone: e.target.value }))
                                }
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                            <textarea
                                rows={2}
                                required
                                placeholder="Alamat Lengkap Pengiriman"
                                value={shipping.shipping_address}
                                onChange={(e) =>
                                    setShipping((p) => ({ ...p, shipping_address: e.target.value }))
                                }
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                            <div className="grid grid-cols-2 gap-2.5">
                                <input
                                    type="text"
                                    required
                                    placeholder="Kota / Kabupaten"
                                    value={shipping.shipping_city}
                                    onChange={(e) =>
                                        setShipping((p) => ({ ...p, shipping_city: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                                />
                                <input
                                    type="text"
                                    required
                                    placeholder="Kode Pos"
                                    value={shipping.shipping_postal_code}
                                    onChange={(e) =>
                                        setShipping((p) => ({ ...p, shipping_postal_code: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-[#EDE8E2] pt-3 text-sm font-bold">
                                <span>Total Pembayaran</span>
                                <span className="text-[var(--color-primary)]">{formatRupiah(cartTotal)}</span>
                            </div>

                            <button
                                type="submit"
                                disabled={checkingOut || cartItems.length === 0}
                                className="w-full rounded-lg bg-[var(--color-secondary)] py-2.5 text-xs font-bold text-white hover:bg-[var(--color-primary)] transition cursor-pointer disabled:opacity-50"
                            >
                                {checkingOut ? "Memproses Pesanan..." : "Checkout Sekarang"}
                            </button>
                        </form>
                    </div>
                ) : activeTab === "orders" ? (
                    /* TAB 2: ORDER HISTORY & ORDER TRACKING */
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="rounded-xl border border-[#E7E2DC] bg-white p-8 text-center text-sm text-[var(--color-muted)]">
                                Belum ada riwayat pesanan.
                            </div>
                        ) : (
                            orders.map((ord) => (
                                <div
                                    key={ord.id}
                                    className="rounded-xl border border-[#E7E2DC] bg-white p-5 space-y-4 shadow-2xs"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE8E2] pb-3">
                                        <div>
                                            <span className="text-sm font-bold text-[var(--color-primary)]">
                                                {ord.order_number}
                                            </span>
                                            <p className="text-xs text-[var(--color-muted)]">
                                                Tujuan: {ord.shipping_recipient} • {ord.shipping_address}, {ord.shipping_city}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-[var(--color-dark)]">
                                                {formatRupiah(ord.total_amount)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {ord.sub_orders?.map((sub) => {
                                            const badge = STATUS_LABEL[sub.status] || {
                                                label: sub.status,
                                                style: "bg-stone-100 text-stone-800",
                                            };
                                            return (
                                                <div
                                                    key={sub.sub_order_id}
                                                    className="rounded-lg border border-[#EDE8E2] bg-[var(--color-surface)] p-3.5 space-y-2"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-[var(--color-dark)]">
                                                            Toko: {sub.store_name}
                                                        </span>
                                                        <span
                                                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.style}`}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    </div>

                                                    <div className="divide-y divide-[#E7E2DC] text-xs">
                                                        {sub.items?.map((it) => (
                                                            <div key={it.id} className="flex justify-between py-1.5">
                                                                <span>
                                                                    {it.product_name} × {it.quantity}
                                                                </span>
                                                                <span className="font-semibold">
                                                                    {formatRupiah(it.subtotal)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* TAB 3: PROFILE MANAGEMENT */
                    <form
                        onSubmit={handleSaveProfile}
                        className="max-w-xl rounded-xl border border-[#E7E2DC] bg-white p-6 space-y-4 shadow-2xs"
                    >
                        <h2 className="text-base font-bold text-[var(--color-primary)]">
                            Informasi Akun Buyer
                        </h2>

                        <div>
                            <label className="block text-xs font-semibold mb-1">Email</label>
                            <input
                                type="email"
                                disabled
                                value={profile.email}
                                className="w-full rounded-lg border border-[#E7E2DC] bg-stone-100 px-3 py-2 text-xs text-[var(--color-muted)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                required
                                value={profile.name}
                                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1">Username</label>
                            <input
                                type="text"
                                required
                                value={profile.username}
                                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-1">Nomor Telepon</label>
                            <input
                                type="text"
                                value={profile.phone}
                                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="rounded-lg bg-[var(--color-secondary)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-primary)] transition cursor-pointer disabled:opacity-50"
                        >
                            {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}