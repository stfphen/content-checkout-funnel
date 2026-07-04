import { normalizeTenantConfig } from "../defaultTenant.js";

// DGTL Group — the agency's own brand page (template: "agency").
//
// A standalone tenant for the agency that owns this platform, rendered by
// components/agency/AgencyPage instead of the shared FunnelPage. Section
// content the funnel template cannot express (results wall, white-label
// roster, platform pipeline, funding band, team tracks) lives in the
// top-level `agency` block, which rides through normalize/sanitize untouched
// (same contract as the dmtv-studio `showcase` block). Seed-authored only;
// components read it defensively.
//
// Facts policy: every stat, client name, and price on this page is verified
// either in this repo (Content Day ladder in lib/defaultTenant.js, funding
// packages in lib/funding/tenant.js, roster stats in lib/tenants/*) or on
// dgtlgroup.io as fetched 2026-07-03. No founder name is printed anywhere:
// public sources and internal anchors disagree, pending team confirmation.
export const dgtlGroupTenant = normalizeTenantConfig({
  id: "tenant_dgtl_group",
  slug: "dgtl-group",
  status: "active",
  template: "agency",
  // The agency's corporate domain. No collision with any sibling tenant
  // (dgtlmag.com and subdomains, on-homedecor.com).
  domains: ["dgtlgroup.io", "www.dgtlgroup.io"],
  defaultPackageId: "pro-content-day",
  brand: {
    name: "DGTL Group",
    eyebrow: "Growth + Creative Agency",
    logoText: "DGTL",
    tagline: "Toronto growth and creative agency.",
    logo: "/assets/brand/dgtl-logo.svg",
    primaryColor: "#F0CF50",
    accentColor: "#0a0a0b"
  },
  media: {
    // DGTL's own production still (the Content Day hero asset) until the team
    // supplies dedicated agency imagery. Flagged in the delivery open items.
    heroImage: "/assets/content-day-hero.png",
    heroAlt: "A DGTL Studio production day in downtown Toronto.",
    heroVideo: { url: "", kind: "", videoId: "", playlistId: "" }
  },
  hero: {
    headline: "Growth systems and cinematic content, built in Toronto.",
    subheadline:
      "A full digital marketing studio paired with high-impact production, for artists, brands, and growing businesses.",
    primaryCta: "Start a project",
    secondaryCta: "See the offers",
    stats: [
      { value: "75+", label: "campaigns since 2022" },
      { value: "$1M+", label: "direct client revenue" },
      { value: "9-figure", label: "organic impressions" }
    ]
  },
  packageSection: {
    eyebrow: "",
    headline: "Productized offers.",
    body:
      "Content Day is the entry point: one structured shoot day that fills a month of publishing. Campaign Scope carries the high end."
  },
  // The Content Day ladder, mirrored from lib/defaultTenant.js. This page
  // converts through the project form, so pro-content-day carries no stripe
  // block here (the dgtlmag funnel keeps live checkout).
  packages: [
    {
      id: "ugc-content",
      name: "UGC Content",
      summary: "Fast, native-feeling content for brands that need volume.",
      price: "$1,500",
      priceQualifier: "/ month",
      priceDisplay: "$1,500/month",
      altPrice: "$500 weekly option",
      action: "checkout",
      paymentLink: "",
      bookingLink: "",
      cta: "Start a project",
      description:
        "12-20 native-feeling short-form videos for brands that need fast content volume.",
      features: [
        "12-20 short-form videos",
        "iPhone or creator-style footage",
        "Fast turnaround",
        "Platform-ready formatting"
      ]
    },
    {
      id: "pro-content-day",
      name: "Pro Content Day",
      summary: "The core offer: one planned shoot day, a full month of content.",
      price: "$2,500",
      priceQualifier: "one time",
      priceDisplay: "$2,500",
      altPrice: "Most businesses start here",
      action: "checkout",
      paymentLink: "",
      bookingLink: "",
      cta: "Start a project",
      featured: true,
      description:
        "20+ videos from one structured shoot day, including strategy, hooks, scripting, production, and edits.",
      features: [
        "20+ short-form videos",
        "Strategy, hooks, and scripting",
        "Professional camera production",
        "Direction on shoot day"
      ]
    },
    {
      id: "growth-retainer",
      name: "Growth Retainer",
      summary: "Ongoing content infrastructure for teams that want consistency.",
      price: "$3,500+",
      priceQualifier: "/ month",
      priceDisplay: "$3,500-$5,000/month",
      altPrice: "Custom monthly scope",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Start a project",
      description:
        "Monthly shoot days, ongoing strategy, and a scalable content system for consistent publishing.",
      features: [
        "30-60 videos monthly",
        "Ongoing strategy",
        "Monthly shoot days",
        "Scalable content system"
      ]
    },
    {
      id: "campaign-scope",
      name: "Campaign Scope",
      summary: "Higher-ticket production, placements, software, and partner-led media campaigns.",
      price: "Custom",
      priceQualifier: "",
      priceDisplay: "Custom",
      altPrice: "Qualified project scope",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Start a project",
      description:
        "Higher-ticket production, activations, influencer collaborations, placements, software-backed campaigns, and partner services.",
      features: [
        "Production strategy",
        "Creator and influencer options",
        "Interactive campaign options",
        "Partner service routing"
      ]
    }
  ],
  checkout: {
    eyebrow: "",
    headline: "Start a project.",
    body:
      "Tell us what you are building and which offer fits. The team scopes it and comes back with a plan and timeline.",
    submitCta: "Start a project",
    disclaimer: "No payment is taken on this page. Scoping first, then a proposal."
  },
  // Explicit: the funnel-template cross-sell block stays off. The agency
  // template has its own funding band (agency.funding below).
  fundingPromo: { enabled: false },
  faq: {
    eyebrow: "",
    headline: "Questions, answered.",
    items: [
      {
        question: "How do engagements start?",
        answer:
          "Most clients start with a Pro Content Day or a scoped campaign. You submit the project form, we review fit, and you get a plan with scope, timeline, and price before anything is billed."
      },
      {
        question: "How fast can we start?",
        answer:
          "Content Day shoots typically book within two to three weeks. Larger campaigns and white-label builds get a timeline in the proposal."
      },
      {
        question: "How does pricing work?",
        answer:
          "The productized offers carry listed prices: UGC Content at $1,500 per month, Pro Content Day at $2,500, and the Growth Retainer from $3,500 per month. Campaigns and white-label engagements are scoped custom."
      },
      {
        question: "Do you guarantee funding?",
        answer:
          "No. Eligibility and approval depend on the specific program, timing, and business evidence. The free Funding Fit Scan screens for signals only and does not guarantee program eligibility or funding approval."
      },
      {
        question: "What does white-label mean?",
        answer:
          "Your brand stays front-facing while DGTL runs the page, outreach, lead filtering, sales ops, and production behind it. DMTV, ELiXR Gallery, and ON Home Decor run on this model today."
      },
      {
        question: "Where do you work?",
        answer:
          "Production runs out of DGTL Studio in downtown Toronto, serving the GTA, Kitchener, Barrie, Newmarket, and Bradford. Strategy and campaign work runs remotely, with offices cited in Toronto, Paris, and Bali."
      }
    ]
  },
  contractorSettings: {
    serviceAreas: ["Toronto", "GTA", "Kitchener", "Barrie", "Newmarket", "Bradford"],
    defaultCapacityNotes:
      "Track agency projects, white-label builds, funding scans, and team applications here."
  },

  // ---------------------------------------------------------------------------
  // Agency-template content. Read with defensive defaults in components
  // (tenant.agency?.x) — this block is not walked by tenant sanitization.
  // ---------------------------------------------------------------------------
  agency: {
    // Typographic chips + quantified case tiles. No logo images and no
    // invented metrics: names and numbers verified on dgtlgroup.io
    // (2026-07-03) or in sibling tenant configs.
    results: {
      eyebrow: "",
      headline: "Selected work and results.",
      body:
        "Artist coverage, global brand campaigns, and organic growth systems, produced by the DGTL Studio team.",
      artists: [
        "Swae Lee",
        "Lil Tjay",
        "A Boogie wit da Hoodie",
        "Lil Tecca",
        "Central Cee",
        "Killy"
      ],
      brands: [
        "Canon",
        "DJI",
        "Epidemic Sound",
        "PolarPro",
        "On Running",
        "Anker",
        "Walmart",
        "GameStop"
      ],
      caseStudies: [
        {
          name: "Guild's Garage",
          blurb: "Organic social growth in under six months.",
          metrics: [
            { value: "150K+", label: "organic followers" },
            { value: "22M+", label: "impressions" }
          ]
        },
        {
          name: "Epidemic Sound",
          blurb: "Creator-led short-form system on TikTok, plus a cinematic film on city soundscapes.",
          metrics: [{ value: "12M+", label: "views" }]
        },
        {
          name: "DMTV",
          blurb: "Toronto music media network, run end to end on the DGTL platform.",
          metrics: [
            { value: "3M+", label: "series views" },
            { value: "110K", label: "monthly reach" }
          ]
        }
      ]
    },
    // The section no competitor can copy: live brands DGTL operates.
    funnels: {
      eyebrow: "White-Label",
      headline: "Brand funnels we run.",
      body:
        "DGTL builds and operates the page, outreach, lead filtering, sales ops, and production while the client's brand stays front-facing. These are live today.",
      items: [
        {
          name: "DMTV",
          tag: "Music media network",
          ladder: "$300 feature to $25K+ campaigns",
          blurb:
            "Features, music videos, live shows, and brand campaigns from inside Toronto music culture. 3M+ series views, 110K monthly reach.",
          href: "/t/dmtv-studio"
        },
        {
          name: "ELiXR Gallery",
          tag: "Original art",
          ladder: "$2,500 to $10,000+",
          blurb:
            "High-ticket original statement pieces, custom commissions, and professional space curation for collectors and designers.",
          href: "/t/elixr"
        },
        {
          name: "ON Home Decor",
          tag: "Interior design",
          ladder: "$200 entry to $50K transformations",
          blurb:
            "A curated paint-selection offer that ladders into full home transformation projects.",
          href: "/t/on-home-decor"
        }
      ],
      cta: {
        headline: "Want this for your brand?",
        body:
          "One engagement covers the funnel page, the pipeline behind it, and the production that feeds it.",
        label: "Run your brand on our stack"
      },
      form: { submitCta: "Run your brand on our stack" }
    },
    // The operating system behind every engagement (brain/20-Modules).
    platform: {
      eyebrow: "",
      headline: "The Growth Platform.",
      body:
        "Every engagement runs on the system DGTL built: Next.js and Postgres, with Claude AI working every stage.",
      steps: [
        {
          title: "Lead pipeline",
          body: "Every prospect captured, scored, and deduplicated in one place."
        },
        {
          title: "Prospecting and batch builder",
          body: "Targeted lists imported and qualified at volume."
        },
        {
          title: "Enrichment and AI research",
          body: "Website, social, and market signals compiled into a sales brief."
        },
        {
          title: "Human-approved outreach",
          body: "Personalized sequences reviewed by a person before anything sends."
        },
        {
          title: "Telephony",
          body: "Calls recorded and transcribed, with AI summaries on every conversation."
        },
        {
          title: "Stripe checkout",
          body: "Productized offers sold directly from the funnel page."
        },
        {
          title: "Funding engine",
          body: "Growth projects screened against Canadian funding lanes."
        }
      ]
    },
    // Cross-sell to the Funded Growth Studio. Compliance framing mirrors
    // lib/funding/tenant.js verbatim: no eligibility or approval guarantees.
    funding: {
      eyebrow: "Funded Growth",
      headline: "Could funding help pay for your next growth project?",
      body:
        "The Funded Growth Studio screens projects across eight Canadian funding lanes, starting with a free Funding Fit Scan.",
      cta: "Check funding fit",
      link: "/t/funded-growth",
      linkLabel: "Visit the Funded Growth Studio",
      disclaimer: "This scan does not guarantee program eligibility or funding approval.",
      form: { submitCta: "Check funding fit" }
    },
    about: {
      eyebrow: "",
      headline: "About DGTL.",
      paragraphs: [
        "DGTL Group is a results-driven growth and creative agency based in Toronto, combining a full-service digital marketing studio with high-impact content production. The production hub, DGTL Studio, sits in downtown Toronto; the company operates as DGTL Group Holdings Limited with offices cited in Toronto, Paris, and Bali.",
        "Since 2022 the team has shipped campaigns and projects for artists, global brands, and local businesses, from concert coverage and product launches to full growth systems that the agency runs end to end."
      ],
      locations: ["Toronto", "Paris", "Bali"],
      studio: "DGTL Studio, downtown Toronto",
      stats: [
        { value: "2022", label: "building since" },
        { value: "3", label: "cities" },
        { value: "1", label: "studio, downtown Toronto" }
      ]
    },
    start: {
      headline: "Start a project.",
      body:
        "Tell us what you are building and which offer fits. The team scopes it and comes back with a plan and timeline."
    },
    team: {
      eyebrow: "Join DGTL",
      headline: "Build with the team.",
      body:
        "Senior, hands-on teams: the people in the kickoff meeting do the work. Pick your lane.",
      tracks: [
        {
          id: "production",
          label: "Production",
          blurb: "Shooters, editors, producers, and designers for shoots, campaigns, and brand work."
        },
        {
          id: "strategy",
          label: "Strategy",
          blurb: "Growth, paid media, and campaign strategists who own outcomes, not decks."
        },
        {
          id: "sales",
          label: "Sales",
          blurb: "Bring brands and businesses into the network. Relationship-driven, pipeline-backed."
        }
      ],
      form: { headline: "Apply to DGTL.", submitCta: "Apply to DGTL" }
    },
    footer: {
      blurb: "Toronto growth and creative agency. DGTL Group Holdings Limited.",
      links: [
        { label: "dgtlgroup.io", url: "https://dgtlgroup.io" },
        { label: "Instagram", url: "https://www.instagram.com/dgtlgroup.io" },
        { label: "LinkedIn", url: "https://www.linkedin.com/company/dgtlgroup" },
        { label: "dgtl.bio", url: "https://dgtl.bio" }
      ]
    }
  }
});
