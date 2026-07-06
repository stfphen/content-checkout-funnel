export const dgtlMagIssue = {
  number: "001",
  season: "Summer 2026",
  title: "The Network Issue",
  eyebrow: "DGTLMAG",
  deck:
    "A living editorial directory for Toronto creators, businesses, venues, brands, and campaigns worth exploring.",
  intro:
    "Open the issue, browse the contents, and move through the network without feeling like you landed on a sales page.",
  coverLines: ["Creator networks", "Local business stories", "Culture-led campaigns", "Quiet offer drops"],
  updated: "July 2026"
};

export const dgtlMagStories = [
  {
    slug: "inside-the-network",
    kind: "story",
    section: "Cover Story",
    title: "Inside the DGTL Network",
    summary:
      "A simple look at how creators, local businesses, venues, and campaigns can live together as one public discovery system.",
    readTime: "4 min read",
    label: "Start here",
    href: "/stories/inside-the-network",
    body: [
      "DGTLMag should feel less like a pitch and more like opening the front page of a living creative network.",
      "The homepage sets the tone with a clear cover, then gives users a table of contents that leads into stories, profiles, drops, and directory views.",
      "The deeper sales infrastructure can still exist underneath, but the public layer should reward curiosity first. Users should want to explore before they ever feel asked to buy."
    ],
    takeaways: ["Lead with discovery", "Use editorial context", "Keep offers quiet until users are interested"]
  },
  {
    slug: "how-a-profile-becomes-media",
    kind: "story",
    section: "Field Note",
    title: "How a Profile Becomes Media",
    summary:
      "Every client, collaborator, creator, or business can become a structured media object with a page, assets, links, and campaign context.",
    readTime: "3 min read",
    label: "Profiles",
    href: "/stories/how-a-profile-becomes-media",
    body: [
      "A profile page is more than a listing. It is a lightweight media kit, a search result, a social card, and a doorway into related stories or offers.",
      "For DGTL, that means one business relationship can turn into reusable assets: a profile, a feature, a short post, an offer drop, and internal lead context.",
      "The important part is keeping the public-facing profile useful even when the backend is running more complex automations."
    ],
    takeaways: ["Profiles should be shareable", "Media assets should be reusable", "The directory becomes a distribution layer"]
  },
  {
    slug: "offer-drops-without-the-hard-sell",
    kind: "story",
    section: "Commerce",
    title: "Offer Drops Without the Hard Sell",
    summary:
      "A better way to introduce services: make offers feel like limited editorial placements, not aggressive checkout pages.",
    readTime: "3 min read",
    label: "Drops",
    href: "/stories/offer-drops-without-the-hard-sell",
    body: [
      "The root experience should not open with prices, packages, or pressure. Those details can live one level deeper as offer drops.",
      "A drop can be framed like a magazine ad page: useful, visual, limited, and contextual to the issue around it.",
      "When someone is ready, the drop can route into the existing checkout funnel, application flow, or booking system."
    ],
    takeaways: ["Keep the homepage editorial", "Make drops contextual", "Send serious users into the funnel later"]
  }
];

export const dgtlMagProfiles = [
  {
    slug: "dgtl-group",
    kind: "profile",
    type: "Agency",
    title: "DGTL Group",
    summary:
      "Creative production, campaign systems, content infrastructure, and digital marketing packaged for modern brands.",
    location: "Toronto / Remote",
    tags: ["Creative", "Marketing", "Production"],
    href: "/profiles/dgtl-group",
    body: [
      "DGTL Group is the operating layer behind DGTLMag: strategy, content systems, production, digital campaigns, and marketing infrastructure.",
      "Inside the magazine interface, DGTL should appear as part of the network instead of taking over the full page with a direct sales pitch."
    ],
    takeaways: ["Production partner", "Campaign builder", "Marketing infrastructure"]
  },
  {
    slug: "dmtv",
    kind: "profile",
    type: "Media Channel",
    title: "DMTV",
    summary:
      "A culture and entertainment channel that can anchor music, nightlife, streetwear, creator, and venue-led features.",
    location: "Toronto",
    tags: ["Culture", "Music", "Media"],
    href: "/profiles/dmtv",
    body: [
      "DMTV fits naturally inside DGTLMag as a media partner, channel profile, and recurring editorial source.",
      "The profile can collect episodes, event recaps, artist features, and collaboration opportunities in one public place."
    ],
    takeaways: ["Culture channel", "Episode hub", "Potential launch partner"]
  },
  {
    slug: "archive-threads",
    kind: "profile",
    type: "Retail / Streetwear",
    title: "Archive Threads",
    summary:
      "Streetwear, resale, and local culture energy that can live as a profile, pop-up listing, or event feature.",
    location: "Toronto",
    tags: ["Streetwear", "Retail", "Pop-up"],
    href: "/profiles/archive-threads",
    body: [
      "Archive Threads is a good example of the type of local brand that can benefit from an editorial profile without immediately needing a hard sales funnel.",
      "A profile could showcase the shop story, visual style, product drops, event participation, and related social content."
    ],
    takeaways: ["Local retail profile", "Pop-up potential", "Visual brand story"]
  },
  {
    slug: "elixr-gallery",
    kind: "profile",
    type: "Artist",
    title: "ELiXR Gallery",
    summary:
      "High-ticket original art positioned through story, environment, placement, and premium collector context.",
    location: "Canada",
    tags: ["Art", "Collector", "Interiors"],
    href: "/profiles/elixr-gallery",
    body: [
      "ELiXR Gallery can be presented as an artist profile first, then connected to a deeper high-ticket art placement funnel for serious collectors or professional spaces.",
      "The magazine format lets the work feel discovered, not pushed."
    ],
    takeaways: ["Artist profile", "Premium placement", "Collector pathway"]
  }
];

