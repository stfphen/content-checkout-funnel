import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SECTION_ORDER,
  resolveDesign
} from "../lib/tenantBuilder/designDirections.js";

/**
 * Frozen snapshots of resolveDesign output per direction, captured from the
 * pre-section-variants implementation. These are inline literals ON PURPOSE:
 * they prove the section-variant / vertical-preset layers change nothing for
 * tenants that don't opt in, and they freeze the five shipped directions'
 * token values (the closed-key test checks shape, this checks values).
 * If one of these fails, existing production tenants have drifted.
 */
const FROZEN_DIRECTIONS = {
  "premium-agency": {
    heroVariant: "full-bleed",
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    vars: {}
  },
  "editorial-minimal": {
    heroVariant: "typographic",
    sectionOrder: [
      "hero",
      "portfolio",
      "system",
      "problem",
      "process",
      "references",
      "output",
      "packages",
      "fundedOpportunity",
      "fundingPromo",
      "checkout",
      "faq",
      "finalCta"
    ],
    vars: {
      "--fp-font-display": "var(--font-fraunces), Georgia, 'Times New Roman', serif",
      "--fp-h1-size": "clamp(44px, 6.4vw, 76px)",
      "--fp-h1-weight": "600",
      "--fp-h1-tracking": "-0.02em",
      "--fp-h1-leading": "1.04",
      "--fp-h2-size": "clamp(34px, 4.6vw, 54px)",
      "--fp-h2-weight": "600",
      "--fp-eyebrow-font": "inherit",
      "--fp-eyebrow-tracking": "0.14em",
      "--fp-eyebrow-color": "#787774",
      "--fp-bg": "#fbfbfa",
      "--fp-surface": "#ffffff",
      "--fp-soft": "#f7f6f3",
      "--fp-fg": "#111111",
      "--fp-muted": "#787774",
      "--fp-border-color": "#eaeaea",
      "--fp-border-w": "1px",
      "--fp-radius": "10px",
      "--fp-radius-button": "8px",
      "--fp-section-pad": "128px",
      "--fp-section-pad-sm": "80px",
      "--fp-grid-gap": "20px",
      "--fp-shadow-card": "none",
      "--fp-shadow-form": "none",
      "--fp-input-bg": "#ffffff",
      "--fp-input-border": "#eaeaea",
      "--fp-button-dark-bg": "#111111",
      "--fp-button-dark-fg": "#ffffff",
      "--fp-dur": "600ms",
      "--fp-ease": "cubic-bezier(0.16, 1, 0.3, 1)"
    }
  },
  "bold-brutalist": {
    heroVariant: "typographic",
    sectionOrder: [
      "hero",
      "problem",
      "output",
      "system",
      "process",
      "portfolio",
      "packages",
      "references",
      "fundedOpportunity",
      "fundingPromo",
      "checkout",
      "faq",
      "finalCta"
    ],
    vars: {
      "--fp-font-display": "var(--font-grotesk), 'Arial Black', 'Helvetica Neue', sans-serif",
      "--fp-h1-size": "clamp(52px, 10vw, 118px)",
      "--fp-h1-weight": "700",
      "--fp-h1-tracking": "-0.04em",
      "--fp-h1-leading": "0.9",
      "--fp-h2-size": "clamp(40px, 6vw, 72px)",
      "--fp-h2-weight": "700",
      "--fp-eyebrow-font": "var(--font-mono, 'SF Mono', 'Courier New', monospace)",
      "--fp-eyebrow-tracking": "0.1em",
      "--fp-eyebrow-color": "#050505",
      "--fp-bg": "#f4f4f0",
      "--fp-surface": "#f4f4f0",
      "--fp-soft": "#eae8e3",
      "--fp-fg": "#050505",
      "--fp-muted": "#3d3d38",
      "--fp-border-color": "#050505",
      "--fp-border-w": "2px",
      "--fp-radius": "0",
      "--fp-radius-button": "0",
      "--fp-section-pad": "104px",
      "--fp-section-pad-sm": "64px",
      "--fp-grid-gap": "14px",
      "--fp-shadow-card": "none",
      "--fp-shadow-form": "none",
      "--fp-input-bg": "#ffffff",
      "--fp-input-border": "#050505",
      "--fp-button-dark-bg": "#050505",
      "--fp-button-dark-fg": "#f4f4f0",
      "--fp-dur": "120ms",
      "--fp-ease": "linear"
    }
  },
  "warm-boutique": {
    heroVariant: "split",
    sectionOrder: [
      "hero",
      "system",
      "portfolio",
      "process",
      "references",
      "problem",
      "output",
      "packages",
      "fundedOpportunity",
      "fundingPromo",
      "checkout",
      "faq",
      "finalCta"
    ],
    vars: {
      "--fp-font-display": "var(--font-bricolage), 'Avenir Next', 'Helvetica Neue', sans-serif",
      "--fp-h1-size": "clamp(46px, 6.8vw, 82px)",
      "--fp-h1-weight": "700",
      "--fp-h1-tracking": "-0.025em",
      "--fp-h1-leading": "1.02",
      "--fp-h2-size": "clamp(36px, 4.8vw, 58px)",
      "--fp-h2-weight": "700",
      "--fp-eyebrow-font": "inherit",
      "--fp-eyebrow-tracking": "0.12em",
      "--fp-eyebrow-color": "color-mix(in srgb, var(--blue) 70%, #7a6c60)",
      "--fp-bg": "#fdf8f2",
      "--fp-surface": "#ffffff",
      "--fp-soft": "#f7efe6",
      "--fp-fg": "#2a211c",
      "--fp-muted": "#7a6c60",
      "--fp-border-color": "rgba(42, 33, 28, 0.12)",
      "--fp-border-w": "1px",
      "--fp-radius": "20px",
      "--fp-radius-button": "999px",
      "--fp-section-pad": "112px",
      "--fp-section-pad-sm": "72px",
      "--fp-grid-gap": "18px",
      "--fp-shadow-card": "0 24px 60px rgba(42, 33, 28, 0.08)",
      "--fp-shadow-form": "0 24px 70px rgba(42, 33, 28, 0.1)",
      "--fp-input-bg": "#ffffff",
      "--fp-input-border": "rgba(42, 33, 28, 0.18)",
      "--fp-button-dark-bg": "#2a211c",
      "--fp-button-dark-fg": "#fdf8f2",
      "--fp-dur": "320ms",
      "--fp-ease": "cubic-bezier(0.32, 0.72, 0, 1)"
    }
  },
  "dark-cinematic": {
    heroVariant: "full-bleed",
    sectionOrder: [
      "hero",
      "output",
      "portfolio",
      "problem",
      "system",
      "process",
      "references",
      "packages",
      "fundedOpportunity",
      "fundingPromo",
      "checkout",
      "faq",
      "finalCta"
    ],
    vars: {
      "--fp-font-display": "var(--font-instrument), Georgia, 'Times New Roman', serif",
      "--fp-h1-size": "clamp(48px, 7vw, 92px)",
      "--fp-h1-weight": "400",
      "--fp-h1-tracking": "-0.015em",
      "--fp-h1-leading": "1.02",
      "--fp-h2-size": "clamp(38px, 5vw, 64px)",
      "--fp-h2-weight": "400",
      "--fp-eyebrow-font": "inherit",
      "--fp-eyebrow-tracking": "0.16em",
      "--fp-eyebrow-color": "color-mix(in srgb, var(--blue) 55%, #f5f5f7)",
      "--fp-bg": "#0a0a0c",
      "--fp-surface": "rgba(255, 255, 255, 0.06)",
      "--fp-soft": "#101014",
      "--fp-fg": "#f5f5f7",
      "--fp-muted": "rgba(235, 235, 240, 0.64)",
      "--fp-border-color": "rgba(255, 255, 255, 0.12)",
      "--fp-border-w": "1px",
      "--fp-radius": "16px",
      "--fp-radius-button": "999px",
      "--fp-section-pad": "120px",
      "--fp-section-pad-sm": "76px",
      "--fp-grid-gap": "18px",
      "--fp-shadow-card": "0 30px 80px rgba(0, 0, 0, 0.45)",
      "--fp-shadow-form": "0 30px 90px rgba(0, 0, 0, 0.5)",
      "--fp-input-bg": "rgba(255, 255, 255, 0.08)",
      "--fp-input-border": "rgba(255, 255, 255, 0.18)",
      "--fp-button-dark-bg": "#f5f5f7",
      "--fp-button-dark-fg": "#050505",
      "--fp-dur": "600ms",
      "--fp-ease": "cubic-bezier(0.32, 0.72, 0, 1)"
    }
  }
};

test("resolveDesign output is frozen per direction — the zero-drift anchor", () => {
  for (const [id, expected] of Object.entries(FROZEN_DIRECTIONS)) {
    const resolved = resolveDesign({ direction: id });
    assert.equal(resolved.id, id);
    assert.equal(resolved.heroVariant, expected.heroVariant, `${id} heroVariant`);
    assert.deepEqual(resolved.sectionOrder, expected.sectionOrder, `${id} sectionOrder`);
    assert.deepEqual(resolved.vars, expected.vars, `${id} vars`);
  }
});

test("resolveDesign with no design block is frozen to the premium-agency defaults", () => {
  const resolved = resolveDesign(undefined);
  assert.equal(resolved.id, "premium-agency");
  assert.equal(resolved.heroVariant, "full-bleed");
  assert.deepEqual(resolved.sectionOrder, DEFAULT_SECTION_ORDER);
  assert.deepEqual(resolved.vars, {});
});
