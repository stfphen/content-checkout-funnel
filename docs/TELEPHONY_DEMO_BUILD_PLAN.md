# Telephony Demo Build Plan — Outbound Click-to-Call (Phase 7)

_Goal: a functional, zero-cost demo of the "Lead list → place a call → call is recorded and logged back into the system" loop, built so it flips to real Twilio calls with only env-var changes._

## Decisions locked

- **Calls:** mock provider first (no real dialing, no spend, works today).
- **Recording + consent:** build the *real* recording and consent flow now — data model, consent announcement, recording webhook, and player UI — so it's production-ready. In mock mode the "recording" is a bundled sample file; in live mode it's the actual Twilio recording.
- **Lines:** single tenant number, single rep (`single_rep` mode). No multi-line / ring-group work in this phase.

## What already exists (do NOT rebuild)

The outbound workflow is ~80% built. Confirmed in the repo:

- **UI button:** `components/admin/LeadCallPanel.jsx` — "Call Lead" button on the lead detail, POSTs `{ leadId }` to `/api/telephony/outbound`, shows status, and refreshes. Outcome dropdown saves via `/api/admin/telephony/outcome`.
- **Outbound route:** `app/api/telephony/outbound/route.js` — auth-gated (owner/admin/sales), resolves tenant number + rep number + lead number, runs `checkOutboundLead` guard (do-not-call/contact, valid +1), calls `createOutboundCall`, then `createCall(...)` + `createOutreachEvent(...)`.
- **Provider seam:** `lib/telephony/index.js` `getProvider()` switches on `TELEPHONY_PROVIDER` (today: `twilio` | `telnyx`). Routes/UI import only from here — never a vendor SDK.
- **Twilio provider:** `lib/telephony/twilioProvider.js` — real bridge TwiML (dial rep → bridge to lead with tenant caller ID), status callback normalizer, signature verification. Lazy SDK import = zero cost when unconfigured.
- **Config model:** `lib/telephony/constants.js` already defines `recordingEnabled`, `recordingConsentMode` (`disabled` / `one_party` / `two_party_notice` / `play_disclaimer`), `transcriptionEnabled`, plus normalizers.
- **Call schema:** `lib/store.js` `createCall` / `updateCall` already persist `recordingUrl`, `transcript`, `aiSummary`, `durationSeconds`, `startedAt` / `endedAt`, `providerCallId`, plus a `addCallEvent` timeline. Postgres columns exist (`recording_url`, `transcript`, …).
- **Settings UI:** `components/admin/TenantPhoneSettings.jsx` (admin → Tenants → Phone Settings) saves tenant telephony config.

**The gaps:** (1) no mock provider, so clicking "Call Lead" with no creds returns "not configured"; (2) recording + consent are config fields but aren't emitted in the call TwiML or captured back; (3) no recording player in the UI.

## Phase 1 — Mock provider (zero cost, works today)

1. **`lib/telephony/mockProvider.js`** — implement the provider contract (`name`, `isConfigured`, `createOutboundCall`, `buildInboundResponse`, `handleCallStatusUpdate`, `verifyWebhook`). `isConfigured()` returns `true` always (it needs no secrets).
2. **`getProvider()` switch** — return the mock provider when `TELEPHONY_PROVIDER=mock`. Optionally auto-select mock when no real provider is configured AND `TELEPHONY_ALLOW_MOCK=1`, so the demo "just works" in dev without risking silent mocking in prod.
3. **Lifecycle simulation** — `createOutboundCall` returns a synthetic `providerCallId` (e.g. `mock_<rand>`) and `ok:true`. To advance the call without a real webhook, add a small internal simulator that drives `ringing → in_progress → completed` with a realistic random duration and stamps a sample recording URL. Two viable mechanisms (pick at build time):
   - a dev-only endpoint `POST /api/telephony/_simulate` the UI calls right after placing, or
   - the outbound route, when provider is mock, schedules the status transitions inline before responding (deterministic, test-friendly).
4. **Sample recording asset** — bundle `public/audio/sample-call.mp3` (a few seconds of placeholder audio) and point mock `recordingUrl` at it, so the player UI is exercised end-to-end.

_Outcome: click "Call Lead" → a call appears in the lead timeline and Calls tab, progresses to completed, shows a duration and a playable recording — all logged, no phone, no spend._

## Phase 2 — Real recording + consent (built now, ready for live)

