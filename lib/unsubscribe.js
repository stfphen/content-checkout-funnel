import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed unsubscribe tokens (H4 fix). Every unsubscribe link carries an
 * HMAC-SHA256 token minted at send time, so only recipients of a real email
 * can create a suppression — and only scoped to the tenant that emailed them.
 * Fail-closed: without UNSUBSCRIBE_SIGNING_SECRET no links are emitted and
 * every token is rejected.
 */

const DEFAULT_TTL_MS = 180 * 24 * 60 * 60 * 1000; // old emails keep a working link for ~6 months

function signingSecret() {
  return process.env.UNSUBSCRIBE_SIGNING_SECRET || "";
}

function hmac(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function signUnsubscribeToken(
  { email = "", tenantId = "", leadId = "", campaignId = "" } = {},
  { secret = signingSecret(), now = Date.now(), ttlMs = DEFAULT_TTL_MS } = {}
) {
  if (!secret || !email || !tenantId) return "";
  const payload = { email, tenantId, leadId, campaignId, iat: now, exp: now + ttlMs };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${hmac(payloadB64, secret)}`;
}

export function verifyUnsubscribeToken(token, { secret = signingSecret(), now = Date.now() } = {}) {
  if (!secret || typeof token !== "string") return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = Buffer.from(hmac(payloadB64, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  if (!payload.email || !payload.tenantId) return null;
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  return payload;
}

export function buildUnsubscribeUrl(
  tokenInput,
  { baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "", ...tokenOptions } = {}
) {
  const token = typeof tokenInput === "string" ? tokenInput : signUnsubscribeToken(tokenInput, tokenOptions);
  if (!token || !baseUrl) return "";
  const url = new URL("/api/unsubscribe", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
