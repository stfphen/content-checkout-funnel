# Demo Flow — Content Checkout Funnel

_Last updated: 2026-06-17. A step-by-step path through the product for a live demo. Written so a future agent or operator can reproduce it. Plain language, real routes._

## Prerequisites

- **Database:** Postgres running with migrations applied and at least one active admin/team user seeded. Auth is database-backed — without `DATABASE_URL` and a seeded user, `/admin` redirects to login. Use `docker-compose up` (brings up `content-funnel-postgres`) and the migrations in `migrations/`.
- **Optional API keys** (each degrades gracefully to a "not-configured" response if absent):
  - `GOOGLE_PLACES_API_KEY`, `HUNTER_API_KEY`, `APOLLO_API_KEY` — prospecting
  - `RESEND_API_KEY` — outreach sending (sender must be an approved Resend domain)
  - `OPENAI_API_KEY` — optional LLM sales brief (falls back to the deterministic brief)
- **Enrichment steps (8) require PR #2** (`feature/prospect-enrichment-integration`) to be checked out or merged.

## Flow

### 1. Admin login
Go to `/admin`. If not authenticated you are redirected to `/admin/login`. Sign in with a seeded active user. Navigation is the `AdminTabbedShell` (Dashboard / Pipeline / Prospecting / Outreach / Tenants, gated by role/permissions).

### 2. Tenant page
Open a public tenant funnel at `/t/[slug]` (e.g. `/t/funded-growth`). Show the tenant-branded hero, packages, and lead-capture form. This is the customer-facing surface that feeds the lead pipeline.

### 3. Funded Growth scan submission
On the **Funded Growth** tenant (`/t/funded-growth`, slug `funded-growth`), complete and submit the funding scan form. It posts to `/api/leads`, creating a lead tagged as a funding scan (answers stored in lead metadata).

### 4. Lead appears in admin
Back in `/admin`, open the **Funding Scan Leads** panel (Dashboard) and the **Lead Pipeline** tab. The submitted scan appears as a lead. Show that it is team-scoped and duplicate-aware.

### 5. Funding score / match review
In the **Funding Scan Leads** panel, each scan shows a computed fit **score** (`scoreFundingLead`) and the **top program matches** (`matchFundingPrograms`, top 3). Emphasize that matching is **human-reviewed**, not auto-applied.

### 6. Draft email generation
On a lead, click **Generate Draft Email** (posts to `/api/admin/drafts`). The generated subject/body appears in the **Draft Emails** panel. Use this to show personalized outreach off real lead/funding data.

### 7. Prospecting import
Go to the **Prospecting** tab. Run a Google Places (or Hunter/Apollo) search to import prospects as leads. Show duplicate handling and audit logging. (Without provider keys, the route returns a clear not-configured notice — say so during the demo.)

### 8. Enrichment _(PR #2 only)_
On a lead with a website, click **Enrich from Website** (posts to `/api/admin/leads/enrich`). After it runs, the lead card shows the **enrichment summary**: website status, social profiles, emails/phones, headings, signals, and a **sales brief** (summary, suggested offer, caller opener, fit/confidence scores). Optionally show the **Google auto-enrich** checkbox on the Google prospecting form, which enriches imported leads (capped) during import. Batch enrichment is available via `/api/admin/leads/enrich-batch`.

### 9. Outreach queue flow
Go to the **Outreach** tab / lead outreach actions. Queue a follow-up (template + sender email → `/api/admin/outreach/queue`), set follow-up dates, mark replied/booked/do-not-contact, and review outreach history per lead. With `RESEND_API_KEY` + an approved sender, approved queue items can be sent; otherwise show the queue without sending.

### 10. Suggested live demo script

> "This is a white-label B2B growth platform. **(1–2)** Each client gets a branded funnel at their own tenant URL. **(3)** A prospect submits our Funded Growth scan — **(4)** it lands instantly in the admin pipeline, team-scoped. **(5)** We automatically score funding fit and surface the top matching programs, but a human always reviews. **(6)** One click drafts a personalized outreach email from that data. **(7)** Separately, we prospect new businesses from Google/Hunter/Apollo with built-in dedupe and audit trails. **(8)** For any lead with a website, one click enriches it — we pull social profiles, contacts, and generate a sales-intelligence brief with a suggested offer and opening line. **(9)** Then we queue and track outreach end-to-end. Everything is tenant-aware, permissioned, and audit-logged."

**Timing:** ~6–8 minutes. If no DB/keys are available, demo steps 1–6 and 9 on seeded data and narrate 7–8 from `PROJECT_STATUS.md`.
