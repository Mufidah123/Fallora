import { NextResponse } from "next/server";

const COOKIE_NAME = "fallora_session";
const SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-in-prod";

function bytesToBase64Url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(b64url) {
    const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function verifySessionEdge(token) {
    if (!token || !token.includes(".")) return null;
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(payloadB64)
    );
    const expectedSig = bytesToBase64Url(new Uint8Array(signatureBuffer));

    if (sig !== expectedSig) return null;

    try {
        const parsed = JSON.parse(
            new TextDecoder().decode(base64UrlToBytes(payloadB64))
        );
        if (!parsed.exp || Date.now() > parsed.exp) return null;
        return parsed;
    } catch {
        return null;
    }
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifySessionEdge(token);

    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isAdminRoute = pathname.startsWith("/admin");
    const isSellerDashboard = pathname.startsWith("/seller/dashboard");
    const isSellerPendingPage = pathname.startsWith("/seller/pending");

    // Sudah login lalu buka /login atau /signup
    if (session && isAuthPage) {
        if (session.role === "ADMIN") {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
        if (session.role === "SELLER") {
            const target =
                session.status === "ACTIVE" ? "/seller/dashboard" : "/seller/pending";
            return NextResponse.redirect(new URL(target, request.url));
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Belum login tapi akses halaman privat
    if (!session && (isAdminRoute || isSellerDashboard || isSellerPendingPage)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Khusus rute /admin/* hanya untuk ADMIN
    if (isAdminRoute && session?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Khusus rute /seller/dashboard hanya untuk SELLER berstatus ACTIVE
    if (isSellerDashboard) {
        if (session?.role !== "SELLER") {
            return NextResponse.redirect(new URL("/", request.url));
        }
        if (session?.status !== "ACTIVE") {
            return NextResponse.redirect(new URL("/seller/pending", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/signup",
        "/admin/:path*",
        "/seller/dashboard/:path*",
        "/seller/pending/:path*",
    ],
};