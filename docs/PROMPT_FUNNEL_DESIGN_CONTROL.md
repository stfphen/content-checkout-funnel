# Prompt: Funnel Design Control Upgrade

> **STATUS: IMPLEMENTED 2026-07-02** on branch `feature/funnel-design-control`
> (worktree `.claude/worktrees/funnel-design-control`, 9 commits `b768997..33b43f8`,
> 41 files, +4620/−407). All four features shipped; `npm test` 246/246 and
> `npm run build` green; all 5 direction previews + mediaId resolution verified
> against a live dev server; default tenants render unchanged (zero `--fp-*` vars).
> Merge to `main` pending operator review. Details: `brain/50-Audit-Log/51-Timeline.md`
> (2026-07-02) and `brain/50-Audit-Log/52-Decision-Log.md`.

Paste everything below the line into Claude Code (Fable 5) at the repo root.

---

Read `brain/00-Index/00-Home.md` and follow the start-of-session checklist, then plan and implement the **Funnel Design Control** upgrade. Work in a feature branch off `main`, small commits, run `npm test` and `npm run build` before declaring anything done.

## Problem

The tenant funnel generator works, but has four flaws:

1. **Every generated page is a carbon copy** of the original "content day" layout. `components/FunnelPage.jsx` is one hardcoded template and `lib/tenantBuilder/generateTenant.js` forces the same 11 sections (hero, problem, system, process, output, packageSection, packages, enterprise, faq, finalCta, mobileCta) in the same order with the same visual treatment. Only accent colors vary (`lib/branding.js`).
2. **No editing after generation.** `components/admin/TenantBuilder.jsx` only offers generate → preview draft → publish. There is no way to modify a page before or after publishing short of regenerating from scratch.
3. **Copy is too long.** The SYSTEM_PROMPT in `lib/tenantBuilder/generateTenant.js` has zero length constraints, so pages get littered with text that buries the design.
4. **No media control.** Hero/section/portfolio media comes from whatever the model emits; there is no way to pick, upload, or swap images per tenant, even though each business needs niche-relevant imagery.

## Use the installed taste skills

`.claude/skills/` contains the taste-skill pack. Actively read and apply them:

- `design-taste-frontend` + `high-end-visual-design` — baseline anti-generic design standards for ALL directions and for any JSX/CSS you write.
- `minimalist-ui`, `industrial-brutalist-ui`, `gpt-taste`, `brandkit` — source material for distinct design directions (palettes, type systems, spacing, motion).
- `stitch-design-taste` — pattern for encoding a design direction as a machine-readable spec; use its approach to define each direction as a structured token set, not vibes.
- `redesign-existing-projects` — audit checklist for upgrading FunnelPage without breaking checkout/lead capture.
- `full-output-enforcement` — no placeholders or truncated files in your output.

## Feature 1 — Selectable design directions

- Define **4–5 named design directions** as data (e.g. `lib/tenantBuilder/designDirections.js`): something like Editorial Minimal, Premium Agency (current look, refined), Bold Brutalist, Warm Boutique, Dark Cinematic. Each direction is a token spec: palette, font pairing (self-hosted or system stacks — no new paid deps), type scale, spacing density, corner radius, shadow/motion character, section-order variant, hero layout variant (e.g. split / full-bleed / typographic). Derive the aesthetics from the taste skills above.
- Extend the tenant config schema with a `design` block (`direction`, plus resolved tokens) — update the JSON schema in `generateTenant.js`, `normalizeTenantConfig` validation, and `lib/branding.js` so tokens flow through CSS custom properties. Existing tenants without a `design` block must default to the current look (backwards compatible; keep 208 tests green).
- Make `FunnelPage.jsx` consume the tokens and layout variants. Prefer one component tree with variant props/CSS over forked page copies. Section order and hero layout may differ per direction.
- **UI:** in `TenantBuilder.jsx`, add a direction picker (visual cards with mini style previews — palette swatch, font sample, layout thumbnail) shown before generation. Pass the selection into the generate API; the model prompt should be told the chosen direction so copy tone matches (brutalist = terse/punchy, editorial = refined, etc.).
- Multi-tenant rule from CLAUDE.md applies: nothing hardcoded to one client or one aesthetic.

