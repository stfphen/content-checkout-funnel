# Content Checkout Funnel — Claude Instructions

## 🧠 Project Brain — READ FIRST
This repo has an Obsidian knowledge vault at **`brain/`** that holds all durable project context
(architecture, modules, roadmap, operations runbooks, known issues, decisions, and history).

**At the start of every session:** read `brain/00-Index/00-Home.md`. It is the hub that links to
everything else — follow its "start-of-session checklist" and open only the notes relevant to the
task instead of re-reading the whole codebase.

**Keep the brain current.** After any meaningful work:
- Append a dated bullet to `brain/50-Audit-Log/51-Timeline.md`.
- If a decision was made, add it to `brain/50-Audit-Log/52-Decision-Log.md`.
- If a bug/risk was found or fixed, update `brain/50-Audit-Log/53-Known-Issues.md`.
- When code changes a documented fact, update the relevant note and bump its `updated:` date.
- When the user says "update the brain," refresh the affected notes.

Conventions for the vault are in `brain/00-Index/01-How-To-Use-This-Vault.md`.

## Project identity
This is the Marketing Agency / Content Checkout Funnel project for DGTL-style creative and B2B marketing services.

The app includes:
- tenant-based sales funnels
- admin dashboard
- lead pipeline
- prospecting
- outreach
- batch builder
- checkout/service package flows
- future Funding Program / grant-opportunity engine

## Current priority
Stabilize the repo before building more features.

## Git workflow
- Never delete worktrees, reset branches, force push, or clean files without explicit user confirmation.
- Before editing, run `git status --short --branch`.
- Before committing, run tests/build if available.
- Prefer small branches and small commits.
- Never edit the same files in multiple worktrees at once.
- Use one integration branch for merging feature work.

## Verification
Before marking work complete:
- Run `npm test` if available.
- Run `npm run build` if available.
- Report exact commands and results.
- Report files changed.

## Product priorities
1. Keep admin navigation working.
2. Preserve lead pipeline, prospecting, outreach, batch builder, and checkout.
3. Keep tenant-aware architecture.
4. Avoid hardcoding one client, one grant source, or one service path.
5. Prefer mock data first, then real integrations.

## Current near-term roadmap
1. Repo recovery and branch cleanup.
2. Merge or close PR #2: AI prospect enrichment workflow.
3. Stabilize admin shell/navigation.
4. Build Funding Program module.
5. Connect funding opportunities to lead matching and outreach.
6. Package the product into a sellable B2B offer.
