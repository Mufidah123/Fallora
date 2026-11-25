import Link from "next/link";
import { NavLinks, LogoutButton } from "./NavLinks";

// Kerangka halaman dashboard (Seller & Admin): sidebar di kiri, konten di kanan.
export default function DashShell({ area, user, nav, children }) {
    return (
        <div className="min-h-screen bg-[var(--color-surface)] md:grid md:grid-cols-[220px_1fr]">
            <aside className="border-b border-[#dcc9b2] bg-[#f4e6d4] px-3 py-3 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r md:px-0 md:py-5">
                <div className="mb-3 flex items-center justify-between px-1 md:mb-6 md:block md:px-5">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/assets/logo-fallora.png" alt="" className="h-8 w-8 rounded object-cover" />
                        <span className="font-brand text-xl leading-none text-[var(--color-primary)]">
                            Fallora
                        </span>
                    </Link>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)] md:mt-2">
                        {area}
                    </p>
                </div>

                <NavLinks items={nav} />

                <div className="mt-3 hidden border-t border-[#dcc9b2] px-5 pt-4 text-xs md:mt-auto md:block">
                    <p className="font-bold text-[var(--color-dark)]">{user.name}</p>
                    <p className="mb-2 text-[var(--color-muted)]">@{user.username}</p>
                    <div className="flex flex-col gap-1">
                        <Link href="/" className="underline underline-offset-2 hover:text-[var(--color-primary)]">
                            Lihat situs
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            <main className="min-w-0 px-5 py-7 md:px-9 md:py-9">
                <div className="mx-auto max-w-5xl">{children}</div>
                <div className="mt-10 flex gap-4 border-t border-[#e6dacb] pt-4 text-xs md:hidden">
                    <Link href="/" className="underline">Lihat situs</Link>
                    <LogoutButton />
                </div>
            </main>
        </div>
    );
}
