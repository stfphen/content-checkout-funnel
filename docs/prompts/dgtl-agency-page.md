# Build the DGTL Group agency page — new tenant `dgtl-group`

## Mission

Build a NEW, standalone, high-design brand page for **DGTL Group** (the agency that owns this platform) as a new tenant at **`/t/dgtl-group`**, independent of the existing Content Day funnel (`/t/dgtlmag`), which must stay completely untouched. This is DGTL's own agency site: it must sell DGTL's actual business model (content production + growth systems + funding readiness + white-label brand funnels) and read like the premium Toronto growth/creative agency it is.

## First actions (in order)

1. Read `CLAUDE.md` and `brain/00-Index/00-Home.md` (start-of-session checklist).
2. **Invoke the `new-tenant-page` skill and follow ALL of its phases end-to-end.** It encodes the proven process (architecture rules, config checklist, forms contract, verification ladder, brain updates, delivery). When it says to, also invoke `design-taste-frontend`.
3. Study the proven predecessor before building: `lib/tenants/dmtvStudio.js`, `components/templates/registry.js`, `components/showcase/` (the DMTV Studio build, PR #4, `/t/dmtv-studio`).
4. Re-run the skill's brand-research phase for DGTL (your egress may differ from prior sessions): try `https://dgtlgroup.io` (+ /about-us, /services, /work, /join-dgtl-team), Instagram `@dgtlgroup.io`, LinkedIn `/company/dgtlgroup`, `https://dgtl.bio`. Grab real imagery/copy if reachable; otherwise use the verified facts below.

## Canonical facts (repo is source of truth for platform/offer facts)

- **Identity**: DGTL Group, Toronto growth + creative agency. Legal entity "DGTL Group Holdings Limited". Offices cited: Toronto, Paris, Bali. Production hub: "DGTL Studio" in downtown Toronto. Corporate domain `dgtlgroup.io`; platform domain `dgtlmag.com`.
- **Service line 1 — Content Day** (from `lib/defaultTenant.js`): "Get a full month of content filmed in one day." Ladder: UGC Content $1,500/month → **Pro Content Day $2,500 one-time (flagship)** → Growth Retainer $3,500–$5,000/month → Campaign Scope (custom). Proof stats: 20+ videos, 1 shoot day, 30 days of content. Service areas: Toronto, GTA, Kitchener, Barrie, Newmarket, Bradford.
- **Service line 2 — Funded Growth Studio** (from `lib/funding/tenant.js`): "Turn growth plans into funded projects." Free Funding Fit Scan → Fundable Project Blueprint $2,500 → Application Support $5,000+ → Funded Growth Execution (custom) → Monthly Opportunity Intelligence (retainer). 8 Canadian funding lanes screened. Keep its compliance language: never guarantee eligibility or approval.
- **Service line 3 — White-label brand funnels** (the platform itself as a service): DGTL quietly runs the page, outreach, lead filtering, sales ops, and production while the client's brand stays front-facing. Live proof roster with real stats: **DMTV** (music media: 3M+ series views, 10K avg/video, 110K monthly reach; plus the DMTV Studio showcase page), **ELiXR Gallery** (high-ticket original art, $2,500–$10,000+ ladder), **ON Home Decor** ($200 curated-paint entry offer laddering to $50K transformations).
- **The Growth Platform** (marketable machine behind it all, `brain/20-Modules/20-Modules-MOC.md`): lead pipeline → prospecting/batch builder → enrichment + AI deep research → human-approved outreach → telephony with transcription/AI summaries → Stripe checkout → funding-readiness engine. Built on Next.js/Postgres with Claude AI throughout.
- **Web-verified positioning** (search snippets of dgtlgroup.io): "results-driven growth and creative agency based in Toronto, combining a full-service digital marketing studio with high-impact content production." Track record: 75+ campaigns/projects since 2022, $1M+ in direct client revenue, multi-9-figure organic impressions. Artist work: Swae Lee, Lil Tjay (Calgary live recap), A Boogie Wit Da Hoodie, Lil Tecca, Central Cee, Killy. Brand work: Epidemic Sound, DJI, PolarPro, Canon. Growth case studies: Guild's Garage (150K+ organic followers, 22M+ impressions in under six months), The 400 Market, Pacific High Dewata content campaign (Bali).
- **Brand assets**: `public/assets/brand/dgtl-logo.svg` — white "DGTL" wordmark with the final glyph (lightning flourish) in gold **#F0CF50**. Use this gold as the single accent on a dark page. The admin "Dark Command-Center" aesthetic (deep #08080b, Geist Mono numerals) is an in-house visual precedent.
- **⚠️ Known discrepancies — flag, do not resolve**: public snippets name the CEO as "Will Giroux" while internal repo anchors reference owner "Stephen" (stephen@dgtlgroup.io); do not print a founder name on the page without team confirmation. The DGTL↔DMTV client relationship is internal knowledge (config comments), not public — presenting DMTV as a client brand on DGTL's own page is fine (it's DGTL's platform), but flag it in open items. dgtlgroup.io's actual visual identity could not be fetched; if you also can't reach it, design from the logo asset + facts above and flag for an eyeball pass.

## Section brief (the "team list" for this page)

1. **DGTL (title and brand)** — hero. Positioning: growth + creative agency; Toronto. Dark, cinematic, metrics-forward.
2. **Offer ladder carousel** — the Content Day packages (canonical prices above) framed as the agency's productized entry, with Campaign Scope as the high-ticket end.
3. **Selected work / results wall** — real artist + brand names and the two quantified case studies (Guild's Garage numbers, DMTV reach numbers). No fake logos, no invented metrics; only the verified facts above.
4. **Brand funnels we run** — the white-label roster (DMTV, ELiXR, ON Home Decor) with their real entry offers and links to their live pages (`/t/dmtv-studio`, `/t/elixr`, `/t/on-home-decor`). This is the section no competitor can copy; give it weight.
5. **The Growth Platform** — the pipeline → enrichment → outreach → telephony → checkout → funding machine, presented as the operating system behind every engagement.
6. **Funding cross-sell band** — "Could funding help pay for your next growth project?" pointing to the Funded Growth Studio (free Fit Scan). Reuse the compliance-safe framing from `lib/funding/tenant.js`.
7. **About DGTL** — studio story, Toronto/Paris/Bali, since-2022 track record stats.
8. **FAQ** — engagement model, timelines, pricing approach, funding disclaimer, white-label model.
9. **Start a project** — the main conversion form.
10. **Join DGTL** — team applications (their site has /join-dgtl-team); tracks: PRODUCTION | STRATEGY | SALES.
11. Footer with real links: dgtlgroup.io, Instagram @dgtlgroup.io, LinkedIn /company/dgtlgroup, dgtl.bio.

## Form tagging (per the skill's /api/leads contract)

All forms include `tenantId`/`tenantSlug` for the new tenant. Categories: `project-inquiry` (+ `packageId` from the selected offer), `funding-interest` (+ `packageId: "funding-fit-scan"`), `whitelabel-inquiry`, `team-application-<production|strategy|sales>` (+ `contactTitle`). One CTA label per intent, page-wide.

## Config + architecture specifics

- New config `lib/tenants/dgtlGroup.js`: `id: "tenant_dgtl_group"`, `slug: "dgtl-group"`, `domains: ["dgtlgroup.io", "www.dgtlgroup.io"]` (no collision with existing tenants), brand `primaryColor: "#F0CF50"`, `accentColor: "#0a0a0b"`, logo `/assets/brand/dgtl-logo.svg`.
- Template: reuse the `showcase` template ONLY if these section shapes genuinely fit its components; otherwise register a new `agency` template in `components/templates/registry.js` with its own `components/agency/` directory + CSS module, following the showcase build pattern exactly. Do not modify FunnelPage, styles.css, defaultTenant, tenantValidation, or any existing tenant.
- Register in `scripts/seed-tenants.js`.

## Delivery

Follow the skill's full verification ladder (config tests, npm test, npm run build, seed, dev-server SSR checks, dash audit, Playwright desktop+mobile screenshots, every form submitted end-to-end with leads verified tenant-scoped, sibling-tenant regression check). Update the brain (Timeline, Decision-Log if architecture changed, Tenants-Catalog row, Routes-Map if routing facts changed). Commit in small steps to your designated branch, push, and **open a PR** titled for the DGTL Group agency page. End your report with: screenshots, exact commands/results, and an open-items list for the DGTL team (founder-name confirmation, dgtlgroup.io visual-identity eyeball pass, real work imagery to replace placeholders, domain go-live plan for dgtlgroup.io pointing at the platform).
