"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Avatar: foto profil jika ada, jika tidak ikon user default (bukan inisial)
function Avatar({ user }) {
    if (user.profile_photo) {
        return (
            <img
                src={user.profile_photo}
                alt={user.username}
                className="h-6 w-6 rounded-full object-cover"
            />
        );
    }
    return (
        <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-primary)]"
        >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
            </svg>
        </span>
    );
}

export default function Navbar({ currentUser, cartCount = 0, keyword = "" }) {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState(keyword);
    const isBuyer = currentUser?.role === "BUYER";

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (!trimmed) return;
        router.push(`/search?keyword=${encodeURIComponent(trimmed)}`);
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-40 bg-[var(--color-secondary)] text-white shadow-md">
            {/* Top bar */}
            <div className="border-b border-white/15 bg-black/10">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
                    <div className="flex items-center gap-3 font-semibold text-white/90">
                        {currentUser?.role === "SELLER" && (
                            <Link href="/seller/dashboard" className="hover:text-[var(--color-cream)]">
                                Dashboard Seller
                            </Link>
                        )}
                        {currentUser?.role === "ADMIN" && (
                            <Link href="/admin/dashboard" className="hover:text-[var(--color-cream)]">
                                Dashboard Admin
                            </Link>
                        )}
                        {!currentUser && (
                            <>
                                <Link href="/login?role=seller" className="hover:text-[var(--color-cream)]">
                                    Seller Centre
                                </Link>
                                <span className="text-white/40">|</span>
                                <Link href="/signup?role=seller" className="hover:text-[var(--color-cream)]">
                                    Mulai Berjualan
                                </Link>
                            </>
                        )}
                    </div>

                    {currentUser ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href={isBuyer ? "/buyer?tab=profile" : "/"}
                                className="flex items-center gap-2 rounded-full bg-white/15 py-0.5 pl-0.5 pr-3 transition hover:bg-white/25"
                            >
                                <Avatar user={currentUser} />
                                <span className="font-semibold">{currentUser.username}</span>
                            </Link>

                            {isBuyer && (
                                <Link
                                    href="/buyer?tab=orders"
                                    className="hidden text-white/90 hover:text-[var(--color-cream)] sm:inline"
                                >
                                    Pesanan Saya
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="cursor-pointer text-white/85 underline hover:text-white"
                            >
                                Keluar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 font-semibold">
                            <Link href="/signup" className="transition hover:text-[var(--color-cream)]">
                                Sign Up
                            </Link>
                            <span className="text-white/40">|</span>
                            <Link
                                href="/login"
                                className="rounded bg-[var(--color-cream)] px-2.5 py-0.5 text-[var(--color-primary)] transition hover:bg-white"
                            >
                                Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Main navbar */}
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
                <Link href="/" className="flex shrink-0 items-center gap-2.5">
                    <img
                        src="/assets/logo-fallora.png"
                        alt="Logo Fallora"
                        className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div className="leading-tight">
                        <div className="font-brand text-xl tracking-wide">Fallora</div>
                        <div className="font-subtitle text-[9px] font-medium tracking-[0.2em] text-white/90">
                            E-Commerce
                        </div>
                    </div>
                </Link>

                <form
                    onSubmit={handleSearchSubmit}
                    role="search"
                    className="flex max-w-2xl flex-1 items-center overflow-hidden rounded-lg bg-white p-1 shadow-sm"
                >
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Cari produk apa?"
                        className="w-full px-3 py-1.5 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Cari produk"
                        className="flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary)]"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="hidden sm:inline">Search</span>
                    </button>
                </form>

                <Link
                    href={isBuyer ? "/buyer" : "/login"}
                    aria-label="Keranjang"
                    className="relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white/15"
                >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                    {isBuyer && cartCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cream)] px-1 text-[11px] font-bold text-[var(--color-primary)] shadow">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
