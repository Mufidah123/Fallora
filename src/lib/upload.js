import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Folder upload ada di luar /public supaya file baru langsung bisa dilayani
// (lewat /api/uploads/[name]) tanpa rebuild.
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const UPLOAD_URL_PREFIX = "/api/uploads/";

const TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
};
const MAX_BYTES = 2 * 1024 * 1024;

export function isFile(value) {
    return (
        value &&
        typeof value === "object" &&
        typeof value.arrayBuffer === "function" &&
        value.size > 0
    );
}

export async function saveImage(file) {
    const ext = TYPES[file.type];
    if (!ext) throw new Error("Gambar harus berformat PNG, JPG, WEBP, atau GIF.");
    if (file.size > MAX_BYTES) throw new Error("Ukuran tiap gambar maksimal 2 MB.");

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return `${UPLOAD_URL_PREFIX}${name}`;
}

// Hapus file hasil upload (abaikan path lain seperti /images/... bawaan seed)
export async function removeUploaded(imagePath) {
    if (!imagePath || !imagePath.startsWith(UPLOAD_URL_PREFIX)) return;
    const name = path.basename(imagePath);
    try {
        await fs.unlink(path.join(UPLOAD_DIR, name));
    } catch {
        // file sudah tidak ada, tidak masalah
    }
}
