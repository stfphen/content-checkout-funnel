export const defaultTenant = {
  id: "tenant_dgtlmag",
  slug: "dgtlmag",
  status: "active",
  domains: ["dgtlmag.com", "www.dgtlmag.com", "localhost:8088", "127.0.0.1:8088"],
  defaultPackageId: "pro-content-day",
  brand: {
    name: "Content Day",
    eyebrow: "Content Day",
    logoText: "Content Day",
    primaryColor: "#0071e3",
    accentColor: "#050505"
  },
  media: {
    heroImage: "/assets/content-day-hero.png",
    heroAlt:
      "A premium content production setup with a camera, phone rig, and editing workstation."
  },
  hero: {
    headline: "Get a full month of content filmed in one day.",
    subheadline:
      "We plan, script, shoot, and deliver 20+ short-form videos for your business, so you can focus on running it.",
    primaryCta: "Book Your Content Day",
    secondaryCta: "View Packages",
    stats: [
      { value: "20+", label: "ready-to-post videos" },
      { value: "1", label: "structured shoot day" },
      { value: "30", label: "days of content" }
    ]
  },
  problem: {
    eyebrow: "The Problem",
    headline: "Content should not feel this hard.",
    points: [
      "You do not know what to post.",
      "You do not have time to film.",
      "Your content is inconsistent.",
      "Your competitors are showing up more than you."
    ]
  },
  system: {
    eyebrow: "The System",
    headline: "One day becomes your content pipeline.",
    body:
      "We build the content plan, write the hooks, direct the shoot, and deliver platform-ready assets for Instagram, TikTok, YouTube, ads, and your website.",
    features: [
      {
        title: "Strategy",
        body: "Offer angles, content pillars, hooks, and a shot list mapped to your goals."
      },
      {
        title: "Shoot",
        body: "Professional or UGC-style production with direction on camera."
      },
      {
        title: "Delivery",
        body: "Edited short-form videos formatted for the channels you actually use."
      }
    ]
  },
  process: {
    eyebrow: "How It Works",
    headline: "Simple. Structured. Done for you.",
    steps: [
      { title: "Strategy Call", body: "We map your offer, customer, channel priorities, and content goals." },
      { title: "Pre-Production", body: "Hooks, scripting, shot list, creative direction, and shoot plan." },
      { title: "Shoot Day", body: "We film everything in one efficient session with clear direction." },
      { title: "Delivery", body: "Your content is edited, formatted, and delivered ready to post." }
    ]
  },
  output: {
    eyebrow: "Output",
    headline: "What your content can look like.",
    body:
      "A balanced mix of education, proof, personality, product or service highlights, behind-the-scenes, trend formats, and ad-ready clips.",
    tiles: ["TALKING HEAD", "UGC", "BTS", "PRODUCT", "EDUCATION", "ADS", "PROOF", "TRENDS", "OFFERS"]
  },
  packageSection: {
    eyebrow: "Packages",
    headline: "Choose your content system.",
    body:
      "Start with the package that fits your current content gap. Larger campaigns, activations, influencer partnerships, and production builds can be quoted after qualification."
  },
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
      cta: "Select UGC",
      description: "12-20 native-feeling short-form videos for brands that need fast content volume.",
      features: ["12-20 short-form videos", "iPhone or creator-style footage", "Fast turnaround", "Platform-ready formatting"]
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
      cta: "Reserve Content Day",
      featured: true,
      description:
        "20+ videos from one structured shoot day, including strategy, hooks, scripting, production, and edits.",
      features: ["20+ short-form videos", "Strategy, hooks, and scripting", "Professional camera production", "Direction on shoot day"]
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
      cta: "Apply for Retainer",
      description:
        "Monthly shoot days, ongoing strategy, and a scalable content system for consistent publishing.",
      features: ["30-60 videos monthly", "Ongoing strategy", "Monthly shoot days", "Scalable content system"]
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
      cta: "Scope a Campaign",
      description:
        "Higher-ticket production, activations, influencer collaborations, placements, software-backed campaigns, and partner services.",
      features: ["Production strategy", "Creator and influencer options", "Interactive campaign options", "Partner service routing"]
    }
  ],
  enterprise: {
    eyebrow: "Higher Ticket",
    headline: "Campaigns, productions, placements, and interactive builds.",
    body:
      "For brands with larger budgets, we can scope campaign production, activations, influencer collaborations, creator distribution, software-backed campaigns, NFC product experiences, and partner-led media opportunities.",
    cta: "Scope a Campaign",
    packageId: "campaign-scope"
  },
  checkout: {
    eyebrow: "Checkout",
    headline: "Reserve your content system.",
    body:
      "Select a package, share your business details, and continue to secure checkout or booking. Stripe Payment Links, booking links, and lead routing are controlled by the admin dashboard.",
    submitCta: "Continue",
    disclaimer: "No payment is processed until live Stripe links are added."
  },
  faq: {
    eyebrow: "Questions",
    headline: "You do not need to be good at content.",
    items: [
      { question: "I do not know what to say.", answer: "We script and structure the content before filming." },
      { question: "I do not have time.", answer: "The shoot is planned around one efficient production day." },
      {
        question: "I am not comfortable on camera.",
        answer: "We direct you through each clip and can mix in product, service, or UGC-style content."
      }
    ]
  },
  finalCta: {
    eyebrow: "Ready",
    headline: "Stop overthinking content.",
    body: "Let us build your content system in one day.",
    cta: "Book Your Content Day"
  },
  mobileCta: {
    primary: "Book Content Day",
    secondary: "Packages"
  },
  routing: {
    leadWebhookUrl: "",
    replyToEmail: "",
    phoneNumber: "",
    phoneNotes: "",
    senderDomain: ""
  },
  contractorSettings: {
    serviceAreas: ["Toronto", "GTA", "Kitchener", "Barrie", "Newmarket", "Bradford"],
    defaultCapacityNotes: "Track available shoot days, contractor margins, and partner assignment here."
  }
};

export function normalizeTenantConfig(config) {
  return {
    ...defaultTenant,
    ...config,
    brand: { ...defaultTenant.brand, ...(config?.brand || {}) },
    media: { ...defaultTenant.media, ...(config?.media || {}) },
    hero: { ...defaultTenant.hero, ...(config?.hero || {}) },
    problem: { ...defaultTenant.problem, ...(config?.problem || {}) },
    system: { ...defaultTenant.system, ...(config?.system || {}) },
    process: { ...defaultTenant.process, ...(config?.process || {}) },
    output: { ...defaultTenant.output, ...(config?.output || {}) },
    packageSection: { ...defaultTenant.packageSection, ...(config?.packageSection || {}) },
    enterprise: { ...defaultTenant.enterprise, ...(config?.enterprise || {}) },
    checkout: { ...defaultTenant.checkout, ...(config?.checkout || {}) },
    faq: { ...defaultTenant.faq, ...(config?.faq || {}) },
    finalCta: { ...defaultTenant.finalCta, ...(config?.finalCta || {}) },
    mobileCta: { ...defaultTenant.mobileCta, ...(config?.mobileCta || {}) },
    routing: { ...defaultTenant.routing, ...(config?.routing || {}) },
    contractorSettings: {
      ...defaultTenant.contractorSettings,
      ...(config?.contractorSettings || {})
    },
    packages: config?.packages?.length ? config.packages : defaultTenant.packages
  };
}
