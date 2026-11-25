"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayoutWrapper from "@/components/auth/AuthLayout";
import PrimaryButton from "@/components/buttons/PrimaryButton";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [fieldErrors, setFieldErrors] = useState({
        identifier: "",
        password: "",
        general: "",
    });
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({ identifier: "", password: "", general: "" });
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    identifier,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data.message || "Email/Username atau password salah.";
                if (data.field === "password" || msg.toLowerCase().includes("password")) {
                    setFieldErrors((prev) => ({ ...prev, password: msg }));
                } else if (
                    data.field === "identifier" ||
                    msg.toLowerCase().includes("email") ||
                    msg.toLowerCase().includes("username") ||
                    msg.toLowerCase().includes("pengguna")
                ) {
                    setFieldErrors((prev) => ({ ...prev, identifier: msg }));
                } else {
                    setFieldErrors((prev) => ({ ...prev, general: msg }));
                }
                return;
            }

            router.push(data.redirectTo || "/");
            router.refresh();
        } catch {
            setFieldErrors((prev) => ({
                ...prev,
                general: "Terjadi gangguan jaringan saat mencoba masuk.",
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayoutWrapper
            topRightText="Don’t have an account?"
            topRightLinkText="Sign up now"
            topRightLinkHref="/signup"
        >
            <div className="text-center">
                <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--color-surface)]">
                    Log in to continue
                </h1>
                <div className="mx-auto mt-2.5 h-[2px] w-12 bg-[var(--color-surface)]/90 rounded-full" />
            </div>

            {fieldErrors.general && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    {fieldErrors.general}
                </div>
            )}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                    <label
                        htmlFor="identifier"
                        className="block text-sm font-semibold text-[var(--color-surface)] mb-1.5"
                    >
                        Email / Username
                    </label>
                    <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-[var(--color-surface)]/80">
                            {/* User Icon */}
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                        </span>
                        <input
                            id="identifier"
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            // onChange={(e) => {
                            //     setIdentifier(e.target.value);
                            //     if (fieldErrors.identifier || fieldErrors.general) {
                            //         setFieldErrors((prev) => ({ ...prev, identifier: "", general: "" }));
                            //     }
                            // }}
                            placeholder="hello@example.com"
                            className="w-full rounded-lg border border-[var(--color-surface)]/25 bg-[#A45C2E]/85 py-2.5 pl-10 pr-4 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/75 focus:border-[var(--color-peach)] focus:outline-none focus:ring-2 focus:ring-[var(--color-peach)]/40 transition"
                        />
                    </div>
                </div>
                {fieldErrors.identifier && (
                    <p className="mt-1.5 text-xs font-medium text-red-200">
                        {fieldErrors.identifier}
                    </p>
                )}

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-[var(--color-surface)] mb-1.5"
                    >
                        Password
                    </label>
                    <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-[var(--color-surface)]/80">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            // onChange={(e) => {
                            //     setIdentifier(e.target.value);
                            //     if (fieldErrors.identifier || fieldErrors.general) {
                            //         setFieldErrors((prev) => ({ ...prev, identifier: "", general: "" }));
                            //     }
                            // }}
                            placeholder="••••••••••••"
                            className="w-full rounded-lg border border-[var(--color-surface)]/25 bg-[#A45C2E]/85 py-2.5 pl-10 pr-10 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/75 focus:border-[var(--color-peach)] focus:outline-none focus:ring-2 focus:ring-[var(--color-peach)]/40 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                            className="absolute right-3.5 text-[var(--color-surface)]/80 hover:text-[var(--color-surface)] transition"
                        >
                            {showPassword ? (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {fieldErrors.password && (
                        <p className="mt-1.5 text-xs font-medium text-red-200">
                            {fieldErrors.password}
                        </p>
                    )}

                    <div className="mt-1.5 text-right">
                        <Link
                            href="#"
                            className="text-xs font-bold text-[var(--color-peach)] underline underline-offset-2 hover:text-[var(--color-surface)] transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <PrimaryButton type="submit" disabled={isSubmitting} className="mt-2">
                    {isSubmitting ? "PROCESSING LOGIN..." : "LOGIN"}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-[var(--color-surface)]/90">
                Dengan login, kamu menyetujui{" "}
                <Link href="#" className="text-[var(--color-peach)] hover:underline font-bold">
                    Syarat, Ketentuan,
                </Link>
                <br />
                <Link href="#" className="text-[var(--color-peach)] hover:underline font-bold">
                    dan Kebijakan Privasi
                </Link>{" "}
                dari Fallora
            </p>
        </AuthLayoutWrapper>
    );
}