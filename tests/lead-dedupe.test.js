import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { rm } from "node:fs/promises";

// Isolate the JSON store BEFORE importing store.js (DATA_PATH is read at import time).
const STORE_PATH = path.join(os.tmpdir(), `lead-dedupe-test-store-${process.pid}.json`);
process.env.APP_STORE_PATH = STORE_PATH;
delete process.env.DATABASE_URL;

const { createLead, listLeads } = await import("../lib/store.js");

test.after(async () => {
  await rm(STORE_PATH, { force: true });
});

// Regression guard for the pg-vs-file-store dedupe parity issue (fixed in
// 81e16b3): createLead must skip reliable duplicates and report it. Both the
// pg and file-store branches run the same shouldSkipReliableDuplicate helper
// (lib/store.js createLead), so this file-store test guards the shared logic
// in the only backend the test suite can run.
test("createLead skips a reliable duplicate and flags it", async () => {
  const first = await createLead({
    businessName: "Dedupe Bakery",
    email: "owner@dedupe-bakery.example",
    websiteUrl: "https://dedupe-bakery.example"
  });
  assert.ok(!first.skippedDuplicate);

  const second = await createLead({
    businessName: "Dedupe Bakery",
    email: "owner@dedupe-bakery.example",
    websiteUrl: "https://dedupe-bakery.example"
  });
  assert.equal(second.skippedDuplicate, true);
  assert.equal(second.id, first.id);
  assert.ok(Array.isArray(second.duplicateReasons) && second.duplicateReasons.length > 0);

  const leads = await listLeads();
  assert.equal(leads.filter((lead) => lead.businessName === "Dedupe Bakery").length, 1);
});
