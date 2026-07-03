# Landing-page conversion patterns: agency / creative services

Research date: 2026-07-03. Patterns only, no code or copy was reused from sources.

## 1. Section archetypes that convert (canonical order)

Agency buyers judge the work before the pitch. Portfolio moves up, features move down.

1. **hero** - one confident positioning line + who it is for + primary CTA. Real agencies (Metalab, Ramotion, Sandwich) keep it to 3-6 words plus an 15-20 word subline.
2. **portfolio** - directly below the hero (Ramotion puts the client/work grid in slot 2; Pentagram IS the grid). 2-3 column grid, mixed aspect ratios, client name + one-line descriptor per tile. Tiles double as case-study links.
3. **references** - logo wall or named-client strip immediately after or interleaved with portfolio. Logos work as both proof and portfolio entry points (Ramotion pattern).
4. **system / process** - "how we work" as 3-4 numbered steps or a dual-track service map (Ramotion splits Brand vs Product). Buyers of creative retainers need to see the engagement model since price is often custom.
5. **output** - deliverables made concrete: what lands in your inbox, in what timeframe. Superside leads with breadth-of-deliverables imagery for exactly this reason.
6. **packages** - productized agencies (Superside model, and this platform) show tiered packages here; classic agencies substitute engagement types (project / retainer / team extension). Anchor with a middle tier.
7. **faq -> finalCta** - objection handling (scope, revisions, ownership, timeline) then one repeated CTA with contact fallback. Sandwich repeats contact info in the footer with a phone number, which reads human.

`problem` is optional in this vertical: agencies sell confidence, not pain. When used, keep it one short section between hero and portfolio, framed as "what slow/generic creative costs you," never a 3-card pain grid. `checkout` should follow packages with single-field starts and progressive disclosure (Unbounce finding: soft first step converts better than a long form).

## 2. Three hero patterns

**A. Statement hero (Metalab, Pentagram).** Type only. One 2-4 word declarative line at display scale (10-14vw equivalent), subline at body scale, generous whitespace, CTA quiet. No image; the portfolio below is the image. Works when the brand voice is strong.

**B. Work-behind-glass hero (Superside, most Webflow agency templates).** Positioning line left or centered at 48-72px, with a collage/carousel of real deliverables as the visual: tilted cards, device frames, or a masonry peek that bleeds off the fold. Dual CTA: "Book a call" primary, "See work" secondary.

**C. Reel hero (video/motion studios).** Muted autoplay loop full-bleed behind or beside a short headline; a "watch reel" affordance replaces the second CTA. Keep headline to one line so the footage reads. 2026 galleries show this as the default for premium studios; Sandwich notably inverts it with a text-first hero, which itself signals confidence.

Common to all three: exactly one idea above the fold, headline noticeably larger than everything else, CTA visible without scroll.

## 3. Trust and social-proof patterns for agencies

- **Named-client outcomes over star ratings.** "Client + what we made + what happened" beats anonymous testimonials. Sandwich titles each project with the client name baked in.
- **Logo walls with captions.** A logo plus a 3-5 word descriptor of the engagement converts a vanity strip into proof of scope (Ramotion).
- **Longevity and scale numbers.** "Since 2006," "400+ brands," "23 partners, 4 cities." One or two numbers, stated flatly, near the hero.
- **Case-result stat cards.** 2-3 metrics per featured case (lift %, launch time, retention). Put one high-impact number above the fold, detail lower (Unbounce layering pattern).
- **Testimonials as carousel of quote + name + role + headshot**, 5-10 items, placed after portfolio, never before it.
- **Long-relationship proof.** "8 years with X" or a retrospective case reads stronger than volume for retainer sales (Pentagram retrospectives).

## 4. Copy register

- Tone: confident, plain, lightly wry. First person plural ("We make X"). No superlative stacking.
- Headlines: 2-6 words for statement heroes, max ~9 for benefit heroes. Sublines 15-25 words.
- Section labels are verbs or plain nouns ("Work," "How we work," "Packages"), not cleverness.
- CTA verbs that fit: See the work, Book a call, Start a project, Get a quote, View packages, Let's talk. Outcome-specific beats generic (Unbounce: "Design my X" style outperforms "Get started").
- Avoid: synergy, best-in-class, cutting-edge, unleash, elevate, "digital experiences," "we craft pixel-perfect," passion-speak, and any headline that could sit on a competitor's site unchanged.

