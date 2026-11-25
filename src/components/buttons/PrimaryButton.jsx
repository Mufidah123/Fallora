"use client";

export default function PrimaryButton({
    children,
    type = "button",
    disabled = false,
    onClick,
    className = "",
}) {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`w-full rounded-lg bg-gradient-to-r from-[var(--color-accent)] via-[#D9822B] to-[var(--color-peach)] py-3 text-sm sm:text-base font-bold tracking-wider text-white shadow-md hover:brightness-105 active:scale-[0.99] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
            {children}
        </button>
    );
}