import Link from "next/link";
import { requirePendingSeller } from "@/lib/guards";
import { deleteRejectedAccount } from "./actions";
import ActionForm from "@/components/ui/ActionForm";
import { LogoutButton } from "@/components/dashboard/NavLinks";

export const metadata = { title: "Status Akun Seller | Fallora" };
export const dynamic = "force-dynamic";

export default async function PendingSellerPage() {
    const user = await requirePendingSeller();
    const rejected = user.status === "REJECTED";

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-cream)] px-5 py-10">
            <div className="w-full max-w-md border border-[#cdbfae] bg-[var(--color-surface)] p-7 shadow-[4px_4px_0_#92400e]">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/assets/logo-fallora.png" alt="" className="h-9 w-9 rounded object-cover" />
                    <span className="font-brand text-xl text-[var(--color-primary)]">Fallora</span>
                </Link>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                    Halo, {user.name}
                </p>

                {rejected ? (
                    <>
                        <h1 className="mt-1 font-brand text-2xl text-red-800">Pendaftaran seller ditolak</h1>
                        <p className="mt-3 text-sm leading-relaxed">
                            Mohon maaf, Admin belum dapat menyetujui akun seller Anda.
                        </p>
                        {user.rejection_reason && (
                            <blockquote className="mt-3 border-l-[3px] border-red-700 bg-red-50 px-3 py-2 text-sm">
                                <span className="block text-[11px] font-semibold uppercase tracking-wider text-red-800">
                                    Alasan dari Admin
                                </span>
                                {user.rejection_reason}
                            </blockquote>
                        )}
                        <p className="mt-4 text-sm text-[var(--color-muted)]">
                            Anda dapat menghapus akun ini, lalu mendaftar ulang dengan data yang sudah dilengkapi.
                        </p>
                        <ActionForm
                            action={deleteRejectedAccount}
                            label="Hapus akun"
                            buttonClass="btn btn-danger mt-4"
                            confirm="Hapus akun ini secara permanen?"
                        />
                    </>
                ) : (
                    <>
                        <h1 className="mt-1 font-brand text-2xl text-[var(--color-primary)]">Akun Anda sedang ditinjau</h1>
                        <p className="mt-3 text-sm leading-relaxed">
                            Admin sedang memeriksa pendaftaran Anda. Dashboard seller akan terbuka setelah akun disetujui.
                        </p>
                        <a href="/api/auth/refresh?next=/seller/dashboard" className="btn btn-line mt-5">
                            Cek status terbaru
                        </a>
                    </>
                )}

                <div className="mt-7 flex items-center gap-4 border-t border-[#e6dacb] pt-4 text-xs">
                    <Link href="/" className="underline underline-offset-2 hover:text-[var(--color-primary)]">
                        Ke beranda
                    </Link>
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}