export const dgtlMagDrops = [
  {
    slug: "open-profile-intake",
    kind: "drop",
    section: "Open Call",
    title: "Get Listed in the Network",
    summary:
      "A soft intake for creators, businesses, venues, brands, and social pages that want a future DGTLMag profile.",
    label: "Submit",
    href: "/drops/open-profile-intake",
    body: [
      "This drop is not a checkout pitch. It is a simple way for people in the network to raise their hand and be considered for a profile.",
      "The submission can route internally into admin review, lead qualification, outreach, or a future onboarding flow."
    ],
    takeaways: ["Profile request", "Network growth", "Low-pressure entry point"]
  },
  {
    slug: "content-day-feature",
    kind: "drop",
    section: "Behind the Build",
    title: "Content Day Feature Slot",
    summary:
      "A limited editorial-style feature that can lead into the Content Day funnel only after the user asks for details.",
    label: "Feature",
    href: "/drops/content-day-feature",
    body: [
      "This drop introduces Content Day as a feature opportunity rather than opening with a sales package.",
      "The page can show what a business receives in public-facing media terms first, then connect to checkout or booking when appropriate."
    ],
    takeaways: ["Editorial wrapper", "Optional funnel path", "Clear business value"]
  },
  {
    slug: "pop-up-session-callout",
    kind: "drop",
    section: "Activation",
    title: "Pop-up Session Callout",
    summary:
      "A simple callout for brands, artists, vendors, and venues interested in future filmed live-session activations.",
    label: "Activation",
    href: "/drops/pop-up-session-callout",
    body: [
      "This drop can gather interest around future live-session activations without needing to fully sell the event up front.",
      "It works as a bridge between editorial, production, venue partnership, and lead generation."
    ],
    takeaways: ["Event interest", "Partner discovery", "Production opportunity"]
  }
];

export const dgtlMagContents = [
  { number: "01", title: "Cover Story", description: "Start with the idea behind the network.", href: "/stories/inside-the-network" },
  { number: "02", title: "Explore", description: "Browse the latest stories, profiles, and drops.", href: "/explore" },
  { number: "03", title: "Directory", description: "Find creators, businesses, media pages, venues, and brands.", href: "/directory" },
  { number: "04", title: "Profiles", description: "Open individual pages for people and brands in the network.", href: "/profiles" },
  { number: "05", title: "Drops", description: "View quiet opportunities and limited callouts.", href: "/drops" },
  { number: "06", title: "Submit", description: "Suggest a profile, story, or collaboration.", href: "/submit" }
];

export function getExploreItems() {
  return [
    ...dgtlMagStories.map((item) => ({ ...item, eyebrow: item.section || "Story" })),
    ...dgtlMagProfiles.map((item) => ({ ...item, eyebrow: item.type || "Profile" })),
    ...dgtlMagDrops.map((item) => ({ ...item, eyebrow: item.section || "Drop" }))
  ];
}

export function getCollection(type) {
  if (type === "stories") return dgtlMagStories;
  if (type === "profiles" || type === "directory") return dgtlMagProfiles;
  if (type === "drops") return dgtlMagDrops;
  return getExploreItems();
}

export function getContentItem(type, slug) {
  return getCollection(type).find((item) => item.slug === slug) || null;
}