## Feature 2 — Edit pages before and after publish (CLI-style prompt edits + form edits)

- New API route `app/api/admin/tenants/edit/route.js`: takes a tenantId + a natural-language instruction (e.g. "shorten the hero headline", "swap the FAQ and process sections", "make the palette warmer"), loads the current **draft** config, sends config + instruction to the model with a strict "return the minimally-changed full config" system prompt, validates, and saves via `saveTenantDraftConfig`. Same auth (`requireRole owner/admin`) and `logAudit` pattern as the generate route.
- **UI:** extend the admin tenant flow into a proper draft editor panel (new `components/admin/TenantEditor.jsx`, lazy-loaded via `lazyPanels.jsx`):
  - List existing tenants (draft + published) and open any into the editor — published tenants edit their draft copy, then republish (draft/publishedConfig split in `lib/store.js` already supports this).
  - A prompt box for the natural-language edits above, with before/after diff summary of changed fields.
  - Direct per-section form editing for headline/body/CTA fields and the design direction (switching direction restyles without regenerating copy).
  - Live "Preview draft" link (`/t/{slug}?preview=draft`) and a Publish button reusing `app/api/admin/tenants/publish/route.js`.

## Feature 3 — Concise copy enforcement

- Add hard limits to the generation schema: `maxLength` on every copy field (roughly: headlines ≤ 70 chars, subheads ≤ 120, body paragraphs ≤ 280, bullets ≤ 90, 3–5 bullets max, FAQ answers ≤ 300). Tune to what the design comfortably holds.
- Rewrite SYSTEM_PROMPT copy rules: benefit-led, no filler, one idea per block, whitespace is part of the design; the direction's tone applies. Same rules go into the edit route's prompt.
- Add a normalization warning (not silent truncation) when limits are exceeded, surfaced in the builder UI like existing `warnings`.

## Feature 4 — Media library + per-section media swapping

- **Storage:** tenant-scoped media library. Table + `lib/store.js` accessors (`media_assets`: id, teamId, tenantId nullable, filename, mime, width/height, alt, createdAt). Store files under `public/uploads/` locally with an abstraction ready for S3 later (mock-first per project rules). Validate mime/size on upload; images only for now (plus keep existing video/embed support in portfolio items).
- **API:** `app/api/admin/media/route.js` — POST upload (multipart), GET list (tenant/team scoped), DELETE. Auth + audit like other admin routes.
- **Config:** allow any media slot in the tenant config (hero image, output/content-examples section, portfolio items) to reference a library asset by `mediaId` OR keep a direct `src` URL. Resolve `mediaId → src` at render time; `MediaImage` in `FunnelPage.jsx` keeps its local-vs-remote next/image rule. Check `brain/20-Modules/2D-Portfolio-Media.md` — a `mediaId` indirection was already planned; follow it.
- **UI:** `components/admin/MediaPicker.jsx` — grid of the tenant's assets with upload dropzone; embed it in TenantEditor next to every media slot so the operator can swap the hero image or any section/portfolio media in two clicks. Show current image thumbnail inline per slot.
- Generation should leave media slots as tasteful direction-appropriate placeholders (or existing assets if regenerating) — never fabricate hot-linked stock URLs.

## Order of work

1. Design directions data + schema + branding/token plumbing + FunnelPage variants (Feature 1, largest).
2. Copy limits + prompt rewrite (Feature 3, touches same files).
3. Edit route + TenantEditor (Feature 2).
4. Media library + picker, wired into the editor (Feature 4).
5. Tests for: schema backwards-compat, direction token resolution, copy-limit warnings, edit-route validation, media upload/scoping. Then full `npm test` + `npm run build`.

## Guardrails

- Follow `CLAUDE.md`: git status before edits, no force-push/reset, preserve checkout/lead/outreach flows, tenant-aware everything.
- Do not break existing published tenants — every schema change needs a safe default.
- No new heavyweight dependencies without asking; no paid font/CDN requirements.
- When finished: report exact commands run, results, and files changed; update `brain/50-Audit-Log/51-Timeline.md`, `52-Decision-Log.md` (design-direction architecture decision), and the affected module notes (`16-Design-System`, `2D-Portfolio-Media`, `14-Routes-Map`).