1. **Consent announcement (TwiML).** In `twilioProvider.createOutboundCall`, before bridging to the lead, branch on `recordingConsentMode`:
   - `play_disclaimer` / `two_party_notice` → `<Say>` a disclaimer ("This call may be recorded for quality and training purposes.") to the lead leg before connecting, and stamp `consentAnnouncedAt`.
   - `one_party` → record without announcement (only where legally sufficient).
   - `disabled` → no recording.
2. **Enable recording.** When `recordingEnabled` is true, set `record: "record-from-answer-dual"` on the `<Dial>` and pass a `recordingStatusCallback`.
3. **Recording webhook.** New `app/api/telephony/recording/route.js` — verifies the provider signature (reuse `verifyWebhook`), matches the `Call` by `providerCallId`, and `updateCall(... { recordingUrl, durationSeconds })`. Mirrors the existing `/api/telephony/status` route.
4. **Schema:** `recordingUrl` already exists. Add small fields if useful: `consentMode` and `consentAnnouncedAt` on the Call (the config/enum already exist; just thread them through `normalizeCall`).
5. **Mock parity:** mock provider sets `recordingUrl` to the sample asset and records a `consentAnnouncedAt` when the tenant's consent mode would announce — so the UI and audit trail look identical to live.

## Phase 3 — Flip to live (env only, no code change)

1. Twilio trial: buy a voice number, note SID/Auth token (free trial credit; calls to *verified* numbers).
2. VPS `.env`: `TELEPHONY_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TELEPHONY_WEBHOOK_BASE_URL=https://dgtlmag.com`. Recreate the app container.
3. Number → status callback `https://dgtlmag.com/api/telephony/status`; recording callback handled by the per-call `recordingStatusCallback`.
4. Admin → Tenants → Phone Settings: `enabled` on, set tenant `phoneNumber`, `routingMode=single_rep`, `defaultRepId`, `fallbackNumber`, `recordingEnabled` on, `recordingConsentMode=play_disclaimer`.
5. Give the rep a `phone_number` (admin → Team).
6. Place a real call to your own verified phone; confirm the disclaimer plays, the bridge connects, and a recording + duration land on the Call.

## UI work (both modes)

- **Recording player:** in `LeadCallPanel` and `CallsTable`, render an `<audio controls>` when `call.recordingUrl` is set, plus a consent badge ("Disclaimer played" / "No recording").
- **Settings:** verify `TenantPhoneSettings` surfaces `recordingEnabled` + `recordingConsentMode`; add them if missing.
- Keep "Send SMS" as the existing disabled/coming-soon control.

## Consent & legal note (not legal advice)

Call recording is regulated. Many US states require **all-party (two-party) consent**; others allow one-party. The safe default for outbound B2B is to **play a disclaimer before recording** (`recordingConsentMode=play_disclaimer`) and only record after it plays. Confirm the rules for the states you call before enabling real recording. The mock path records nothing real, so it carries no consent exposure.

## Testing

- Extend `tests/telephony.test.js`: mock provider lifecycle (`ringing → completed`, duration, recording URL); consent TwiML emitted per `recordingConsentMode`; recording webhook updates the right Call; guards still block do-not-call/invalid numbers.
- Verification gate: `npm test` and `npm run build` (build runs in Docker on deploy).

## Go-live tracker checklist

- [ ] Phase 1: mock provider + `getProvider()` switch + sample asset
- [ ] Phase 1: lifecycle simulation wired; call logs end-to-end
- [ ] Phase 2: consent TwiML in outbound bridge
- [ ] Phase 2: recording enabled + `/api/telephony/recording` webhook
- [ ] Phase 2: `consentMode` / `consentAnnouncedAt` threaded through Call
- [ ] UI: recording player + consent badge in LeadCallPanel & CallsTable
- [ ] Settings: recordingEnabled + recordingConsentMode exposed
- [ ] Tests added; `npm test` + `npm run build` green
- [ ] Phase 3: Twilio trial creds in VPS `.env`; verified-number test call
- [ ] Legal: consent mode confirmed for target states before real recording

## Open questions

1. Lifecycle simulation: dev endpoint the UI calls, or inline in the outbound route? (Inline is more deterministic/testable.)
2. Auto-fallback to mock when unconfigured, or require `TELEPHONY_PROVIDER=mock` explicitly? (Explicit is safer for prod.)
3. Transcription (`transcriptionEnabled` exists) — in scope for this phase or later?
