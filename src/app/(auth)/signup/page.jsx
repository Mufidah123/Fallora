"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayoutWrapper from "@/components/auth/AuthLayout";
import PrimaryButton from "@/components/buttons/PrimaryButton";

export default function SignupPage() {
    const router = useRouter();
    const [isCompactScreen, setIsCompactScreen] = useState(false);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const checkViewportHeight = () => {
            const shortHeight = window.innerHeight < 820;
            setIsCompactScreen(shortHeight);
            if (!shortHeight) {
                setStep(1);
            }
        };

        checkViewportHeight();
        window.addEventListener("resize", checkViewportHeight);
        return () => window.removeEventListener("resize", checkViewportHeight);
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (errorMsg) setErrorMsg("");
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.username.trim()) {
            setErrorMsg("Nama lengkap dan username wajib diisi.");
            return;
        }
        setErrorMsg("");
        setStep(2);
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.username.trim()) {
            setErrorMsg("Nama lengkap dan username wajib diisi.");
            if (isCompactScreen) setStep(1);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMsg("Konfirmasi password tidak cocok.");
            return;
        }
        setErrorMsg("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMsg(data.message || "Pendaftaran gagal. Coba periksa kembali data kamu.");
                return;
            }
            router.push(data.redirectTo || "/");
            router.refresh();
        } catch {
            setErrorMsg("Terjadi gangguan jaringan saat mendaftar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const showStep1Fields = !isCompactScreen || step === 1;
    const showStep2Fields = !isCompactScreen || step === 2;
    const isMultiStepActive = isCompactScreen;

    return (
        <AuthLayoutWrapper
            topRightText="Already have an account?"
            topRightLinkText="Log in to your account"
            topRightLinkHref="/login"
        >
            <div className="text-center">
                <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--color-surface)]">
                    Sign up
                </h1>
                <div className="mx-auto mt-2 h-[2px] w-12 bg-[var(--color-surface)]/90 rounded-full" />
                {isMultiStepActive && (
                    <p className="mt-2 text-xs text-[var(--color-surface)]/80">
                        Langkah {step} dari 2
                    </p>
                )}
            </div>

            {errorMsg && (
                <div className="mt-4 rounded-lg bg-red-950/60 border border-red-300/40 px-3.5 py-2 text-xs text-red-100 text-center">
                    {errorMsg}
                </div>
            )}

            <form
                onSubmit={
                    isMultiStepActive && step === 1 ? handleNextStep : handleSignupSubmit
                }
                className={isMultiStepActive ? "space-y-3.5" : "mt-5 space-y-3.5"}
            >
                {showStep1Fields && (
                    <>
                        {/* Nama Lengkap */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-semibold text-[var(--color-surface)] mb-1"
                            >
                                Nama Lengkap
                            </label>
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                </span>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Joseph Budi Santoso"
                                    className="w-full rounded-lg bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
                                />
                            </div>
                        </div>

                        {/* Nomor Telepon */}
                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-semibold text-[var(--color-surface)] mb-1"
                            >
                                Nomor Telepon
                            </label>
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
                                    </svg>
                                </span>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full rounded-lg bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-semibold text-[var(--color-surface)] mb-1"
                            >
                                Username
                            </label>
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3.5 text-[var(--color-muted)] font-bold text-sm">
                                    @
                                </span>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="hello_word123"
                                    className="w-full rounded-lg bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
                                />
                            </div>
                        </div>
                    </>
                )}

                {showStep2Fields && (
                    <>
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-[var(--color-surface)] mb-1"
                            >
                                Email
                            </label>
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="admin123@gmail.com"
                                    className="w-full rounded-lg bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-[var(--color-surface)] mb-1"
                            >
                                Password
                            </label>
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="152@@##PAss"
                                    className="w-full rounded-lg bg-[var(--color-surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                    className="absolute right-3.5 text-[var(--color-muted)] hover:text-[var(--color-dark)] transition"
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
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-semibold text-[var(--color-surface)] mb-1"
                            >
                                Confirm Password
                            </label>
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                    </svg>
                                </span>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••••••"
                                    className="w-full rounded-lg bg-[var(--color-surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label="Toggle confirm password visibility"
                                    className="absolute right-3.5 text-[var(--color-muted)] hover:text-[var(--color-dark)] transition"
                                >
                                    {showConfirmPassword ? (
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
                        </div>
                    </>
                )}

                {/* Tombol Aksi */}
                <div className="pt-2 space-y-2">
                    {isMultiStepActive && step === 1 ? (
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[var(--color-accent)] py-3 text-sm sm:text-base font-bold tracking-wider text-[var(--color-surface)] shadow-md hover:bg-[var(--color-secondary)] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] transition cursor-pointer"
                        >
                            NEXT
                        </button>
                    ) : (
                        <>
                            <PrimaryButton type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "PROCESSING" : "SIGN UP"}
                            </PrimaryButton>
                            {isMultiStepActive && step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-center text-sm text-[var(--color-surface)] hover:text-[var(--color-cream)] hover:translate-y-1 hover:text-shadow-lg transition cursor-pointer"
                                >
                                    Kembali ke data diri
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Teks Kebijakan */}
                <p className="pt-2 text-center text-xs leading-relaxed text-[var(--color-surface)]/90">
                    Dengan sign up, kamu menyetujui{" "}
                    <Link href="#" className="text-[var(--color-peach)] hover:underline font-bold">
                        Syarat, Ketentuan,
                    </Link>
                    <br />
                    <Link href="#" className="text-[var(--color-peach)] hover:underline font-bold">
                        dan Kebijakan Privasi
                    </Link>{" "}
                    dari Fallora
                </p>
            </form>
        </AuthLayoutWrapper>
    );
}