// Real Twilio implementation of the telephony provider contract.
// The `twilio` SDK is imported lazily (dynamic import) so the module loads with
// zero cost when telephony is not configured — mirroring the Stripe/pg pattern
// (lib/payments/stripe.js, lib/store.js). Secrets come from env only; never from
// tenant config, never logged.

import { providerFailure, providerNotConfigured, providerSuccess } from "../integrations/providerResponse.js";

const PROVIDER = "twilio";

// Twilio CallStatus -> our callStatuses union. busy/no-answer/canceled collapse
// to "missed" (the spec calls this out for inbound; it is also correct for a
// missed outbound attempt).
const STATUS_MAP = {
  queued: "ringing",
  initiated: "ringing",
  ringing: "ringing",
  "in-progress": "in_progress",
  in_progress: "in_progress",
  completed: "completed",
  failed: "failed",
  busy: "missed",
  "no-answer": "missed",
  canceled: "missed",
  cancelled: "missed"
};

function mapTwilioStatus(value) {
  return STATUS_MAP[String(value || "").toLowerCase()] || "failed";
}

export function isTwilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

let cachedClient;
async function getClient() {
  const { default: twilio } = await import("twilio");
  if (!cachedClient) {
    cachedClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return cachedClient;
}

async function getVoiceResponse() {
  const { default: twilio } = await import("twilio");
  return new twilio.twiml.VoiceResponse();
}

/**
 * Click-to-call: dial the rep first, then bridge to the lead presenting the
 * tenant number as caller ID. Returns a providerResponse envelope.
 */
async function createOutboundCall({ tenantNumber, repNumber, leadNumber, statusCallbackUrl, callId } = {}) {
  if (!isTwilioConfigured()) {
    return providerNotConfigured(PROVIDER, "TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN");
  }
  if (!tenantNumber || !repNumber || !leadNumber) {
    return providerFailure(PROVIDER, "Missing tenant, rep, or lead number for outbound call.");
  }
  try {
    const client = await getClient();
    // TwiML that runs once the REP answers: bridge to the lead with the tenant
    // number as caller ID so the lead sees the business, not the rep's cell.
    const twiml = await getVoiceResponse();
    const dial = twiml.dial({ callerId: tenantNumber });
    dial.number(leadNumber);

    const call = await client.calls.create({
      to: repNumber,
      from: tenantNumber,
      twiml: twiml.toString(),
      statusCallback: statusCallbackUrl || undefined,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST"
    });

    return providerSuccess(PROVIDER, { providerCallId: call.sid, status: call.status || "queued", callId: callId || "" });
  } catch (error) {
    return providerFailure(PROVIDER, error?.message || "Failed to create outbound call.");
  }
}

/**
 * Build the TwiML voice response for an inbound call.
 * ctx.action: "dial" -> bridge to destination; "voicemail" -> record; else reject.
 */
async function buildInboundResponse(ctx = {}) {
  const { action, destinationNumber, tenantNumber, greeting } = ctx;
  const res = await getVoiceResponse();

  if (action === "dial" && destinationNumber) {
    const dial = res.dial({ callerId: tenantNumber || undefined, timeout: 20 });
    dial.number(destinationNumber);
  } else if (action === "voicemail") {
    res.say(greeting || "Please leave a message after the tone.");
    res.record({ maxLength: 120, playBeep: true });
    res.hangup();
  } else {
    res.say(greeting || "Sorry, we are unable to take your call right now. Goodbye.");
    res.hangup();
  }
  return res.toString();
}

/**
 * Normalize a Twilio status callback into our shape. Pure — no SDK, no I/O — so
 * the status route can stamp timestamps and tests can exercise it directly.
 */
function handleCallStatusUpdate(update = {}) {
  const callStatus = update.CallStatus ?? update.callStatus ?? "";
  const status = mapTwilioStatus(callStatus);
  const durationRaw = update.CallDuration ?? update.callDuration;
  const duration = durationRaw === undefined || durationRaw === null || durationRaw === "" ? null : Number(durationRaw);
  return {
    providerCallId: update.CallSid ?? update.callSid ?? "",
    status,
    durationSeconds: Number.isFinite(duration) ? duration : null,
    isTerminal: ["completed", "missed", "failed"].includes(status),
    raw: String(callStatus)
  };
}

/**
 * Verify a Twilio webhook signature against the EXACT public URL + params.
 * Returns false (rejects) when unconfigured or unsigned — never accept unsigned
 * requests. @param {{url:string, signature:string, params:object}} verification
 */
async function verifyWebhook({ url, signature, params } = {}) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature || !url) return false;
  try {
    const { default: twilio } = await import("twilio");
    return twilio.validateRequest(token, signature, url, params || {});
  } catch {
    return false;
  }
}

export const twilioProvider = {
  name: PROVIDER,
  isConfigured: isTwilioConfigured,
  createOutboundCall,
  buildInboundResponse,
  handleCallStatusUpdate,
  verifyWebhook
};
