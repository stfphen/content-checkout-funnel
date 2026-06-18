# Content Checkout Funnel — Claude Instructions

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
