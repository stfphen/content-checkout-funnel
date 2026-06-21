# Telephony & Call Forwarding Setup (Phase 7)

_How inbound call routing works today, how to configure it, and the gap to "ring all team members."_

## ⚠️ Important: "fire for ALL team members" is not implemented yet

You asked for inbound calls to **forward to all team members simultaneously**. The code today only does **single-rep routing**. The other modes exist as labels but are stubbed:

> `lib/telephony/routing.js:10-11` — _"round_robin / team_ring / availability_based are TODO and currently fall back to single_rep behaviour."_ The admin dropdown shows these as **"(soon)"**.

`decideRoute()` returns **one** `destinationNumber`, and the Twilio TwiML dials a **single** `<Number>` (`lib/telephony/twilioProvider.js:92-94`). So today an inbound call rings exactly one phone (assigned rep → default rep → fallback → voicemail/reject).

**To ring everyone at once (a "ring group"/hunt group), a small build is needed** (see "Implementing team-ring" below). I can do this — it's a focused change.

## How routing works today

`decideRoute(lead, tenantTelephony, reps)` — strict precedence (`lib/telephony/routing.js:35-58`):

1. **Assigned rep** — if `lead.assignedToUserId` matches a rep → ring that rep's `phoneNumber`.
2. **Default rep** — `routingMode: "single_rep"` → ring `tenantTelephony.defaultRepId`'s number.
3. **Fallback number** — ring `tenantTelephony.fallbackNumber` (org-wide line).
4. **Voicemail / reject** — if `voicemailEnabled`, take voicemail; else safe-reject.

## Where reps and their numbers live

Team members are in Postgres (`team_memberships` joined to `users`, via `listTeamUsers(teamId)`, `lib/users.js:211-236`). Per-rep telephony fields:

- `phone_number` — the rep's phone (E.164, e.g. `+14165550123`)
- `telephony_role` — `setter` / `closer` / `sales_manager` / `admin` / `viewer`
- `availability_status` — `available` / `busy` / `offline`
- `can_receive_inbound`, `can_make_outbound` — booleans

**Each rep must have a `phone_number` set** before they can receive calls.

## Per-tenant telephony config (`tenant.config.telephony`)

Set in **admin → Tenants → Phone Settings** (`components/admin/TenantPhoneSettings.jsx`), saved via `POST /api/admin/tenants/telephony` (owner/admin only). Fields (`lib/telephony/constants.js:54-69`):

```
enabled            true/false
provider           "twilio"
phoneNumber        tenant inbound number (E.164)
routingMode        "single_rep"  (others = "soon")
defaultRepId       which rep rings by default
fallbackNumber     org-wide fallback (E.164)
voicemailEnabled   true/false
recordingEnabled   false   (keep OFF until consent handling — Phase 7 later)
```

## The three API routes

- `POST /api/telephony/inbound` — Twilio "a call comes in". Verifies signature (403 if bad), finds the tenant by dialed number, finds/creates the caller as a lead, runs `decideRoute`, logs a ringing `Call`, returns routing TwiML.
- `POST /api/telephony/status` — Twilio status callback. Verifies signature, updates the `Call` by `CallSid`, logs events, creates a missed-call task on `missed`, updates the lead on `completed`.
- `POST /api/telephony/outbound` — click-to-call from admin (authenticated, owner/admin/sales). Rings the rep first, then bridges to the lead with the tenant number as caller ID.

## Go-live steps (single-rep, works today)

1. Buy/port a **+1** voice-capable number in the Twilio console.
2. Number → **Voice → "A call comes in"** → Webhook (POST): `https://dgtlmag.com/api/telephony/inbound`
3. Number → **Call status callback** (POST): `https://dgtlmag.com/api/telephony/status`
   - These URLs must match `TELEPHONY_WEBHOOK_BASE_URL` **byte-for-byte** (scheme, host, path, no trailing slash) or signature verification fails.
4. VPS `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TELEPHONY_WEBHOOK_BASE_URL=https://dgtlmag.com`. Recreate the app.
5. Give each team member a `phone_number` (admin → Team).
6. Admin → Tenants → Phone Settings: `enabled` on, set tenant `phoneNumber`, `routingMode=single_rep`, pick `defaultRepId`, set `fallbackNumber`.
7. Place a real call to the number; confirm it rings the rep and a `Call` is logged on the lead. Keep `recordingEnabled` off until consent handling is in.

## Implementing team-ring (so calls fire for everyone) — proposed change

Scoped, low-risk; I can implement on request:

1. `decideRoute` returns a **list** of destinations when `routingMode === "team_ring"` — all reps with `can_receive_inbound` and `availability_status !== "offline"`.
2. `twilioProvider` TwiML emits one `<Dial>` with **multiple `<Number>` children** (Twilio rings them in parallel; first to answer wins) plus the existing timeout → voicemail/fallback.
3. Inbound route records the attempted reps on the `Call`/events.
4. Add tests mirroring the existing single-rep routing tests; flip the admin dropdown label from "(soon)".

Optional variants: `round_robin` (rotate the single rep across calls) and `availability_based` (filter by `availability_status`) reuse the same plumbing.

Env required regardless: only `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TELEPHONY_WEBHOOK_BASE_URL`. (US/Canada `+1` normalization only in this pass.)
