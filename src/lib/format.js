export function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export function formatDate(value, withTime = false) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
        timeZone: "Asia/Makassar",
    }).format(new Date(value));
}

// Status sub_orders sesuai CHECK di tabel sub_orders
export const ORDER_STATUS = {
    PENDING_PAYMENT: { label: "Menunggu Pembayaran", color: "#b45309" },
    PROCESSING: { label: "Diproses", color: "#1d4ed8" },
    SHIPPED: { label: "Dalam Pengiriman", color: "#6d28d9" },
    COMPLETED: { label: "Selesai", color: "#15803d" },
    CANCELLED: { label: "Dibatalkan", color: "#b91c1c" },
};

// Alur status yang boleh dilakukan Seller
export const ORDER_FLOW = {
    PENDING_PAYMENT: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};

export const ORDER_ACTION_LABEL = {
    PROCESSING: "Terima & proses",
    SHIPPED: "Tandai dikirim",
    COMPLETED: "Tandai sampai",
    CANCELLED: "Batalkan",
};

export const USER_STATUS = {
    ACTIVE: { label: "Aktif", color: "#15803d" },
    PENDING: { label: "Menunggu", color: "#b45309" },
    REJECTED: { label: "Ditolak", color: "#b91c1c" },
};

export const ROLE_LABEL = { ADMIN: "Admin", SELLER: "Seller", BUYER: "Buyer" };
