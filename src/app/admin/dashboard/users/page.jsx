import Link from "next/link";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { formatDate, ROLE_LABEL } from "@/lib/format";
import { deleteUser } from "../actions";
import ActionForm from "@/components/ui/ActionForm";
import { PageHead, UserTag, Empty } from "@/components/dashboard/parts";

export const metadata = { title: "Pengguna | Admin Fallora" };

export default async function UsersPage({ searchParams }) {
    const admin = await requireAdmin();
    const sp = await searchParams;
    const role = ["ADMIN", "SELLER", "BUYER"].includes(sp?.role) ? sp.role : null;
    const q = String(sp?.q || "").trim();

    const params = [role, q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : null];
    const res = await query(
        `SELECT id, name, username, email, phone, role, status, created_at
        FROM users
        WHERE ($1::text IS NULL OR role = $1)
        AND ($2::text IS NULL OR name ILIKE $2 OR username ILIKE $2 OR email ILIKE $2)
        ORDER BY CASE role WHEN 'ADMIN' THEN 0 WHEN 'SELLER' THEN 1 ELSE 2 END, created_at DESC`,
        params
    );

    const tabs = [["", "Semua"], ["SELLER", "Seller"], ["BUYER", "Buyer"], ["ADMIN", "Admin"]];

    return (
        <>
            <PageHead title="Pengguna" note={`${res.rows.length} akun ditemukan.`} />

            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div className="flex gap-5 text-sm">
                    {tabs.map(([key, label]) => {
                        const active = (role || "") === key;
                        const href = `/admin/dashboard/users?${new URLSearchParams({ ...(key && { role: key }), ...(q && { q }) })}`;
                        return (
                            <Link
                                key={key || "all"}
                                href={href}
                                className={active ? "font-bold text-[var(--color-primary)] underline underline-offset-[6px]" : "text-[var(--color-muted)] hover:text-[var(--color-dark)]"}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
                <form className="flex gap-2">
                    {role && <input type="hidden" name="role" value={role} />}
                    <input name="q" defaultValue={q} placeholder="Cari nama, username, email" className="dash-input !w-60 !py-1.5" />
                    <button className="btn btn-line">Cari</button>
                </form>
            </div>

            {res.rows.length === 0 ? (
                <Empty>Tidak ada pengguna yang cocok.</Empty>
            ) : (
                <div className="overflow-x-auto">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>Pengguna</th>
                                <th>Peran</th>
                                <th>Status</th>
                                <th>Terdaftar</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {res.rows.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="font-semibold">
                                            {u.name}
                                            {u.id === admin.id && <span className="ml-1.5 text-xs font-normal text-[var(--color-muted)]">(Anda)</span>}
                                        </div>
                                        <div className="text-xs text-[var(--color-muted)]">@{u.username} · {u.email}</div>
                                    </td>
                                    <td>{ROLE_LABEL[u.role]}</td>
                                    <td><UserTag status={u.status} /></td>
                                    <td className="whitespace-nowrap text-[var(--color-muted)]">{formatDate(u.created_at)}</td>
                                    <td>
                                        <div className="flex items-start justify-end gap-2">
                                            <Link href={`/admin/dashboard/users/${u.id}`} className="btn btn-line btn-sm">Edit</Link>
                                            {u.id !== admin.id && (
                                                <ActionForm
                                                    action={deleteUser}
                                                    label="Hapus"
                                                    buttonClass="btn btn-danger btn-sm"
                                                    confirm={`Hapus akun ${u.name}? Tindakan ini tidak bisa dibatalkan.`}
                                                >
                                                    <input type="hidden" name="id" value={u.id} />
                                                </ActionForm>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
