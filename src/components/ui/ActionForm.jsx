"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel, className = "btn btn-solid" }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className={className}>
            {pending ? pendingLabel || "Menyimpan..." : children}
        </button>
    );
}

// Pembungkus <form> untuk Server Action. Action mengembalikan { error } atau { ok }
// yang ditampilkan di bawah tombol. `confirm` memunculkan dialog konfirmasi dulu.
export default function ActionForm({
    action,
    children,
    label,
    pendingLabel,
    buttonClass = "btn btn-solid",
    confirm,
    className = "",
    hideButton = false,
}) {
    const [state, formAction] = useActionState(action, null);

    return (
        <form
            action={formAction}
            className={className}
            onSubmit={(e) => {
                if (confirm && !window.confirm(confirm)) e.preventDefault();
            }}
        >
            {children}
            {!hideButton && (
                <SubmitButton className={buttonClass} pendingLabel={pendingLabel}>
                    {label}
                </SubmitButton>
            )}
            {state?.error && (
                <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
                    {state.error}
                </p>
            )}
            {state?.ok && (
                <p role="status" className="mt-2 text-xs font-semibold text-emerald-800">
                    {state.ok}
                </p>
            )}
        </form>
    );
}
