import Link from "next/link";
import { FallingLeaves } from "falling-leaves/react";

export default function AuthLayoutWrapper({
    children,
    topRightText,
    topRightLinkText,
    topRightLinkHref,
}) {
    return (
        <div className="relative min-h-dvh w-full overflow-x-hidden overflow-y-auto bg-[var(--color-cream)] flex items-center justify-center px-4 py-6">
            <img
                src="/assets/Brutalist 77.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none fixed -top-12 -left-14 sm:-top-5 sm:-left-8 lg:-top-18 lg:-left-18 z-[1] w-60 sm:w-48 lg:w-80 h-auto"
            />

            <img
                src="/assets/Brutalist Shape 115.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none fixed top-0 right-0 z-[1] w-36 sm:w-48 lg:w-44 h-auto"
            />

            <img
                src="/assets/Brutalist Shape 119.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none fixed right-3 sm:right-6 lg:right-32 z-[1] w-28 sm:w-36 lg:w-40 h-auto bottom-56"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none select-none absolute inset-x-[-15%] bottom-0 h-[44%] rounded-t-[100%] bg-[var(--color-primary)] z-[2]"
            />

            <img
                src="/assets/Vector.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none fixed bottom-44 left-4 sm:left-10 lg:left-24 z-[3] w-32 sm:w-40 lg:w-40 h-auto"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none select-none fixed inset-0 z-[4] overflow-hidden opacity-85"
            >
                <FallingLeaves count={14} minSize={22} maxSize={32} />
            </div>

            <main className="relative z-10 w-full max-w-[460px] md:max-w-[500px] rounded-2xl bg-[var(--color-primary)] px-6 py-6 md:px-9 md:py-7 shadow-[0_12px_28px_rgba(41,37,36,0.32)] text-white">
                <div className="flex items-start justify-between gap-3">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
                            <img
                                src="/assets/logo-fallora.png"
                                alt="Logo Fallora"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <div className="leading-tight">
                            <div className="font-brand text-lg md:text-xl tracking-wide text-white">
                                Fallora
                            </div>
                            <div className="font-subtitle text-[9px] md:text-[10px] font-medium tracking-[0.2em] text-white/90">
                                E-Commerce
                            </div>
                        </div>
                    </Link>

                    <div className="text-right text-xs leading-snug">
                        <p className="text-white/90">{topRightText}</p>
                        <Link
                            href={topRightLinkHref}
                            className="font-semibold text-[var(--color-peach)] underline underline-offset-2 hover:text-white transition-colors"
                        >
                            {topRightLinkText}
                        </Link>
                    </div>
                </div>

                {/* Isi Form */}
                <div className="mt-5 md:mt-6">{children}</div>
            </main>
        </div>
    );
}