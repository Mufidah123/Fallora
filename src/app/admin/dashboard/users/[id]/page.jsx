import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { ROLE_LABEL } from "@/lib/format";
import { updateUser } from "../../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead } from "@/components/dashboard/parts";

export const metadata = { title: "Edit Pengguna | Admin Fallora" };

export default async function EditUserPage({ params }) {
    const admin = await requireAdmin();
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) notFound();

    const res = await query(`SELECT id, name, username, email, phone, role, status FROM users WHERE id = $1`, [userId]);
    const u = res.rows[0];
    if (!u) notFound();

    return (
        <>
            <PageHead
                title={`Edit ${u.name}`}
                note={`Peran: ${ROLE_LABEL[u.role]}. Peran akun tidak dapat diubah.`}
                action={<Link href="/admin/dashboard/users" className="text-sm underline underline-offset-2">Kembali</Link>}
            />

            <ActionForm action={updateUser} label="Simpan perubahan" className="max-w-xl space-y-5">
                <input type="hidden" name="id" value={u.id} />
                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="dash-label">Nama lengkap</label>
                        <input id="name" name="name" required defaultValue={u.name} className="dash-input" />
                    </div>
                    <div>
                        <label htmlFor="username" className="dash-label">Username</label>
                        <input id="username" name="username" required defaultValue={u.username} className="dash-input" />
                    </div>
                    <div>
                        <label htmlFor="email" className="dash-label">Email</label>
                        <input id="email" name="email" type="email" required defaultValue={u.email} className="dash-input" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="dash-label">Telepon</label>
                        <input id="phone" name="phone" defaultValue={u.phone || ""} className="dash-input" />
                    </div>
                </div>

                {u.role === "SELLER" && (
                    <div>
                        <label htmlFor="status" className="dash-label">Status seller</label>
                        <select id="status" name="status" defaultValue={u.status} className="dash-input">
                            <option value="ACTIVE">Aktif (disetujui)</option>
                            <option value="PENDING">Menunggu verifikasi</option>
                            <option value="REJECTED">Ditolak</option>
                        </select>
                        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                            Untuk menolak dengan alasan, gunakan halaman Verifikasi seller.
                        </p>
                    </div>
                )}
                {u.id === admin.id && (
                    <p className="text-xs text-[var(--color-muted)]">Ini akun Anda sendiri.</p>
                )}

                <div>
                    <label htmlFor="password" className="dash-label">Password baru</label>
                    <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Kosongkan jika tidak diganti" className="dash-input" />
                </div>
            </ActionForm>
        </>
    );
}
