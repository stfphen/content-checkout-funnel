# SaaS / Tech & Ecommerce, Landing-Page Conversion Patterns

Research date: 2026-07-03. Patterns only, no code, copy, or imagery reproduced.

## 1. Section archetypes that convert (canonical order)

1. **Product-shot hero**. Outcome headline, one-line subhead, single primary CTA, product UI as proof. Maps to `hero`.
2. **Logo wall**. 6-9 recognizable customer logos immediately post-hero, single quiet row. Maps to `references` (or a slim strip inside `hero`).
3. **Problem framing / feature bento**. Pain-first statement, then 4-6 unequal cells mixing UI crops, short claims, one stat. Maps to `problem` then `system`.
4. **Workflow walkthrough**. Numbered steps (Linear numbers its sections 1.0-5.0), each step paired with a task-focused UI vignette, alternating full-width bands. Maps to `process`.
5. **Outcome stat band**. 3-4 large numbers (volume processed, uptime, teams served) with one-line captions (Stripe mid-page). Maps to `output`.
6. **Testimonials / case proof**. Attributed quotes with face, name, title, company; scale claims embedded in the case, not floating. Maps to `portfolio` + `references`.
7. **Pricing, FAQ, final CTA**. 2-3 tier cards with one highlighted, friction-killers under buttons ("no credit card"), FAQ accordion, then a short repeated-CTA band. Maps to `packages` and `checkout`, `faq`, `finalCta`.

Trust sequence that recurs: logos (borrowed authority) -> product proof (capability) -> stats (scale) -> quotes (peer voice) -> guarantees near the buy action. Unbounce data: 73% of high performers use a single focused CTA; effective headlines average 44 characters.

## 2. Three hero patterns

- **Centered stack over product shot** (Cruip Simple, most shadcn hero blocks). Nav, then centered H1 at 56-80px desktop, 1-2 line subhead at ~18-20px, CTA pair, then a large browser-framed screenshot bleeding below the fold. Screenshot gets a thin border, soft shadow, slight top-crop so it reads as a window into the app.
- **Split editorial** (classic SaaS gallery staple). Left column: eyebrow label, 2-line headline, subhead, CTA plus micro-proof (avatars, rating). Right column: angled or straight product screenshot, sometimes a short looping capture. 55/45 split, headline never wraps past 3 lines.
- **Statement hero, product below** (Linear, Vercel, Raycast). Short declarative headline (3-6 words), minimal subhead, dual CTA (primary action + "Talk to sales"), no image beside the type; the first full product frame arrives as the next scroll beat. Works only with strong type discipline and a dark or near-white field. Note: 23% of high-converting pages use no hero image at all (Unbounce).

## 3. Trust and social-proof patterns

- **Logo wall**: one row, monochrome or dimmed logos, auto-scroll marquee acceptable at 9+ logos (Stripe dual-carousel). Never more than two rows.
- **Stat bands**: uptime, requests/volume processed, customer count, countries. Large numeral + small caption. Stripe uses 4; more dilutes.
- **Scale-in-context**: metric embedded inside a named case ("powers X for Company Y", Vercel style) reads stronger than floating numbers.
- **Review-platform proof**: G2/Capterra star ratings with review counts near CTA; badge strips (SOC 2, GDPR, ISO 27001) belong near pricing/checkout, small and gray, not celebrated.
- **Human testimonials**: face, full name, title, company; carousel of many short quotes (Raycast) or 3-4 curated quotes (Stripe). Only 54% of pages use testimonials at all, so presence itself is an edge.

## 4. Copy register

- Tone: confident, declarative, plain. Present tense, second person. Problem-first beats feature-first.
- Headlines: under 8 words / ~44 characters, outcome-led ("Ship faster", not "A platform for..."). Subhead answers what, for whom, why care, in one sentence.
- CTA verbs: "Start free", "Get started", "Book a demo", "Start your free trial", "Deploy now", "Download". Specific beats generic ("Get free clips" > "Sign up"). One primary CTA; secondary only for demo-vs-trial or docs (dev tools).
- Friction-killers under CTA: "No credit card required", "Free 14-day trial", "Cancel anytime".
- Jargon to avoid: "revolutionary", "cutting-edge", "seamless", "supercharge", "unlock", "empower", "all-in-one solution", "10x your", "AI-powered" as the whole pitch.

## 5. Imagery brief

Subjects: real product UI (task-focused vignettes, not full-app dumps), abstract system diagrams (nodes, flows), sparing workspace/people photography (27% of pages), contextual photography with brand-geometry overlay (Stripe). Aspect ratios: hero screenshot 16:10 or 3:2 in a browser frame; bento cells 1:1 and 4:3 mixed; full-bleed bands 21:9. Photographic for trust and scale moments, illustrative/diagrammatic for how-it-works, never clip-art.

Flex across the 5 design directions:
- **premium-agency**: full-bleed cinematic UI captures with heavy negative space, Geist-class grotesque, screenshots color-graded to the palette.
- **editorial-minimal**: screenshots desaturated to warm monochrome, hairline-framed, generous margins; serif display over the shot, captions like figure numbers.
- **bold-brutalist**: screenshots squared-off, no shadow, 2px rules as frames; diagrams as stark black schematics; uppercase labels on every asset.
- **warm-boutique**: rounded 12-16px corners, cream mats around screenshots, soft diffuse shadows, occasional hand-drawn annotation over UI.
- **dark-cinematic**: OLED-black field, screenshots glowing on glass panels with subtle blur (Raycast register), thin light borders, serif headline floating above.

## 6. Anti-patterns / AI-slop tells

- Purple-to-blue gradient hero on dark, glowing orbs, centered hero over dark mesh/aurora background.
- Three identical equal-width feature cards with icon, title, two lines, repeated for every section.
- Div-built fake dashboard "screenshots" (gray bars pretending to be charts). Use a real or honestly abstract asset, never a counterfeit UI.
- Fake version labels ("V0.6", "BETA", "v2.0 launching soon") used as decoration.
- Fake-precise stats ("12,847 teams", "99.98% faster") with no source; invented logo walls.
- Em-dashes in marketing copy; also "Introducing" eyebrow on everything, sparkles emoji, "Trusted by 10,000+ companies" with stock logos.
- Identical border-radius plus identical shadow on every element; bento grid where all cells are actually the same size.
- Copy tells: "Elevate your workflow", "Experience the power of", triple parallel headlines ("Build. Ship. Scale.") used reflexively.

## 7. References studied

- SaaS Landing Page gallery: https://saaslandingpage.com/ (direct fetch blocked, patterns via search summaries)
- Landbook gallery: https://land-book.com/ (direct fetch blocked, known categories referenced)
- Cruip free templates index: https://cruip.com/free-templates/
- Cruip "Simple" live demo (section rhythm walkthrough): https://simple.cruip.com/
- shadcn/ui marketing block ecosystems: https://www.shadcn.io/blocks , https://shadcnstudio.com/blocks , https://www.shadcnblocks.com/pages/landing-page
- Linear: https://linear.app/
- Stripe: https://stripe.com/
- Vercel: https://vercel.com/home
- Raycast: https://raycast.com/
- Unbounce, State of SaaS Landing Pages (conversion benchmarks): https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/
- LandingRabbit, SaaS hero section anatomy: https://landingrabbit.com/blog/saas-website-hero-section
