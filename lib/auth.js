import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "content_funnel_admin";

function getSecret() {
  return process.env.SESSION_SECRET || "local-dev-session-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(email) {
  const payload = JSON.stringify({
    email,
    exp: Date.now() + 1000 * 60 * 60 * 12
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function adminCookie(token) {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    }
  };
}

export function clearAdminCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    }
  };
}

export function validateAdminCredentials(email, password) {
  const expectedEmail = process.env.ADMIN_EMAIL || "admin@dgtlmag.com";
  const expectedPassword = process.env.ADMIN_PASSWORD || "change-this-password";
  return email === expectedEmail && password === expectedPassword;
}
