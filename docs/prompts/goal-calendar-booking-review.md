# Ultra-review — `goal-calendar-booking.md` prompt (2026-07-04)

Claim-by-claim verification of the Booking Calendar `/goal` prompt against the repo at
`main@32c9f73`. Verified by three parallel codebase/brain sweeps. The amended v2 prompt
(with every correction below baked in) lives next to this file at
`docs/prompts/goal-calendar-booking.md`.

## Verdict summary

The prompt is **structurally sound and mostly accurate** — the phased plan, mock-first adapter
architecture, brain reading list, and known-issue references all check out. It needs **10
corrections**, misses **7 existing hooks** that make the build cheaper, and carries **3 strategic
conflicts** the owner should decide on before running it.

## ✅ Confirmed-accurate claims

| Claim | Evidence |
|---|---|
| `lib/store.js` dual pg/file-store pattern | `getPgPool()` gated on `DATABASE_URL`; `readFileStore()`/`writeFileStore()`. `media_assets` (store.js ~876–1151) is the model example for adding an entity. |
| `008_scheduling.sql` is the correct next migration | `migrations/` holds 001–007 (`007_media_assets.sql` highest). ⚠️ Brain 53-Known-Issues separately *proposes* a `007_performance_indexes.sql` — verify the next free number on disk at build time. |
| `lib/rateLimit.js`, `lib/permissions.js`, `lib/audit.js`, `.env.example` | All exist as named. Roles: owner/admin/sales/contractor/viewer via `requireRole`. |
| `node --test` runner; `scripts/seed-tenants.js` | `"test": "node --test tests/*.test.js"`; seed script is idempotent (`upsertTenantConfig`) and has the `--only` flag. |
| Known-issue labels: H4, dedupe parity, double-send, Stripe idempotency | All accurately labeled in `brain/50-Audit-Log/53-Known-Issues.md` (H4 line 27; dedupe parity HIGH line 44; double-send MED line 46; Stripe LOW/MED line 47). |
| Adapter-interface architecture fits the house pattern | `lib/telephony/index.js` (env-selected provider registry, mock default, `types.js` interface) is the exact precedent; `lib/media/index.js` explicitly mirrors it. |
| Greenfield | Zero existing booking/calendar code. "book-a-call" exists only as an outreach email CTA and a manual lead status. |
| Not gated | Booking module is absent from `34-Do-Not-Start-Yet` — neither planned nor forbidden. |

## ❌ Corrections (fixed in v2)

1. **Route param is `[slug]`, not `[tenant]`** — the only tenant page is `app/t/[slug]/page.jsx`
   (no sub-pages exist yet). Standalone page → `/t/[slug]/book/[eventType]`.
2. **Missing `team_id`** — the multi-tenancy isolation key is `team_id NOT NULL` (+ optional
   `tenant_id`), per migration 003 and `media_assets`. The prompt's table specs list only
   `tenant_id`; as written the new tables would break tenant isolation and every
   team-scoped query convention.
3. **"295 existing tests" is a stale snapshot** (main@`44ea917`; HEAD is 8 commits past it —
   the brain timeline already records **324/324** on the template-library work now at the tip).
   v2 says "the current full suite" instead of a literal number.
4. **No encryption utility exists to reuse** — no `createCipheriv`/AES anywhere; `crypto` is used
   only for `randomUUID`, `bcryptjs` only for passwords. "Encrypted tokens" requires building a
   new util (v2: `lib/crypto.js`, AES-256-GCM, new env key var).
5. **No OAuth precedent** — zero start/callback flows in the repo; Google exists only as
   Places/YouTube API keys, Microsoft not at all. OAuth is a bigger net-new lift than the prompt
   implies; v2 isolates it behind the mock provider so it can slip without blocking Phases 1–3.
6. **`lib/audit.js` is pg-only** (throws without `DATABASE_URL`). "Audit-log all mutations" needs
   a file-store-mode guard or the module breaks in zero-credential mock mode — the prompt's own
   headline requirement.
