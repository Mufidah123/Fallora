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

const EMPTY_ADDRESS = {
    recipient_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    is_default: false,
};

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

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS);
    const [editingAddrId, setEditingAddrId] = useState(null);
    const [savingAddr, setSavingAddr] = useState(false);

    const [wishlist, setWishlist] = useState([]);

    const [storeName, setStoreName] = useState("");
    const [becomingSeller, setBecomingSeller] = useState(false);
    const [reviewingId, setReviewingId] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [savingReview, setSavingReview] = useState(false);

    const handleBecomeSeller = async (e) => {
        e.preventDefault();
        if (!window.confirm("Daftar sebagai Seller? Akun kamu akan menjadi akun Seller dan menunggu persetujuan Admin.")) return;
        setBecomingSeller(true);
        try {
            const res = await fetch("/api/buyer/become-seller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ store_name: storeName }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Gagal mendaftar sebagai seller.", "error");
                return;
            }
            router.push(data.redirectTo || "/seller/pending");
            router.refresh();
        } catch {
            showToast("Terjadi gangguan jaringan.", "error");
        } finally {
            setBecomingSeller(false);
        }
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Navbar menaut ke /buyer?tab=orders atau /buyer?tab=profile
    useEffect(() => {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (["cart", "orders", "profile", "addresses", "wishlist"].includes(tab)) setActiveTab(tab);
    }, []);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [profRes, cartRes, ordRes, addrRes, wishRes] = await Promise.all([
                fetch("/api/buyer/profile"),
                fetch("/api/buyer/cart"),
                fetch("/api/buyer/orders"),
                fetch("/api/buyer/addresses"),
                fetch("/api/buyer/wishlist"),
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

            if (addrRes.ok) {
                const aData = await addrRes.json();
                const list = aData.addresses || [];
                setAddresses(list);
                const def = list.find((a) => a.is_default) || list[0];
                if (def) {
                    setSelectedAddressId(String(def.id));
                    setShipping({
                        shipping_recipient: def.recipient_name,
                        shipping_phone: def.phone,
                        shipping_address: def.address,
                        shipping_city: def.city,
                        shipping_postal_code: def.postal_code,
                    });
                }
            }

            if (wishRes.ok) {
                const wData = await wishRes.json();
                setWishlist(wData.items || []);
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
                body: JSON.stringify({
                    ...shipping,
                    address_id: selectedAddressId ? Number(selectedAddressId) : null,
                }),
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

    const reloadAddresses = async () => {
        const res = await fetch("/api/buyer/addresses");
        if (res.ok) setAddresses((await res.json()).addresses || []);
    };

    const handlePickAddress = (value) => {
        setSelectedAddressId(value);
        const addr = addresses.find((a) => String(a.id) === value);
        if (!addr) return;
        setShipping({
            shipping_recipient: addr.recipient_name,
            shipping_phone: addr.phone,
            shipping_address: addr.address,
            shipping_city: addr.city,
            shipping_postal_code: addr.postal_code,
        });
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddr(true);
        try {
            const res = await fetch(
                editingAddrId ? `/api/buyer/addresses/${editingAddrId}` : "/api/buyer/addresses",
                {
                    method: editingAddrId ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(addrForm),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Gagal menyimpan alamat.", "error");
                return;
            }
            showToast(data.message || "Alamat tersimpan.");
            setAddrForm(EMPTY_ADDRESS);
            setEditingAddrId(null);
            await reloadAddresses();
        } finally {
            setSavingAddr(false);
        }
    };

    const handleEditAddress = (addr) => {
        setEditingAddrId(addr.id);
        setAddrForm({
            recipient_name: addr.recipient_name,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            postal_code: addr.postal_code,
            is_default: addr.is_default,
        });
    };

    const handleDefaultAddress = async (id) => {
        const res = await fetch(`/api/buyer/addresses/${id}`, { method: "PATCH" });
        const data = await res.json();
        showToast(data.message, res.ok ? "success" : "error");
        if (res.ok) await reloadAddresses();
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Hapus alamat ini?")) return;
        const res = await fetch(`/api/buyer/addresses/${id}`, { method: "DELETE" });
        const data = await res.json();
        showToast(data.message, res.ok ? "success" : "error");
        if (res.ok) {
            if (String(id) === selectedAddressId) setSelectedAddressId("");
            if (editingAddrId === id) {
                setEditingAddrId(null);
                setAddrForm(EMPTY_ADDRESS);
            }
            await reloadAddresses();
        }
    };

    const handleRemoveWishlist = async (productId) => {
        const res = await fetch(`/api/buyer/wishlist?productId=${productId}`, { method: "DELETE" });
        if (res.ok) setWishlist((prev) => prev.filter((w) => w.product_id !== productId));
    };

    const handleWishlistToCart = async (productId) => {
        const res = await fetch("/api/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity: 1 }),
        });
        const data = await res.json();
        showToast(data.message, res.ok ? "success" : "error");
        if (res.ok) {
            const cartRes = await fetch("/api/buyer/cart");
            if (cartRes.ok) setCartItems((await cartRes.json()).items || []);
        }
    };

    const handleSubmitReview = async (e, orderItemId) => {
        e.preventDefault();
        setSavingReview(true);
        try {
            const res = await fetch("/api/buyer/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_item_id: orderItemId, ...reviewForm }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Gagal menyimpan ulasan.", "error");
                return;
            }
            showToast(data.message);
            setReviewingId(null);
            setReviewForm({ rating: 5, comment: "" });
            const ordRes = await fetch("/api/buyer/orders");
            if (ordRes.ok) setOrders((await ordRes.json()).orders || []);
        } finally {
            setSavingReview(false);
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

                    <button
                        type="button"
                        onClick={() => setActiveTab("addresses")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "addresses"
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white text-[var(--color-dark)] border border-[#E7E2DC] hover:bg-[var(--color-cream)]/50"
                            }`}
                    >
                        Alamat Pengiriman ({addresses.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("wishlist")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "wishlist"
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white text-[var(--color-dark)] border border-[#E7E2DC] hover:bg-[var(--color-cream)]/50"
                            }`}
                    >
                        Wishlist ({wishlist.length})
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
                                                src={item.primary_image || "/images/product-1.jpg"}
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
                                            <button
                                                type="button"
                                                disabled={updatingItemId === item.cart_item_id}
                                                onClick={() => handleUpdateQty(item.cart_item_id, 0)}
                                                className="ml-2 text-[11px] font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 cursor-pointer disabled:opacity-40"
                                            >
                                                Hapus
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

                            {addresses.length > 0 && (
                                <select
                                    value={selectedAddressId}
                                    onChange={(e) => handlePickAddress(e.target.value)}
                                    aria-label="Pilih alamat tersimpan"
                                    className="w-full rounded-lg border border-[#DDD5CB] bg-white px-3 py-2 text-xs"
                                >
                                    <option value="">Isi alamat secara manual</option>
                                    {addresses.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.recipient_name} — {a.city}
                                            {a.is_default ? " (utama)" : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
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
                ) : activeTab === "addresses" ? (
                    /* TAB: ALAMAT PENGIRIMAN */
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-7 space-y-3">
                            {addresses.length === 0 ? (
                                <div className="rounded-xl border border-[#E7E2DC] bg-white p-8 text-center text-sm text-[var(--color-muted)]">
                                    Belum ada alamat tersimpan. Tambahkan satu di formulir samping.
                                </div>
                            ) : (
                                addresses.map((a) => (
                                    <div key={a.id} className="rounded-xl border border-[#E7E2DC] bg-white p-4 text-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-sm font-bold text-[var(--color-dark)]">
                                                {a.recipient_name}
                                            </span>
                                            {a.is_default && (
                                                <span className="rounded border border-[var(--color-accent)]/50 bg-[var(--color-cream)]/60 px-2 py-0.5 text-[10px] font-bold text-[var(--color-secondary)]">
                                                    Alamat utama
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[var(--color-muted)]">{a.phone}</p>
                                        <p className="mt-1.5 leading-relaxed">
                                            {a.address}, {a.city} {a.postal_code}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-3 font-semibold">
                                            <button type="button" onClick={() => handleEditAddress(a)} className="underline underline-offset-2 hover:text-[var(--color-primary)] cursor-pointer">
                                                Ubah
                                            </button>
                                            {!a.is_default && (
                                                <button type="button" onClick={() => handleDefaultAddress(a.id)} className="underline underline-offset-2 hover:text-[var(--color-primary)] cursor-pointer">
                                                    Jadikan utama
                                                </button>
                                            )}
                                            <button type="button" onClick={() => handleDeleteAddress(a.id)} className="text-red-700 underline underline-offset-2 hover:text-red-900 cursor-pointer">
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={handleSaveAddress}
                            className="lg:col-span-5 rounded-xl border border-[#E7E2DC] bg-white p-5 space-y-3 h-fit"
                        >
                            <h2 className="text-base font-bold text-[var(--color-primary)]">
                                {editingAddrId ? "Ubah alamat" : "Tambah alamat"}
                            </h2>
                            <input
                                type="text"
                                required
                                placeholder="Nama penerima"
                                value={addrForm.recipient_name}
                                onChange={(e) => setAddrForm((f) => ({ ...f, recipient_name: e.target.value }))}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                            <input
                                type="text"
                                required
                                placeholder="No. telepon"
                                value={addrForm.phone}
                                onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                            <textarea
                                rows={2}
                                required
                                placeholder="Alamat lengkap (jalan, nomor, RT/RW)"
                                value={addrForm.address}
                                onChange={(e) => setAddrForm((f) => ({ ...f, address: e.target.value }))}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                            <div className="grid grid-cols-2 gap-2.5">
                                <input
                                    type="text"
                                    required
                                    placeholder="Kota / Kabupaten"
                                    value={addrForm.city}
                                    onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                                    className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                                />
                                <input
                                    type="text"
                                    required
                                    inputMode="numeric"
                                    maxLength={5}
                                    placeholder="Kode pos"
                                    value={addrForm.postal_code}
                                    onChange={(e) => setAddrForm((f) => ({ ...f, postal_code: e.target.value }))}
                                    className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                                />
                            </div>
                            {!editingAddrId && (
                                <label className="flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={addrForm.is_default}
                                        onChange={(e) => setAddrForm((f) => ({ ...f, is_default: e.target.checked }))}
                                    />
                                    Jadikan alamat utama
                                </label>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={savingAddr}
                                    className="rounded-lg bg-[var(--color-secondary)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-primary)] transition cursor-pointer disabled:opacity-50"
                                >
                                    {savingAddr ? "Menyimpan..." : editingAddrId ? "Simpan perubahan" : "Simpan alamat"}
                                </button>
                                {editingAddrId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingAddrId(null);
                                            setAddrForm(EMPTY_ADDRESS);
                                        }}
                                        className="rounded-lg border border-[#D6CFC6] px-4 py-2.5 text-xs font-semibold cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : activeTab === "wishlist" ? (
                    /* TAB: WISHLIST */
                    <div className="space-y-3">
                        {wishlist.length === 0 ? (
                            <div className="rounded-xl border border-[#E7E2DC] bg-white p-8 text-center space-y-3">
                                <p className="text-sm font-semibold">Wishlist kamu masih kosong.</p>
                                <p className="text-xs text-[var(--color-muted)]">
                                    Buka detail produk dan tekan &quot;Simpan ke wishlist&quot; untuk menyimpannya di sini.
                                </p>
                                <Link href="/products" className="inline-block rounded-lg bg-[var(--color-secondary)] px-4 py-2 text-xs font-bold text-white">
                                    Lihat produk
                                </Link>
                            </div>
                        ) : (
                            wishlist.map((w) => (
                                <div
                                    key={w.product_id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7E2DC] bg-white p-3.5"
                                >
                                    <Link href={`/products/${w.product_id}`} className="flex min-w-0 items-center gap-3">
                                        <img
                                            src={w.primary_image || "/images/product-1.jpg"}
                                            alt={w.name}
                                            className="h-16 w-16 shrink-0 rounded-lg border border-[#EDE8E2] object-cover"
                                        />
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-bold hover:text-[var(--color-secondary)]">{w.name}</div>
                                            <div className="text-xs text-[var(--color-muted)]">Toko: {w.store_name}</div>
                                            <div className="mt-1 text-sm font-bold text-[var(--color-primary)]">{formatRupiah(w.price)}</div>
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-3 text-xs font-semibold">
                                        <button
                                            type="button"
                                            disabled={w.stock <= 0}
                                            onClick={() => handleWishlistToCart(w.product_id)}
                                            className="rounded-lg bg-[var(--color-secondary)] px-3.5 py-2 font-bold text-white hover:bg-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-300"
                                        >
                                            {w.stock <= 0 ? "Stok habis" : "Add to Cart"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveWishlist(w.product_id)}
                                            className="text-red-700 underline underline-offset-2 hover:text-red-900 cursor-pointer"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
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
                                                            <div key={it.id} className="py-1.5">
                                                                <div className="flex justify-between">
                                                                    <span>
                                                                        {it.product_name} × {it.quantity}
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {formatRupiah(it.subtotal)}
                                                                    </span>
                                                                </div>

                                                                {sub.status === "COMPLETED" &&
                                                                    (it.review_rating ? (
                                                                        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                                                                            Ulasanmu: ★ {it.review_rating}/5
                                                                            {it.review_comment ? ` — ${it.review_comment}` : ""}
                                                                        </p>
                                                                    ) : reviewingId === it.id ? (
                                                                        <form
                                                                            onSubmit={(e) => handleSubmitReview(e, it.id)}
                                                                            className="mt-2 space-y-2 rounded-lg border border-[#E7E2DC] bg-white p-3"
                                                                        >
                                                                            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                                                                                {[1, 2, 3, 4, 5].map((n) => (
                                                                                    <button
                                                                                        key={n}
                                                                                        type="button"
                                                                                        role="radio"
                                                                                        aria-checked={reviewForm.rating === n}
                                                                                        aria-label={`${n} bintang`}
                                                                                        onClick={() => setReviewForm((r) => ({ ...r, rating: n }))}
                                                                                        className={`cursor-pointer text-xl leading-none ${n <= reviewForm.rating ? "text-[var(--color-accent)]" : "text-stone-300"}`}
                                                                                    >
                                                                                        ★
                                                                                    </button>
                                                                                ))}
                                                                                <span className="ml-2 text-[11px] text-[var(--color-muted)]">
                                                                                    {reviewForm.rating}/5
                                                                                </span>
                                                                            </div>
                                                                            <textarea
                                                                                rows={2}
                                                                                maxLength={1000}
                                                                                placeholder="Ceritakan pengalamanmu dengan produk ini (opsional)"
                                                                                value={reviewForm.comment}
                                                                                onChange={(e) => setReviewForm((r) => ({ ...r, comment: e.target.value }))}
                                                                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="submit"
                                                                                    disabled={savingReview}
                                                                                    className="rounded-lg bg-[var(--color-secondary)] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[var(--color-primary)] cursor-pointer disabled:opacity-50"
                                                                                >
                                                                                    {savingReview ? "Menyimpan..." : "Kirim ulasan"}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setReviewingId(null)}
                                                                                    className="rounded-lg border border-[#D6CFC6] px-3 py-1.5 text-[11px] font-semibold cursor-pointer"
                                                                                >
                                                                                    Batal
                                                                                </button>
                                                                            </div>
                                                                        </form>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setReviewingId(it.id);
                                                                                setReviewForm({ rating: 5, comment: "" });
                                                                            }}
                                                                            className="mt-1 text-[11px] font-semibold text-[var(--color-secondary)] underline underline-offset-2 hover:text-[var(--color-primary)] cursor-pointer"
                                                                        >
                                                                            Beri rating &amp; ulasan
                                                                        </button>
                                                                    ))}
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
                    <div className="space-y-6">
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

                    <form
                        onSubmit={handleBecomeSeller}
                        className="max-w-xl rounded-xl border border-[#E7E2DC] bg-white p-6 space-y-3 shadow-2xs"
                    >
                        <h2 className="text-base font-bold text-[var(--color-primary)]">Mulai Berjualan</h2>
                        <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                            Ingin menjual produk di Fallora? Daftarkan tokomu. Akun akan berubah menjadi akun Seller
                            setelah disetujui Admin, dan kamu masuk lewat Seller Centre.
                        </p>
                        <div>
                            <label className="block text-xs font-semibold mb-1">Nama Toko</label>
                            <input
                                type="text"
                                required
                                maxLength={150}
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="w-full rounded-lg border border-[#DDD5CB] bg-[var(--color-surface)] px-3 py-2 text-xs"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={becomingSeller}
                            className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-secondary)] transition cursor-pointer disabled:opacity-50"
                        >
                            {becomingSeller ? "Memproses..." : "Daftar Sebagai Seller"}
                        </button>
                    </form>
                    </div>
                )}
            </main>
        </div>
    );
}