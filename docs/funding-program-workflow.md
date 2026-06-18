# Funding Program Workflow

This workflow explains how operators should run the Funding Program module from public intake through admin qualification, outreach, proposal support, and delivery handoff.

## End-To-End Flow

1. Visitor lands on the white-label Funding Program page.
2. Visitor selects a package, usually the free Funding Fit Scan.
3. Visitor submits the funding-specific intake form.
4. The lead is stored with `sourceType: funding_scan` and funding scan metadata.
5. Admin reviews the lead in the pipeline.
6. Admin checks funding lane fit, gaps, and recommended next step.
7. Admin sends or drafts follow-up outreach.
8. Qualified leads are routed into Blueprint, Application Support, Execution, or Monthly Opportunity Intelligence.
9. Operator prepares proposal or application support materials.
10. Delivery team executes the approved or budgeted growth project.

## Intake Data Captured

The funding tenant captures standard lead fields:

- Business name.
- Contact name.
- Email.
- Phone.
- Company website.

It also captures funding-specific scan fields:

- Industry.
- Location.
- Employee count.
- Revenue range.
- Years operating.
- Incorporation status.
- Current export status.
- Export interest.
- Digital needs.
- E-commerce needs.
- CRM or automation needs.
- Available project budget.
- Main growth goal.

The module stores the company website as the lead URL, the main growth goal as lead notes, the industry as category, and the location as city.

## Scoring And Lane Review

Funding scoring is deterministic and should be treated as an internal triage aid. It ranks likely lanes based on keywords, industry signals, location, revenue, employee count, and specific readiness answers.

The scored lanes are:

- Digital Adoption.
- Ecommerce Growth.
- Export Marketing.
- Creative Tech.
- Clean Tech.
- Workforce Training.
- Public Procurement.
- Market Expansion.

Admins should use the score to decide what to review first, not to make eligibility promises. A high lane score means the lead has useful signals for that category. It does not mean a program is available or that the business qualifies.

## Admin Workflow

### 1. Review New Funding Leads

Open the lead pipeline and filter for funding scan leads or the `funded-growth` tenant. Review:

- Contact details and company website.
- Industry and location.
- Revenue range and employee count.
- Incorporation status and years operating.
- Export status and export interest.
- Project budget.
- Digital, e-commerce, and automation needs.
- Main growth goal.
- Recommended offer and score reasoning.
- Eligibility gaps.

### 2. Classify The Lead

Use four practical statuses:

- **Qualified now**: clear business, clear need, credible budget or traction, and a strong next-step offer.
- **Needs discovery**: promising but missing key evidence such as budget, timeline, documents, target market, or implementation scope.
- **Nurture**: too early, unclear, or better suited for future monitoring.
- **Disqualified**: no credible project, expects guaranteed funding, outside geography or service scope, or cannot provide basic business evidence.

### 3. Choose The Next Offer

Use this routing logic:

- Choose **Funding Fit Scan follow-up** when the lead just submitted intake and needs review.
- Choose **Fundable Project Blueprint** when the business has a real growth goal but lacks a scoped project plan.
- Choose **Application Support** when there is a likely program path and the business needs materials prepared.
- Choose **Funded Growth Execution** when the business has funding, internal budget, or executive approval to move.
- Choose **Monthly Opportunity Intelligence** when the business is a strategic fit but timing, program availability, or documentation is not ready.

### 4. Prepare Outreach

The default funding follow-up should:

- Thank the prospect for starting the scan.
- Name the strongest initial lane.
- Recommend the Fundable Project Blueprint when appropriate.
- Explain that the blueprint turns goals into scope, budget, milestones, and application-ready narrative.
- State that funding is not guaranteed.
- Ask for a short review call.

Do not send automated claims like "you qualify." Use language like:

- "The strongest initial lane appears to be..."
- "This looks worth reviewing against..."
- "The next step would be to shape the project before program-specific work."
- "Eligibility depends on the specific program, timing, documentation, and review process."

### 5. Book Discovery Or Blueprint

For qualified leads, book a call to confirm:

- Decision-maker and stakeholders.
- Business registration and operating history.
- Revenue, budget, and cash-flow expectations.
- Target growth outcome.
- Current systems and assets.
- Target market or customer segment.
- Timeline and implementation capacity.
- Whether they want planning, application support, execution, or monitoring.

## Proposal/Application Support Checklist

Use this checklist before preparing a paid proposal or application-support scope.

Business basics:

- Legal business name.
- Operating name.
- Business number or incorporation details, when required.
- Primary contact and decision-maker.
- Location and service area.
- Years operating.
- Employee count.
- Ownership or eligibility attributes required by the target program, if applicable.

Financial and capacity evidence:

- Revenue range or supporting financials.
- Available project budget.
- Cash-flow tolerance for reimbursement-style programs.
- Internal staff assigned to the project.
- Vendor or implementation partner roles.
- Prior funding received, if relevant.

Project scope:

- Main growth goal.
- Problem being solved.
- Target customers or markets.
- Current baseline.
- Proposed activities.
- Deliverables.
- Milestones.
- Timeline.
- Budget categories.
- Expected business outcomes.

Digital and operational readiness:

- Current website and analytics access.
- E-commerce platform and sales channel details.
- CRM, automation, or software stack.
- Marketing channels.
- Content or creative assets.
- Data, reporting, or measurement gaps.
- Training or change-management needs.

Funding pathway review:

- Target lane.
- Potential program shortlist.
- Deadline or intake timing.
- Eligibility requirements.
- Eligible and ineligible expenses.
- Match funding or reimbursement rules.
- Required quotes, resumes, financials, plans, or attestations.
- Risks, gaps, and open questions.

Submission support:

- Application narrative.
- Project budget.
- Milestone plan.
- Outcome metrics.
- Supporting documents.
- Review and approval owner.
- Submission account access, if needed.
- Final compliance check.

Post-approval or project launch:

- Approval conditions.
- Contribution agreement or contract terms.
- Reporting obligations.
- Expense tracking.
- Delivery calendar.
- Measurement setup.
- Claim or reimbursement documentation.
- Closeout report requirements.

## White-Label Tenant Workflow

For a white-label tenant, the workflow stays the same but routing and language should change to match the partner.

Set up the tenant:

- Configure the partner brand, slug, domains, colors, and logo text.
- Update hero, problem, process, packages, FAQ, and CTA copy.
- Add tenant-specific booking links, payment links, reply-to, sender name, and phone routing.
- Confirm package names and pricing.
- Confirm who receives and qualifies leads.
- Confirm whether the partner provides blueprint, application support, delivery, or only referral.

Operate the tenant:

- Review leads by tenant.
- Keep partner-specific outreach templates active.
- Use suppression lists per tenant where needed.
- Export lead data only for authorized teams.
- Keep compliance language aligned to the partner's actual role.

## Quality Checks

Before using the workflow in production, confirm:

- The public tenant page loads at the expected slug or domain.
- The Funding Fit Scan form stores all funding metadata.
- New scan leads appear in the admin pipeline.
- Funding scan leads generate the funding-specific follow-up draft.
- Admins can filter, edit, and qualify leads.
- Outreach templates do not guarantee funding or eligibility.
- Suppression and explicit send approval rules are respected.
- Booking and payment links route to the correct tenant destination.

