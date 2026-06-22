// Drives a mock outbound Call through its lifecycle by writing directly to the
// store — mirrors what Twilio's status + recording webhooks would do, but with no
// network and no cost. Imported lazily from lib/telephony/index.js
// (maybeSimulateCall) so the provider modules stay store-free.

import {
  addCallEvent,
  createOutreachEvent,
  getTenantTelephony,
  updateCall,
  updateLead
} from "../store.js";
import { MOCK_RECORDING_URL } from "./mockProvider.js";

// Timings (ms) for the live, setTimeout-driven demo. Tests use
// runMockCallLifecycle for a deterministic, timer-free run.
const RING_MS = 1500;
const TALK_MS = 6000;

// 25s–180s of "talk time" for a believable demo log.
function randomDuration() {
  return 25 + Math.floor(Math.random() * 156);
}

async function markInProgress(call) {
  const nowIso = new Date().toISOString();
  await updateCall(call.id, { status: "in_progress", startedAt: nowIso });
  await addCallEvent(call.id, "status_update", { status: "in_progress", simulated: true });
}

async function markCompleted(call, { durationSeconds } = {}) {
  const nowIso = new Date().toISOString();
  const tel = await getTenantTelephony(call.tenantId);
  const duration = durationSeconds ?? randomDuration();

  const updates = { status: "completed", durationSeconds: duration, endedAt: nowIso };
  if (tel.recordingEnabled) updates.recordingUrl = MOCK_RECORDING_URL;
  await updateCall(call.id, updates);
  await addCallEvent(call.id, "status_update", { status: "completed", simulated: true });

  if (tel.recordingEnabled) {
    await addCallEvent(call.id, "recording", {
      recordingUrl: MOCK_RECORDING_URL,
      durationSeconds: duration,
      consentMode: tel.recordingConsentMode,
      simulated: true
    });
  }

  if (call.leadId) {
    await updateLead(
      call.leadId,
      { lastCallAt: nowIso, lastContactedAt: nowIso, callStatus: "completed" },
      { teamId: call.teamId }
    );
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    await createOutreachEvent({
      teamId: call.teamId,
      leadId: call.leadId,
      type: "call",
      metadata: {
        summary: `Outbound call completed (mock) — ${mins}m${String(secs).padStart(2, "0")}s${
          tel.recordingEnabled ? " · recorded" : ""
        }`,
        callId: call.id,
        direction: "outbound",
        simulated: true
      }
    });
  }
}

// Live demo: schedule the transitions and return immediately. Safe in a
// long-lived Node server (next start); not used in tests.
export function scheduleMockCallLifecycle(call) {
  setTimeout(() => {
    markInProgress(call).catch(() => {});
  }, RING_MS);
  setTimeout(() => {
    markCompleted(call).catch(() => {});
  }, RING_MS + TALK_MS);
}

// Deterministic, timer-free run for tests and synchronous callers.
export async function runMockCallLifecycle(call, opts = {}) {
  await markInProgress(call);
  await markCompleted(call, opts);
}
