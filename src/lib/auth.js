import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "fallora_session";
const SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-in-prod";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  return bcrypt.compare(password, storedHash);
}

function signPayload(payloadB64) {
    return crypto
        .createHmac("sha256", SECRET)
        .update(payloadB64)
        .digest("base64url");
}

export function createSessionToken(payload) {
    const data = {
        ...payload,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 hari
    };
    const payloadB64 = Buffer.from(JSON.stringify(data)).toString("base64url");
    const sig = signPayload(payloadB64);
    return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token) {
    if (!token || !token.includes(".")) return null;
    const [payloadB64, sig] = token.split(".");
    const expectedSig = signPayload(payloadB64);

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
}

export async function setSessionCookie(user) {
    const token = createSessionToken({
        userId: String(user.id),
        role: user.role,
        status: user.status,
        username: user.username,
        name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return verifySessionToken(token);
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}