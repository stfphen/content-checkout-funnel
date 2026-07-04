import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { rm } from "node:fs/promises";

// Isolate the JSON store BEFORE importing store.js (DATA_PATH is read at import time).
const STORE_PATH = path.join(os.tmpdir(), `outreach-queue-claim-test-store-${process.pid}.json`);
process.env.APP_STORE_PATH = STORE_PATH;
delete process.env.DATABASE_URL;

const { createOutreachQueueItem, getOutreachQueueItem, updateOutreachQueueItem } = await import("../lib/store.js");

test.after(async () => {
  await rm(STORE_PATH, { force: true });
});

async function seedApprovedItem() {
  return createOutreachQueueItem({
    leadId: "lead_claim",
    status: "approved",
    subject: "Hello",
    body: "Body",
    recipientEmail: "owner@example.com",
    senderEmail: "sales@dgtl.example"
  });
}

test("expectedStatus claims an approved item exactly once", async () => {
  const item = await seedApprovedItem();

  const claimed = await updateOutreachQueueItem(item.id, { status: "sent" }, { expectedStatus: "approved" });
  assert.equal(claimed.status, "sent");

  // The losing request of a double-submit gets null and must not clobber.
  const second = await updateOutreachQueueItem(item.id, { status: "sent" }, { expectedStatus: "approved" });
  assert.equal(second, null);

  const persisted = await getOutreachQueueItem(item.id);
  assert.equal(persisted.status, "sent");
});

test("expectedStatus mismatch leaves the item unchanged", async () => {
  const item = await seedApprovedItem();

  const result = await updateOutreachQueueItem(item.id, { status: "failed" }, { expectedStatus: "queued" });
  assert.equal(result, null);

  const persisted = await getOutreachQueueItem(item.id);
  assert.equal(persisted.status, "approved");
});

test("updates without expectedStatus keep legacy semantics", async () => {
  const item = await seedApprovedItem();

  const updated = await updateOutreachQueueItem(item.id, { status: "skipped", failureReason: "manual" });
  assert.equal(updated.status, "skipped");
  assert.equal(updated.failureReason, "manual");
});
