---
title: 26 · Outreach Sequence
type: module
tags: [module, leads]
status: stable
updated: 2026-06-27
---

# Outreach Sequence (V1)

## Purpose
Turn leads into a tracked, **human-approved-only** email outreach pipeline: template library → queue
preview → approved send via Resend → events + follow-ups + lightweight metrics.

> 🚫 **Outreach is human-approved only — never auto-send.** Standing rule ([[CLAUDE-Operating-Rules]]).

## Key files
- `lib/outreachSequence.js` — the engine:
  - Vocab: `outreachTemplateFields`, `campaignStatuses`, `outreachQueueStatuses`, `suppressionReasons`, `outreachEventTypes`, `defaultOutreachTemplates`.
  - Rendering: `renderOutreachTemplate`, `buildTemplateFields`, `buildFundingMergeFields`, `replaceMergeFields`.
  - Suppression: `findSuppression(ForLead)`.
  - Queue: `buildQueuePlan`, `canSendQueueItem` (enforces caps + suppression), `suggestFollowUpDate`.
  - Metrics: `buildOutreachMetrics`.
- `lib/outreach.js` — draft builders: `buildDraftEmail({tenant, lead, packageId})`, `buildFundingFollowUpDraft({lead})`.
- `lib/integrations/resend.js` — `validateResendConfig`, `sendResendEmail({from, to, subject, html, text})` (`RESEND_API_KEY`).
- UI: `components/admin/OutreachQueueBuilder.jsx`.
- API: `/api/admin/outreach/{templates,campaigns,queue,queue/send,events,suppressions}`, `/api/admin/drafts`.
- Public: `/api/unsubscribe` (GET — ⚠️ unauthenticated, not team-scoped, M3).

## Data (migration 001)
`outreach_templates`, `outreach_campaigns` (`daily_send_cap=25`, `per_domain_daily_cap=1`, filters),
`outreach_queue` (status, `scheduled_for`, `resend_message_id`), `outreach_suppression_list`, `outreach_events`.

## Send caps & compliance
- Per-campaign daily cap 25; per-domain daily cap 1; suppression list respected by `canSendQueueItem`.
- Sending requires `RESEND_API_KEY` **and** a verified Resend sender domain (SPF/DKIM/DMARC on dgtlmag.com). Without it, the queue shows but cannot send.

## Funding outreach
Dedicated funding sequence (intro / fit-summary / book-a-call) with funding merge fields
(`{{businessName}}`, `{{contactName}}`, `{{recommendedFundingLane}}`). See [[29-Funding-Program]].

## ⚠️ Do not start yet
Real outreach sending **at volume** needs an approved Resend domain + reviewed suppression/unsubscribe path. [[34-Do-Not-Start-Yet]]

## Related
[[22-Lead-Pipeline]] · [[29-Funding-Program]] · [[64-External-Services]] · [[28-Telephony]]

Up: [[20-Modules-MOC]]
