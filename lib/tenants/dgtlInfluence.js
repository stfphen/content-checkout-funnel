import { normalizeTenantConfig } from "../defaultTenant.js";

// DGTL Influence Journal — the creator/influencer feature publication.
//
// A standalone tenant (template: "influence-journal") rendered by
// components/influenceJournal/InfluenceJournalPage instead of the shared
// FunnelPage. Lives on its own domain (dgtlinfluence.com) rather than under
// /t/<slug>, same pattern as dgtlGroupTenant on dgtlgroup.io.
//
// Content the funnel template cannot express (the creator roster) lives in
// the top-level `influenceJournal` block, which rides through
// normalize/sanitize untouched — same mechanism the `agency` block on
// dgtlGroupTenant uses. That block is seed-authored only (never public
// input), so components must defensively default when reading it.
//
// Facts policy: every creator entry is either real (verified public
// coverage, captured media) or explicitly marked "in_production" with no
// invented bio/stats. Never publish a status:"live" creator without a
// completed feature build behind it.
export const dgtlInfluenceTenant = normalizeTenantConfig({
  id: "tenant_dgtl_influence",
  slug: "dgtl-influence",
  status: "active",
  template: "influence-journal",
  domains: ["dgtlinfluence.com", "www.dgtlinfluence.com"],
  defaultPackageId: "pro-content-day",
  brand: {
    name: "DGTL Influence Journal",
    eyebrow: "A DGTL Group Publication",
    logoText: "Influence Journal",
    tagline: "The stories behind the creators people follow.",
    logo: "/assets/brand/dgtl-logo.svg",
    primaryColor: "#F0CF50",
    accentColor: "#000000"
  },
  media: {
    heroImage: "",
    heroAlt: "",
    heroVideo: { url: "", kind: "", videoId: "", playlistId: "" }
  },
  // Section content for InfluenceJournalPage. Structured so scaling means
  // "add an entry to creators", not "edit page markup" — the same shape a
  // future admin Tenant Editor screen could drive.
  influenceJournal: {
    hero: {
      eyebrow: "A DGTL Group Publication",
      headline: "The stories behind the",
      headlineAccent: "creators",
      headlineSuffix: "people follow.",
      subhead:
        "The DGTL Influence Journal is a running feature series on the creators, athletes, and talent shaping culture — one profile per creator, built from real coverage and real numbers.",
      primaryCta: { label: "Browse Creators", href: "#creators" },
      secondaryCta: { label: "Full Directory", href: "https://creators.dgtlinfluence.com" }
    },
    statement: {
      text: "Every creator has a story worth",
      accent: "telling right."
    },
    creators: {
      eyebrow: "Featured",
      headline: "Creators in the Journal",
      body:
        "Profiles in progress. Each one is built from verified public coverage, real media, and a feature written to actually rank.",
      // status: "in_production" | "live". Only "live" entries should ever
      // carry a real href/bio — everything else renders as a placeholder
      // card so nothing half-built looks published.
      items: [
        {
          slug: "casper",
          name: "Casper",
          status: "in_production",
          blurb: "Profile assets captured and queued for build. Full feature coming soon.",
          media: "/assets/influence-journal/casper/profile.jpg",
          href: ""
        },
        {
          slug: "shane-boyer",
          name: "Shane Boyer",
          status: "in_production",
          blurb: "Profile in progress. Full feature coming soon.",
          media: "",
          href: ""
        }
      ]
    },
    process: {
      eyebrow: "Process",
      headline: "How a feature gets made",
      body: "Every profile follows the same standard, so the Journal reads as one publication — not a pile of one-offs.",
      steps: [
        {
          title: "Research & capture",
          body: "We pull real posts, coverage, and public numbers straight from the creator's own presence — nothing invented."
        },
        {
          title: "Write & verify",
          body: "A brand-voice feature is written and checked against the sourced material before it ever goes live."
        },
        {
          title: "Publish & distribute",
          body: "The feature goes live on the Journal, is added to the creator directory, and is built to rank for their name."
        }
      ]
    },
    tiein: {
      headline: "Built and run by DGTL Group",
      body:
        "The Influence Journal is produced by the same team behind DGTL's creator and brand campaigns. If you're a creator, manager, or brand looking to get featured — or looking for the team that builds this — start at DGTL Group.",
      cta: { label: "Talk to DGTL", href: "https://dgtlgroup.io/contact" }
    },
    footer: {
      quickLinks: [
        { label: "Creators", href: "#creators" },
        { label: "Directory", href: "https://creators.dgtlinfluence.com" },
        { label: "How It Works", href: "#how" },
        { label: "Get Featured", href: "#pitch" }
      ],
      dgtlLinks: [
        { label: "dgtlgroup.io", href: "https://dgtlgroup.io" },
        { label: "Work", href: "https://dgtlgroup.io/work" },
        { label: "Contact", href: "https://dgtlgroup.io/contact" }
      ]
    }
  }
});
