# Telephony (Live Twilio) — Integration Notes

Provider-neutral phone layer for the funnel: inbound routing to the right rep,
click-to-call from the admin, and every call logged against the lead.

- **All Twilio SDK access goes through `lib/telephony/`** — routes/UI never import `twilio`.
- **Secrets live in env only** (see `.env.example`), never in tenant config, never logged.
- **Graceful degradation:** with no `TWILIO_*` env vars the layer reports "not
  configured" and the existing app is unaffected.

## Architecture

| Layer | Path |
|---|---|
| Enums + tenant config defaults | `lib/telephony/constants.js` |
| Service layer (provider-neutral) | `lib/telephony/index.js` |
| Inbound routing (pure) | `lib/telephony/routing.js` — `decideRoute(lead, telephony, reps)` |
| Real Twilio provider | `lib/telephony/twilioProvider.js` |
| Telnyx stub (future) | `lib/telephony/telnyxProvider.js` |
| Call activity store | `lib/store.js` — `createCall`, `updateCall`, `getCallsForLead`, … |
| Tenant telephony config | `tenants.config.telephony` (setup only; activity lives in `calls`) |

## API routes

All three live under `app/api/telephony/`. Phone numbers are normalized to E.164
for **+1 (US/Canada) only** in this pass.

### `POST /api/telephony/inbound` — Twilio "A call comes in"
- **Caller:** Twilio (webhook). Signature **must** verify or returns `403`.
- Identifies the tenant by the dialed `To` number (`getTenantByPhoneNumber`).
  Unknown/disabled → safe-rejection TwiML.
- Finds the caller (`From`) as an existing lead, else stages a minimal inbound
  lead (`sourceType: "inbound_call"`, status `new`).
- Routes via `decideRoute` (assigned rep → single_rep default → fallback →
  voicemail/reject), creates an inbound `Call` (`ringing`) + `CallEvent`.
- **Returns:** routing TwiML (`text/xml`).

### `POST /api/telephony/status` — Twilio status callback
- **Caller:** Twilio (webhook). Signature **must** verify or returns `403`.
- Normalizes the status, updates the matching `Call` by `providerCallId`
  (status, duration, started/ended; `recordingUrl` only when recording enabled).
- Appends a `CallEvent`. On final status `missed`, calls `createMissedCallTask()`
  (stub until Phase 5).
- **Returns:** `200` (empty).

### `POST /api/telephony/outbound` — click-to-call (internal)
- **Caller:** admin UI, authenticated (`requireRole(["owner","admin","sales"])`).
  Not a webhook.
- Authorizes: lead belongs to the team, tenant telephony enabled, rejects
  `doNotCall`/`doNotContact` with `409`.
- Bridges the rep → lead with the tenant number as caller ID, `statusCallback` →
  `/api/telephony/status`. Creates an outbound `Call` (`ringing`).
- **Returns:** JSON `{ ok, callId, providerCallId }`.

## Local smoke testing

```bash
# 1. Run the app
npm run dev                       # http://localhost:8088

# 2. Expose it (separate shell)
ngrok http 8088                   # copy the https URL
export TELEPHONY_WEBHOOK_BASE_URL=https://<subdomain>.ngrok.app

# 3. Point the Twilio number's Voice + Status callbacks at:
#    POST {BASE}/api/telephony/inbound
#    POST {BASE}/api/telephony/status
# then place a real call to the number.

# Outbound (authenticated — use a browser session cookie):
curl -X POST http://localhost:8088/api/telephony/outbound \
  -H 'Content-Type: application/json' \
  -b 'admin_session=<token>' \
  -d '{"leadId":"lead_..."}'

# Inbound/status reject unsigned requests (expect HTTP 403):
curl -i -X POST http://localhost:8088/api/telephony/inbound \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'To=%2B14165550100&From=%2B14165551234&CallSid=CAtest'
```

## Environment variables

All telephony vars are placeholdered in `.env.example`. Summary:

| Var | Purpose |
|---|---|
| `TELEPHONY_PROVIDER` | `twilio` (default) — only Twilio is implemented |
| `TELEPHONY_WEBHOOK_BASE_URL` | Exact public origin Twilio calls; falls back to `NEXT_PUBLIC_APP_URL` |
| `NEXT_PUBLIC_APP_URL` | App origin |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Credentials; `AUTH_TOKEN` also drives signature verification |
| `TWILIO_API_KEY` / `TWILIO_API_SECRET` / `TWILIO_WEBHOOK_SECRET` | Reserved for future flows |
| `DEFAULT_COUNTRY_CODE` / `DEFAULT_TIMEZONE` | Defaults (only +1 normalized this pass) |

Without `TWILIO_*` the layer reports "not configured" — build, tests, and the
existing app all keep working. Never commit real secrets.

## Twilio console checklist (going live)

1. Buy/port a **+1** voice-capable number in the Twilio console.
2. Number → **Voice configuration** → "A call comes in" → Webhook →
   `POST {TELEPHONY_WEBHOOK_BASE_URL}/api/telephony/inbound`.
3. Set the call **status callback** → `POST {TELEPHONY_WEBHOOK_BASE_URL}/api/telephony/status`.
4. Put Account SID + Auth Token into the env file.
5. Signature verification uses `TWILIO_AUTH_TOKEN` against the **exact** public
   webhook URL — the URL Twilio calls must match `TELEPHONY_WEBHOOK_BASE_URL`
   precisely (scheme, host, path, no trailing-slash mismatch).
6. In the admin **Tenants → Phone Settings** panel: enable telephony, set the
   tenant's phone number (E.164), routing mode, default rep, and fallback number.
7. Keep `recordingEnabled` **false** until consent handling is in place (Phase 7).

## Tests

`tests/telephony.test.js` (run via `npm test`) covers: E.164 normalization,
tenant telephony defaults/persistence, `getTenantByPhoneNumber` match/miss,
routing precedence, status mapping, TwiML generation, webhook signature
reject/accept, inbound call logging + timeline, status updates, missed-call task
creation, the outbound authorization guard, and outcome → lead updates. The
tests run against an isolated temp JSON store (`APP_STORE_PATH`) and need no live
Twilio credentials.
