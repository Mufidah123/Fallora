import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/upload";

const MIME = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
};

export async function GET(_request, context) {
    const { name } = await context.params;

    // Hanya nama file hasil upload kita (uuid.ext), mencegah path traversal
    const match = /^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.exec(name);
    if (!match) return new Response("Not found", { status: 404 });

    try {
        const data = await fs.readFile(path.join(UPLOAD_DIR, name));
        return new Response(data, {
            headers: {
                "Content-Type": MIME[match[1]],
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch {
        return new Response("Not found", { status: 404 });
    }
}
