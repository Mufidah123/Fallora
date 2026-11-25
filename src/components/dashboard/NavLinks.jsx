"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function NavLinks({ items }) {
    const pathname = usePathname();
    return (
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5 md:overflow-visible">
            {items.map((item) => {
                const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm md:border-b-0 md:border-l-[3px] md:py-1.5 ${
                            active
                                ? "border-[var(--color-primary)] bg-white/60 font-bold text-[var(--color-primary)]"
                                : "border-transparent text-[var(--color-dark)] hover:bg-white/40"
                        }`}
                    >
                        {item.label}
                        {item.count > 0 && (
                            <span className="ml-1.5 rounded-sm bg-[var(--color-primary)] px-1.5 py-px text-[11px] font-bold text-white">
                                {item.count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

export function LogoutButton() {
    const router = useRouter();
    return (
        <button
            type="button"
            className="cursor-pointer text-left text-xs underline underline-offset-2 hover:text-[var(--color-primary)]"
            onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
            }}
        >
            Keluar
        </button>
    );
}