## 5. Imagery brief

Subjects: real deliverables (screens, print, frames from video), work-in-progress artifacts, and candid studio/team shots. Never stock handshake or laptop-with-coffee. Portfolio tiles: 4:3 or 3:2 for stills, 16:9 for video frames, occasional 1:1 for identity work; mix ratios within one grid for rhythm. Photography over illustration for the work itself; illustration only for process diagrams.

- **premium-agency** (cinematic full-bleed, Geist): 16:9 and 21:9 full-bleed stills or loops, dark grade, work shown edge to edge with captions overlaid.
- **editorial-minimal** (warm monochrome, serif, hairlines): stills desaturated toward one warm tone, framed with generous margins and hairline borders, captions set below like plates in a book.
- **bold-brutalist** (Swiss print, uppercase, 2px rules): images cropped hard into a strict modular grid, no rounding, monochrome or single-accent duotone, filenames/indices as captions.
- **warm-boutique** (creams, rounded, soft shadows): 3:2 and 1:1 tiles with large radii, natural-light studio photography, soft drop shadows, people visible.
- **dark-cinematic** (OLED dark, glass, serif): video frames and dark-UI screens on near-black, glass-panel overlays for captions, high contrast, specular highlights allowed.

## 6. Anti-patterns / AI-slop tells for this vertical

- Vertically rotated side-rail text ("SCROLL," "PORTFOLIO") and city/timezone/locale strips in the header.
- "BRAND. MOTION. SPATIAL." style word-triplet hero strips and marquee tickers of buzzwords.
- Section-number eyebrows ("01 / SERVICES") on every section; one is a device, five is a template.
- Em-dashes scattered through copy; fake awards ("Awwwards SOTD" badges with no link), invented press logos.
- Three identical icon-cards for "services" where the icons are generic line glyphs; agencies show work, not icons.
- Uniform 1:1 portfolio grid with AI-generated placeholder art; mixed real ratios read authentic.
- Gradient-mesh purple hero backgrounds and glassmorphism on a services site that has no product UI to show.
- Testimonials with stock headshots, first-name-only attributions, or round 5.0 star widgets (B2B agency buyers do not shop by stars).
- A pricing table with "Contact us" in every tier; either show numbers or use engagement types honestly.

## 7. References studied

- https://land-book.com/?sort=view&from=month&type=Agency - Landbook agency gallery (index consulted via search; direct fetch blocked). Confirms portfolio-early norm and reel heroes.
- https://www.awwwards.com/websites/design-agencies/ and https://www.awwwards.com/awwwards/collections/agency-portfolios/ - oversized-type heroes, kinetic type, scroll-driven reveals as award-tier patterns.
- https://tailwindcss.com/plus/ui-blocks/marketing - Tailwind Plus marketing block taxonomy (12 hero, 15 feature, 12 pricing, 8 testimonial, 6 logo-cloud, 7 FAQ variants); canonical hero -> features -> stats -> testimonials -> pricing -> CTA -> FAQ order.
- https://www.shadcnblocks.com/blocks - shadcn/ui community block counts (Hero 245, Feature 311, Gallery 34, Case Studies 11, Awards 7); trust-before-pricing sequencing.
- https://cruip.com/ - free/Tailwind template structures; modular hero/feature/testimonial/CTA rhythm.
- https://html5up.net/ - classic free templates (Spectral, Story, Ethereal); alternating full-width "spotlight" band rhythm for narrative sections.
- https://www.metalab.com/ - statement hero pattern, "since 2006" longevity proof, minimal chrome.
- https://www.ramotion.com/ - portfolio-grid-in-slot-2, captioned logo wall, dual-track service map, engagement types instead of pricing.
- https://www.superside.com/ - productized-creative model: deliverables-collage hero, "400+ brands" scale stat, book-a-demo primary CTA.
- https://sandwich.co/ - text-first hero for a video studio, named-client project titles, conversational register, scattered inline CTAs.
- https://www.pentagram.com/ - pure work-grid homepage, dual-axis filtering, retrospectives as long-relationship trust.
- https://unbounce.com/landing-page-examples/best-landing-page-examples/ - CTA specificity, layered social proof, progressive-disclosure forms.
