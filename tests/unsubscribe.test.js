import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { rm } from "node:fs/promises";

// Isolate the JSON store BEFORE importing store.js (DATA_PATH is read at import time).
const STORE_PATH = path.join(os.tmpdir(), `unsubscribe-test-store-${process.pid}.json`);
process.env.APP_STORE_PATH = STORE_PATH;
delete process.env.DATABASE_URL;
process.env.UNSUBSCRIBE_SIGNING_SECRET = "test-signing-secret";

const { signUnsubscribeToken, verifyUnsubscribeToken, buildUnsubscribeUrl } = await import("../lib/unsubscribe.js");
const { createOutreachSuppression, listOutreachSuppressions } = await import("../lib/store.js");
const { findSuppression } = await import("../lib/outreachSequence.js");

test.after(async () => {
  await rm(STORE_PATH, { force: true });
});

test("unsubscribe token sign/verify roundtrip carries the payload", () => {
  const token = signUnsubscribeToken({
    email: "owner@example.com",
    tenantId: "tenant_a",
    leadId: "lead_1",
    campaignId: "campaign_1"
  });
  assert.ok(token.includes("."));

  const payload = verifyUnsubscribeToken(token);
  assert.equal(payload.email, "owner@example.com");
  assert.equal(payload.tenantId, "tenant_a");
  assert.equal(payload.leadId, "lead_1");
  assert.equal(payload.campaignId, "campaign_1");
  assert.ok(payload.exp > payload.iat);
});

test("tampered tokens are rejected", () => {
  const token = signUnsubscribeToken({ email: "owner@example.com", tenantId: "tenant_a" });
  const [payloadB64, signature] = token.split(".");

  const otherPayload = Buffer.from(
    JSON.stringify({ email: "victim@example.com", tenantId: "tenant_a", iat: Date.now(), exp: Date.now() + 1000 })
  ).toString("base64url");
  assert.equal(verifyUnsubscribeToken(`${otherPayload}.${signature}`), null);
  assert.equal(verifyUnsubscribeToken(`${payloadB64}.${signature.slice(0, -2)}xx`), null);
  assert.equal(verifyUnsubscribeToken("not-a-token"), null);
  assert.equal(verifyUnsubscribeToken(""), null);
});

test("expired tokens are rejected", () => {
  const iat = Date.now();
  const token = signUnsubscribeToken({ email: "owner@example.com", tenantId: "tenant_a" }, { now: iat, ttlMs: 1000 });
  assert.ok(verifyUnsubscribeToken(token, { now: iat + 999 }));
  assert.equal(verifyUnsubscribeToken(token, { now: iat + 1001 }), null);
});

test("missing secret fails closed on sign, verify, and URL build", () => {
  const token = signUnsubscribeToken({ email: "owner@example.com", tenantId: "tenant_a" });
  assert.equal(signUnsubscribeToken({ email: "owner@example.com", tenantId: "tenant_a" }, { secret: "" }), "");
  assert.equal(verifyUnsubscribeToken(token, { secret: "" }), null);
  assert.equal(buildUnsubscribeUrl(token, { baseUrl: "" }), "");
});

test("tokens require email and tenant scope", () => {
  assert.equal(signUnsubscribeToken({ email: "", tenantId: "tenant_a" }), "");
  assert.equal(signUnsubscribeToken({ email: "owner@example.com", tenantId: "" }), "");
});

test("buildUnsubscribeUrl produces a tokenized /api/unsubscribe link", () => {
  const url = buildUnsubscribeUrl(
    { email: "owner@example.com", tenantId: "tenant_a" },
    { baseUrl: "https://example.com" }
  );
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/api/unsubscribe");
  const payload = verifyUnsubscribeToken(parsed.searchParams.get("token"));
  assert.equal(payload.email, "owner@example.com");
});

test("suppressions dedupe within a tenant but not across tenants", async () => {
  const first = await createOutreachSuppression({
    tenantId: "tenant_a",
    email: "shared@example.com",
    reason: "unsubscribed"
  });
  const duplicate = await createOutreachSuppression({
    tenantId: "tenant_a",
    email: "shared@example.com",
    reason: "unsubscribed"
  });
  assert.equal(duplicate.id, first.id);

  const other = await createOutreachSuppression({
    tenantId: "tenant_b",
    email: "shared@example.com",
    reason: "unsubscribed"
  });
  assert.notEqual(other.id, first.id);

  const suppressions = await listOutreachSuppressions();
  const rows = suppressions.filter((item) => item.email === "shared@example.com");
  assert.equal(rows.length, 2);

  // Tenant-scoped rows only match their own tenant's sends.
  assert.equal(
    findSuppression({ email: "shared@example.com", tenantId: "tenant_a" }, [other]),
    undefined
  );
  assert.ok(findSuppression({ email: "shared@example.com", tenantId: "tenant_b" }, [other]));
});
