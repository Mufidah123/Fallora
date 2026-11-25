import Link from "next/link";
import { ORDER_STATUS, USER_STATUS } from "@/lib/format";

export function PageHead({ title, note, action }) {
    return (
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-[#cdbfae] pb-4">
            <div>
                <h1 className="font-brand text-[26px] leading-tight text-[var(--color-primary)]">{title}</h1>
                {note && <p className="mt-1 max-w-xl text-sm text-[var(--color-muted)]">{note}</p>}
            </div>
            {action}
        </div>
    );
}

export function Tag({ label, color }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
            <i className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {label}
        </span>
    );
}

export function OrderTag({ status }) {
    const s = ORDER_STATUS[status] || { label: status, color: "#57534e" };
    return <Tag label={s.label} color={s.color} />;
}

export function UserTag({ status }) {
    const s = USER_STATUS[status] || { label: status, color: "#57534e" };
    return <Tag label={s.label} color={s.color} />;
}

export function Empty({ children, href, hrefLabel }) {
    return (
        <div className="border border-dashed border-[#cdbfae] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
            <p>{children}</p>
            {href && (
                <Link href={href} className="btn btn-solid mt-4">
                    {hrefLabel}
                </Link>
            )}
        </div>
    );
}

export function Thumb({ src, alt = "", size = 44 }) {
    return src ? (
        <img
            src={src}
            alt={alt}
            width={size}
            height={size}
            className="shrink-0 rounded-[3px] border border-[#e6dacb] bg-[#f4e6d4] object-cover"
            style={{ width: size, height: size }}
        />
    ) : (
        <span
            className="inline-block shrink-0 rounded-[3px] border border-[#e6dacb] bg-[#f4e6d4]"
            style={{ width: size, height: size }}
        />
    );
}
