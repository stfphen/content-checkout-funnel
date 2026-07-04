# Asset Prompt Sheet — Vertical × Direction Starter Packs

No image-generation tool was available in the build session, so this sheet is
the executable fallback (master prompt Phase 4): exact prompts, aspect
ratios, and target filenames for every starter pack. Generate with any
capable image model, then upload through the media library.

## How to use

1. Pick a vertical and a direction. Compose the prompt as:
   `<slot base prompt> + <direction grading modifier> + <global negative>`.
2. Generate at the slot's aspect ratio (one horizontal image per section
   slot, per the imagegen skill; never one tall multi-section image).
3. Name the file exactly `<vertical>-<direction>-<slot>-01.jpg` (increment
   the counter for alternates), e.g. `saas-dark-cinematic-hero-01.jpg`.
4. Upload via the admin media library WITHOUT selecting a tenant so the
   asset is library-scoped (`tenant_id = ''`, reusable across tenants).
   Tag it: `industry: [<vertical>]`, `format: [<slot>]`.
5. Smoke tenants currently use picsum placeholders with descriptive seeds;
   replace by mediaId once packs are uploaded.

**Global negative (append to every prompt):** no text, no words, no logos,
no watermarks, no purple-blue gradient glow, no neon outlines, no floating
abstract blobs, no fake UI chrome, no stock-photo handshake poses, natural
imperfect detail over CGI gloss.

**Palette consistency:** all images in one pack share the direction's grade.
Never mix grades inside a pack.

## Direction grading modifiers

- **premium-agency** — "clean daylight grade, white and cool-gray
  environment, controlled contrast, one restrained blue accent allowed,
  glossy but honest, shot on full-frame with a 35mm look"
- **editorial-minimal** — "warm monochrome grade, soft paper tones, muted
  shadows, documentary stillness, generous negative space, natural window
  light, magazine reportage feel"
- **bold-brutalist** — "high-contrast black-and-white, hard flash-lit or
  overcast flat light, raw texture, straight-on composition cropped hard,
  Swiss print poster energy"
- **warm-boutique** — "warm golden-hour grade, cream and terracotta tones,
  soft diffuse shadows, shallow depth of field, human warmth, film grain"
- **dark-cinematic** — "low-key cinematic grade, near-black environment,
  single motivated light source, deep shadows with luminous highlights,
  anamorphic feel, OLED-dark backgrounds"

## Slots and aspect ratios (same for every pack)

| Slot | Used by | Aspect | Count |
|---|---|---|---|
| `hero` | funnel hero (full-bleed/split), authority masthead ambience | 16:9 (2000×1125) | 1 |
| `support-a/b/c` | portfolio/case tiles, proof sections | 4:3 (1600×1200) | 3 |
| `texture` | background plate, section dividers, form panels | 21:9 (2100×900) | 1 |

## Vertical subject bases

### agency-creative
- `hero`: "a working creative studio mid-production, large monitor with color
  grading suite out of focus, camera rig and set lighting in frame, people
  mid-task not posing"
- `support-a`: "printed brand identity system spread on a worktable,
  letterhead, packaging and swatches arranged loosely"
- `support-b`: "a film set from behind the director's monitor, crew
  silhouettes, practical lights"
- `support-c`: "large-format campaign poster pasted on a city wall, street
  context, slight wear"
- `texture`: "close macro of screenprint ink on heavy paper stock, subtle
  halftone dots"

### professional-services-b2b
- `hero`: "two advisors working through documents at a boardroom table,
  laptop and printed financials, genuine mid-conversation posture, no
  handshake"
- `support-a`: "close detail of annotated financial documents with a pen and
  reading glasses, shallow focus"
- `support-b`: "modern professional office interior, empty meeting room with
  morning light, city visible through glass"
- `support-c`: "advisor presenting a single chart on paper to a client,
  hands and table only, no faces"
- `texture`: "macro of fine ledger paper grid with subtle emboss, tonal"

### saas-tech-ecommerce
- `hero`: "a clean modern software dashboard on a laptop in a real workspace,
  screen content abstracted into readable blocks, morning office light" (or
  substitute a true product screenshot; never a fake div mock)
- `support-a`: "developer or operator at a standing desk with two monitors,
  over-the-shoulder angle, screens abstracted"
- `support-b`: "abstract system visual: layered translucent planes connected
  by fine lines, engineered look, not blobs"
- `support-c`: "warehouse or logistics floor with motion blur of activity,
  industrial scale" (swap subject to match the product's industry)
- `texture`: "macro of brushed aluminum with fine machined lines, tonal"

### local-trades-retail
- `hero`: "a real work crew on-site mid-job, tools in use, honest daylight,
  worn equipment, no posed hardhat lineup"
- `support-a`: "before-and-after diptych of finished trade work, same angle
  both frames, honest lighting"
- `support-b`: "close-up of skilled hands doing precise trade work, texture
  of materials visible"
- `support-c`: "the business premises or branded work vehicle on a real
  street, local context"
- `texture`: "macro of raw building material grain (wood, shingle, or metal
  matching the trade), tonal"

## Worked examples

- `agency-creative-dark-cinematic-hero-01.jpg` (16:9): "a working creative
  studio mid-production, large monitor with color grading suite out of
  focus, camera rig and set lighting in frame, people mid-task not posing,
  low-key cinematic grade, near-black environment, single motivated light
  source, deep shadows with luminous highlights, anamorphic feel, OLED-dark
  backgrounds, no text, no words, no logos, no watermarks, no purple-blue
  gradient glow, no neon outlines, no floating abstract blobs, no fake UI
  chrome, no stock-photo handshake poses, natural imperfect detail over CGI
  gloss"
- `local-trades-retail-warm-boutique-support-a-01.jpg` (4:3): "before-and-
  after diptych of finished trade work, same angle both frames, honest
  lighting, warm golden-hour grade, cream and terracotta tones, soft diffuse
  shadows, shallow depth of field, human warmth, film grain, + global
  negative"

## Placeholder policy in templates

Until packs are generated, templates use picsum placeholder photography with
descriptive seeds (never div-based fake screenshots). Logo slots currently
show placeholder photography and read wrong by design: real client logos are
tenant-supplied assets, not generatable. Leave them placeholder until each
tenant uploads real marks.

Full matrix: 4 verticals × 5 directions × 5 slots = 100 images. Priority
order if generating incrementally: each vertical's `hero` in its
directionAffinity[0] grade first (4 images), then supports for the same
pairs, then the remaining direction grades.