7. **`lib/rateLimit.js` guards only admin login today** — reusable, but it's an in-process
   fixed-window Map (single-node only). Fine now; noted in v2.
8. **"Dark-first design system" is wrong for the public widget** — dark theme is scoped to
   `.v2-admin-shell[data-theme="dark"]`; the public funnel is deliberately **light + tenant-branded**
   (DESIGN.md). v2: widget is light/tenant-branded on funnel pages, dark only inside admin.
9. **API namespace split** — public routes live at `app/api/<name>` (checkout/leads/funding),
   admin under `app/api/admin/<name>` with `requireRole`. v2 splits `app/api/scheduling/*`
   (public) from `app/api/admin/scheduling/*` (admin).
10. **No timezone library exists** (no luxon/date-fns/dayjs; native `Date` only, no TZ utilities
    anywhere). v2 pins the decision: add `luxon` for slot math, or hand-roll with
    `Intl.DateTimeFormat` — decided at ULTRAPLAN time, not mid-build.

## 🧩 Existing hooks the prompt missed (added to v2)

- `components/FunnelPage.jsx` already has a `selectedPackage.bookingLink` redirect branch
  (~lines 470–473) — the natural seam for the checkout booking step.
- New sections plug into the `SECTION_COMPONENTS` registry + `design.sectionOrder` (exactly how
  `fundingPromo` did it) — no need to hardcode into checkout.
- `components/funding/FundingSurveyWidget.jsx` (tenant prop, self-contained, module.css, embedded
  in two places) is the precedent for `<BookingWidget/>`.
- Admin tab = 3 touchpoints: `navItems` in `components/admin/AdminTabbedShell.jsx`, `visibleTabs`
  in `app/admin/page.jsx`, an `<AdminTabPanel tabId="calendar">`. Mobile bottom bar already
  auto-overflows past 5 tabs.
- Lead upsert path: `sanitizePublicLeadInput` (`lib/leadUtils.js`) → `createLead` (`lib/store.js`),
  exactly as `/api/checkout` does. ⚠️ In pg mode `createLead` currently skips dedupe (the open
  parity bug) — don't rely on `skippedDuplicate` until that's fixed.
- Email: `sendResendEmail` (`lib/integrations/resend.js`) + suppression check à la
  `canSendQueueItem`/`findSuppression` (`lib/outreachSequence.js`).
- `lib/telephony/index.js` + `lib/telephony/types.js` is the named template for
  `lib/scheduling/providers/`.

## ⚠️ Strategic conflicts — owner decisions, not prompt fixes

1. **Priority conflict.** CLAUDE.md: *"Stabilize the repo before building more features."*
   31-Current-Priorities' top items are deploying `main` and the C1/H3/H4 security fixes. A
   4-phase greenfield module conflicts with that. Options: sequence it after the security items,
   or consciously override. v2 adds a preflight step that forces this to be acknowledged at
   ULTRAPLAN time.
2. **H4 is an open bug, not just a rule to respect.** The prompt says "respect
   unsubscribe/suppression rules, see H4," but H4 *is* the bug: null-tenant suppressions match
   every team, and the GET endpoint lets anyone create them. A booking-confirmation path built on
   today's suppression logic inherits the poisoning bug. v2 requires the booking email path to be
   team/tenant-scoped and flags H4 as a prerequisite-or-workaround decision.
3. **Email-volume gate adjacency.** `34-Do-Not-Start-Yet` gates "real outreach email sending at
   volume." Booking confirmations are transactional, not outreach — v2 states that distinction
   explicitly (individual, user-initiated sends only; no sequences from the booking path).

## Environment note

`npm test` in the review container showed 13 file-level failures — all `ERR_MODULE_NOT_FOUND:
Cannot find package 'pg'` (dependency declared in package.json but absent from that container's
node_modules). Environmental, not a repo regression; not evidence for or against the prompt's
test-count claim.
