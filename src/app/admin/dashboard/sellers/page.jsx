import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { formatDate } from "@/lib/format";
import { approveSeller, rejectSeller } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead, Empty } from "@/components/dashboard/parts";

export const metadata = { title: "Verifikasi Seller | Admin Fallora" };

function SellerInfo({ s }) {
    return (
        <div className="min-w-0">
            <p className="font-bold">
                {s.name} <span className="font-normal text-[var(--color-muted)]">@{s.username}</span>
            </p>
            <p className="text-sm text-[var(--color-muted)]">
                {s.email}
                {s.phone ? ` · ${s.phone}` : ""} · daftar {formatDate(s.created_at)}
            </p>
        </div>
    );
}

export default async function SellerVerification() {
    await requireAdmin();
    const res = await query(
        `SELECT id, name, username, email, phone, status, rejection_reason, created_at
        FROM users WHERE role = 'SELLER' AND status IN ('PENDING', 'REJECTED')
        ORDER BY created_at ASC`
    );
    const pending = res.rows.filter((r) => r.status === "PENDING");
    const rejected = res.rows.filter((r) => r.status === "REJECTED");

    return (
        <>
            <PageHead
                title="Verifikasi seller"
                note="Seller baru tidak bisa membuka dashboard sebelum Anda menyetujui akunnya."
            />

            <section className="mb-12">
                <h2 className="mb-3 text-base font-bold">Menunggu ({pending.length})</h2>
                {pending.length === 0 ? (
                    <Empty>Tidak ada pendaftaran yang menunggu.</Empty>
                ) : (
                    <ul className="divide-y divide-[#e6dacb] border-y border-[#cdbfae]">
                        {pending.map((s) => (
                            <li key={s.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-start">
                                <SellerInfo s={s} />
                                <div className="flex flex-wrap items-start gap-2">
                                    <ActionForm action={approveSeller} label="Setujui" buttonClass="btn btn-solid btn-sm">
                                        <input type="hidden" name="id" value={s.id} />
                                    </ActionForm>
                                    <ActionForm
                                        action={rejectSeller}
                                        label="Tolak"
                                        buttonClass="btn btn-danger btn-sm"
                                        className="flex flex-wrap items-start gap-2"
                                    >
                                        <input type="hidden" name="id" value={s.id} />
                                        <input
                                            name="reason"
                                            required
                                            minLength={5}
                                            placeholder="Alasan penolakan"
                                            aria-label={`Alasan menolak ${s.name}`}
                                            className="dash-input !w-52 !py-1 !text-xs"
                                        />
                                    </ActionForm>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {rejected.length > 0 && (
                <section>
                    <h2 className="mb-3 text-base font-bold">Pernah ditolak ({rejected.length})</h2>
                    <ul className="divide-y divide-[#e6dacb] border-y border-[#cdbfae]">
                        {rejected.map((s) => (
                            <li key={s.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-start">
                                <div>
                                    <SellerInfo s={s} />
                                    {s.rejection_reason && (
                                        <p className="mt-1 text-sm text-red-800">Alasan: {s.rejection_reason}</p>
                                    )}
                                </div>
                                <ActionForm action={approveSeller} label="Setujui ulang" buttonClass="btn btn-line btn-sm">
                                    <input type="hidden" name="id" value={s.id} />
                                </ActionForm>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    );
}
