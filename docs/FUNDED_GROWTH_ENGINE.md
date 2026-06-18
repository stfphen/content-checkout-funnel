# Funded Growth Engine

The Funded Growth Engine is the funding-readiness layer for the `funded-growth` tenant. It helps Canadian businesses turn growth goals into funding-ready digital projects without claiming eligibility, approval, or live program availability.

The engine currently supports public intake, deterministic scoring, admin review, and funding-safe follow-up drafts. It does not scrape grant sites, import RFPs, send autonomous recommendations, or submit applications.

## What It Does

- Captures structured Funding Fit Scan submissions from the public funnel.
- Preserves funding-specific answers in lead metadata.
- Scores the lead against common growth funding lanes.
- Surfaces a potential fit and recommended next step for admin review.
- Generates a funding-specific follow-up draft with compliance-safe language.
- Keeps all funding decisions behind human review.

## Current MVP Flow

1. A visitor opens the `funded-growth` tenant page.
2. The visitor selects the Funding Fit Scan or another funded growth package.
3. The visitor submits business details, funding-readiness answers, project budget, and growth goals.
4. The lead is stored with `sourceType: funding_scan`.
5. Admin sees the lead in the Funding Scan Leads panel.
6. The admin reviews the potential fit score, best lane, recommended next step, and gaps.
7. The admin may generate a draft follow-up email.
8. The admin decides whether to route the lead into a Blueprint, Application Support, Execution, or Opportunity Intelligence workflow.

## Funding Fit Scan

The Funding Fit Scan collects:

- Business name, contact, email, phone, and company website.
- Industry and location.
- Employee count, revenue range, years operating, and incorporation status.
- Export status and export interest.
- Digital needs, e-commerce needs, and CRM or automation needs.
- Available project budget.
- Main growth goal.

For funding scan leads, the app stores the website as the lead URL, the main growth goal as notes, the industry as category, the location as city, and the full scan payload under `metadata.fundingScan`.

## Scoring

Scoring is deterministic and rule-based. It ranks likely funding lanes using:

- Keyword signals in goals, channels, and capabilities.
- Industry fit.
- Province and country signals.
- E-commerce, export, training, procurement, and clean-tech flags.
- Revenue traction and employee count.

The scoring output includes:

- `overallFit`: a bounded 0-100 triage score.
- `laneScores`: score by funding lane.
- `bestFundingLane`: the strongest internal lane.
- `recommendedOffer`: the service offer that may be the best next step.
- `eligibilityGaps`: missing evidence or readiness details.
- `reasoning`: transparent rule-based score reasons.

The score is not a program eligibility decision. It is only a triage tool for human review.

## Program Matching

Program matching is currently lane-based, not live-program-based. The MVP maps scan answers to broad categories:

- Digital Adoption.
- Ecommerce Growth.
- Export Marketing.
- Creative Tech.
- Clean Tech.
- Workforce Training.
- Public Procurement.
- Market Expansion.

The engine does not currently match leads against a live database of grants, RFPs, intake windows, deadlines, or contribution rules. Admins must manually verify any actual program fit against official funder or program administrator sources.

## Manual Right Now

The following steps are intentionally manual:

- Verifying program availability, deadline, and intake status.
- Confirming eligibility against official program rules.
- Reviewing funder requirements, eligible expenses, and documentation.
- Deciding whether a lead should receive application support.
- Preparing or submitting applications.
- Sending outreach messages.
- Updating lead status after replies, bookings, or disqualification.
- Reviewing any future imported opportunity before it influences a client recommendation.

## Future Ingestion Boundary

`lib/funding/ingestion.js` defines safe placeholders for future grant/RFP ingestion:

- `normalizeFundingOpportunity(raw)`
- `dedupeFundingOpportunities(opportunities)`
- `validateFundingOpportunity(opportunity)`

These functions are local data-shaping helpers only. They do not fetch, scrape, crawl, schedule jobs, call external APIs, or connect to the database.

Future ingestion should:

- Normalize official grant, incentive, accelerator, procurement, and RFP records into a stable internal shape.
- Preserve source URL, source name, published date, deadline, funder, geography, eligible applicants, eligible activities, funding amount, status, and retrieval metadata.
- Dedupe by canonical source URL first, then by source ID, then by funder/title/deadline.
- Mark every imported record as requiring human review before use.
- Track source freshness and stale records.
- Avoid using imported opportunities in client-facing claims until reviewed.

Future ingestion should not:

- Scrape pages without checking source terms and technical constraints.
- Run brittle cron jobs against changing web pages.
- Auto-email clients based on imported records.
- Auto-submit forms or applications.
- Claim eligibility based on source text alone.
- Overwrite reviewed records without preserving provenance.

## Never Automate Without Human Review

Do not automate these actions without explicit human review:

- Saying a business qualifies for funding.
- Naming a specific grant as a confirmed match.
- Confirming eligible expenses.
- Confirming deadlines or intake status.
- Estimating award amounts or reimbursement timing.
- Submitting applications or RFP responses.
- Sending outreach that says approval is likely.
- Changing a lead to qualified solely from scoring or ingestion.

All recommendations must use language such as "may qualify" or "potential fit" and must make clear that approval is determined by the funder or program administrator.

