import { normalizeTenantConfig } from "../defaultTenant.js";

// ON Home Decor — Toronto / GTA interior design, curated paint selection,
// styling, and full-home renovation planning. Led by designer Elena.
//
// Migrated from the standalone Lovable site (twistedrc1017/on-home-decor-ddemo)
// into the Content Checkout Funnel tenant architecture. The funnel is built
// around a low-friction paid entry offer — Curated Paint Selection at $200 per
// colour — that ladders up into room styling, renovation design direction, and
// a signature full-home transformation. Warm-luxury palette: taupe + blush.
//
// No hospitality / accommodation language is carried over; this is an interior
// design, paint, decor, styling, and renovation business.
export const onHomeDecorTenant = normalizeTenantConfig({
  id: "tenant_on_home_decor",
  slug: "on-home-decor",
  status: "active",
  domains: [
    "on-homedecor.com",
    "www.on-homedecor.com"
  ],
  defaultPackageId: "curated-paint-selection",
  // Bespoke gallery-first template (components/interiors/). The design block
  // stays populated so the funnel fallback and admin tooling keep rendering a
  // correct warm-boutique page if the template id ever fails to resolve.
  template: "interiors",
  design: {
    direction: "warm-boutique",
    verticalPreset: "local-trades-retail"
  },
  // Content the funnel schema has no fields for; read defensively by the
  // interiors template (this block is not walked by sanitizeTenantConfig).
  // Media population happens in the media commit: real portfolio photography
  // only, committed under public/assets/on-home-decor/.
  interiors: {
    nav: {
      links: [
        { href: "#packages", label: "Packages" },
        { href: "#gallery", label: "Projects" },
        { href: "#process", label: "Process" },
        { href: "#faq", label: "FAQ" }
      ]
    },
    hero: {
      headline: "Rooms that finally feel like you.",
      subheadline:
        "Designer-led paint selection, room styling, and renovation planning for Toronto and GTA homes.",
      image: "/assets/on-home-decor/hero.webp",
      imageAlt:
        "Open living space with walnut-panelled walls, frosted-glass partitions, and a soft grey sofa in warm evening light.",
      primaryCta: {
        label: "Book Your Paint Consultation",
        packageId: "curated-paint-selection"
      },
      secondaryCta: { label: "See Our Projects", target: "#gallery" }
    },
    ladder: {
      eyebrow: "Design Packages",
      headline: "Start with one colour. Grow into a full transformation.",
      body:
        "Every project begins the same way: one curated paint colour for $200. From there, the ladder climbs as far as your home needs.",
      footnote:
        "Renovation and full-home scopes are confirmed after a short consultation. Pricing reflects typical Toronto and GTA projects."
    },
    gallery: {
      headline: "Recent projects across the GTA.",
      body:
        "Real client spaces: the colours we chose, and how the rooms changed.",
      projects: [
        {
          id: "warm-walnut-condo",
          title: "Warm Walnut Condo",
          location: "Residential",
          summary:
            "A compact condo warmed up room by room: walnut feature walls, a concrete-texture accent with mirror details, and soft lighting throughout.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/house-007/dining.webp",
              alt: "Dining nook with black metal chairs, a glass table, and framed prints on a white brick-texture wall",
              caption: "Dining nook"
            },
            {
              src: "/assets/on-home-decor/projects/house-007/kitchen.webp",
              alt: "Narrow white kitchen with walnut floor and wall panels and a snowy garden window",
              caption: "Galley kitchen"
            },
            {
              src: "/assets/on-home-decor/projects/house-007/living.webp",
              alt: "Living room with a grey sofa, charcoal rug, and a low black media unit against a walnut wall",
              caption: "Living room"
            },
            {
              src: "/assets/on-home-decor/projects/house-007/feature-wall.webp",
              alt: "Concrete-texture feature wall with hexagonal mirrors, a floating black console, and sheer violet curtains",
              caption: "Feature wall"
            },
            {
              src: "/assets/on-home-decor/projects/house-007/bedroom.webp",
              alt: "Bedroom with a plum duvet, oak bed frame, and sheer violet curtains",
              caption: "Bedroom"
            },
            {
              src: "/assets/on-home-decor/projects/house-007/bath.webp",
              alt: "Bathroom vanity with a walnut counter, wide mirror, and warm downlighting",
              caption: "Bath"
            }
          ]
        },
        {
          id: "basement-suite-renovation",
          title: "Basement Suite Renovation",
          location: "Residential",
          summary:
            "A full lower-level build-out: new white kitchen with butcher-block counters and matte-black hardware, plus a fresh three-piece bath.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/house-006/bath-tub.webp",
              alt: "New bathroom with a white tub, subway-tile surround, and matte-black rain shower",
              caption: "Three-piece bath"
            },
            {
              src: "/assets/on-home-decor/projects/house-006/bath-vanity.webp",
              alt: "Floating white vanity with a matte-black faucet, round mirror, and towel bar",
              caption: "Floating vanity"
            }
          ],
          beforeAfter: [
            {
              initial: 78,
              before: {
                src: "/assets/on-home-decor/projects/house-006/kitchen-before.webp",
                alt: "Kitchen mid-renovation with exposed wiring, unfinished walls, and appliances staged in place"
              },
              after: {
                src: "/assets/on-home-decor/projects/house-006/kitchen-after.webp",
                alt: "Finished white kitchen with butcher-block counters, full backsplash, and integrated dishwasher"
              },
              caption: "The suite kitchen, mid-build and finished. Drag to compare."
            }
          ]
        },
        {
          id: "glass-partition-apartment",
          title: "Glass Partition Apartment",
          location: "Residential",
          summary:
            "An open plan kept flexible with frosted-glass sliding partitions, walnut panels over pale floors, and a soft grey-on-grey palette.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/house-009/living.webp",
              alt: "Open living space with a grey sofa, white slipcovered chair, and frosted-glass partition walls",
              caption: "Living space"
            },
            {
              src: "/assets/on-home-decor/projects/house-009/partition.webp",
              alt: "Frosted-glass sliding partition beside a walnut-panelled hallway",
              caption: "Sliding partition"
            },
            {
              src: "/assets/on-home-decor/projects/house-009/bedroom.webp",
              alt: "Bedroom with a walnut headboard wall, checkered quilt, and pendant reading lights",
              caption: "Bedroom"
            },
            {
              src: "/assets/on-home-decor/projects/house-009/kitchen.webp",
              alt: "Compact kitchen with dark gloss cabinets, white uppers, and a walnut feature wall",
              caption: "Kitchen"
            },
            {
              src: "/assets/on-home-decor/projects/house-009/bath.webp",
              alt: "Bathroom counter in dark wood with a white vessel sink and pebble-lined ledge",
              caption: "Bath"
            },
            {
              src: "/assets/on-home-decor/projects/house-009/dining.webp",
              alt: "Dining corner with a glass table, black metal chairs, and a white pendant lamp",
              caption: "Dining corner"
            }
          ]
        },
        {
          id: "spa-bath-suite",
          title: "Spa-Inspired Bath & Suite",
          location: "Residential",
          summary:
            "A dark, calming retreat: walnut and concrete-texture surfaces, underlit floating counters, and a glass shower cabin.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/house-005/bath-vanity.webp",
              alt: "Floating walnut vanity with a white vessel sink, underlit counter, and full-width mirror",
              caption: "Underlit vanity"
            },
            {
              src: "/assets/on-home-decor/projects/house-005/shower.webp",
              alt: "Glass shower cabin set into a walnut-panelled bathroom",
              caption: "Shower cabin"
            },
            {
              src: "/assets/on-home-decor/projects/house-005/lounge.webp",
              alt: "Lounge with a grey sofa, concrete-texture wall, wall-mounted TV, and soft rug",
              caption: "Suite lounge"
            },
            {
              src: "/assets/on-home-decor/projects/house-005/kitchen.webp",
              alt: "Compact kitchen with glossy white uppers and walnut wall panelling",
              caption: "Kitchenette"
            }
          ]
        },
        {
          id: "walnut-white-brick-suite",
          title: "Walnut & White Brick Suite",
          location: "Residential",
          summary:
            "A compact suite warmed with walnut planks against white brick texture, black metal accents, and low evening lighting.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/project-001/lounge.webp",
              alt: "Lounge with a grey sofa, plum cushions, white coffee table, and framed prints on white brick",
              caption: "Lounge"
            },
            {
              src: "/assets/on-home-decor/projects/project-001/kitchen.webp",
              alt: "Galley kitchen with white gloss cabinets running toward a walnut-clad living area",
              caption: "Galley kitchen"
            },
            {
              src: "/assets/on-home-decor/projects/project-001/dining.webp",
              alt: "Glass dining table with black metal chairs against a white brick wall and wine rack",
              caption: "Dining"
            },
            {
              src: "/assets/on-home-decor/projects/project-001/feature-wall.webp",
              alt: "Concrete-texture wall with three framed botanical prints above a black floating console",
              caption: "Feature wall"
            }
          ]
        },
        {
          id: "black-bath-laundry",
          title: "Black Bath & Laundry",
          location: "Residential",
          summary:
            "A small room taken seriously: matte-black walls and floor tile, a lit display niche, mosaic backsplash, and caged sconces over the vanity.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/bathroom-002/vanity.webp",
              alt: "Black bathroom with a glass vessel sink, mosaic backsplash, caged sconce lights, and a washer under the counter",
              caption: "Vanity and laundry"
            },
            {
              src: "/assets/on-home-decor/projects/bathroom-002/niche-wall.webp",
              alt: "Matte-black wall with a lit display niche and steel panel details",
              caption: "Display niche"
            }
          ]
        },
        {
          id: "cafe-repaint",
          title: "Café Repaint",
          location: "Commercial",
          summary:
            "One colour, one evening: a patched feature wall becomes a deep-green backdrop that ties the room to its gallery wall and greenery.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/coffee-shop/room.webp",
              alt: "Café corner with deep-green walls, a gallery of framed prints, tan leather banquette, and an indoor tree",
              caption: "The finished room"
            }
          ],
          beforeAfter: [
            {
              before: {
                src: "/assets/on-home-decor/projects/coffee-shop/wall-before.webp",
                alt: "Café wall patched and primed before painting, with tables pushed aside"
              },
              after: {
                src: "/assets/on-home-decor/projects/coffee-shop/wall-after.webp",
                alt: "The same café wall finished in deep green with tables and place settings restored"
              },
              caption: "The feature wall, before and after one colour. Drag to compare."
            }
          ]
        },
        {
          id: "timber-frame-restaurant",
          title: "Timber-Frame Restaurant",
          location: "Commercial",
          summary:
            "A full dining room direction: sage walls against original timber, hand-blown glass pendants, moss feature panels, and a lit staircase.",
          rooms: [
            {
              src: "/assets/on-home-decor/projects/restaurant/dining-room.webp",
              alt: "Timber-frame dining room with glass pendant lights, sage walls, and olive upholstered chairs",
              caption: "Main dining room"
            },
            {
              src: "/assets/on-home-decor/projects/restaurant/dining-corner.webp",
              alt: "Round dining tables beneath exposed beams and a slatted ceiling",
              caption: "Window corner"
            },
            {
              src: "/assets/on-home-decor/projects/restaurant/bar.webp",
              alt: "Timber bar with green upholstered stools and pendant lighting",
              caption: "Bar"
            },
            {
              src: "/assets/on-home-decor/projects/restaurant/stair.webp",
              alt: "Staircase with underlit timber treads and white plank walls",
              caption: "Lit staircase"
            },
            {
              src: "/assets/on-home-decor/projects/restaurant/lounge-moss.webp",
              alt: "Lounge corner with preserved-moss wall panels and two green armchairs",
              caption: "Moss lounge"
            }
          ]
        }
      ]
    },
    processIntro: {
      headline: "Simple. Personal. Designer-led."
    },
    serviceArea: {
      headline: "Serving Toronto and the GTA.",
      note:
        "Based in Toronto. Photo-based paint and styling guidance can often travel further; just ask."
    },
    booking: {
      headline: "Tell us about your space.",
      body:
        "Book the $200 Curated Paint Selection, or tell us about a larger project. Elena reads every note personally.",
      consultationCta: "Book Your Paint Consultation",
      inquiryCta: "Start a Project Inquiry",
      consultationNote:
        "Curated Paint Selection, $200 per colour. Share your details and we will confirm your consultation; payment is only collected once live checkout is enabled.",
      inquiryNote:
        "For room styling, kitchen and bath direction, and full-home projects. We reply with a scope, a timeline, and a price.",
      successMessage: "Received. Elena will be in touch within one business day.",
      checkoutCapturedMessage:
        "Your consultation request is in. Elena will confirm details and payment by email."
    },
    footer: {
      blurb:
        "Toronto interior design studio. Curated paint selection, room styling, and renovation design direction."
    }
  },
  brand: {
    name: "ON Home Decor",
    eyebrow: "Toronto Interior Design & Paint Consultation",
    logoText: "ON Home Decor",
    tagline: "Start with one colour.",
    logo: "",
    appIcon: "",
    primaryColor: "#8B7A5E",
    accentColor: "#C9A9A6"
  },
  media: {
    heroImage: "/assets/on-home-decor/hero.webp",
    heroAlt:
      "Open living space with walnut-panelled walls, frosted-glass partitions, and a soft grey sofa in warm evening light."
  },
  hero: {
    headline: "Choose the perfect paint colour for your home, with a designer's eye.",
    subheadline:
      "ON Home Decor helps Toronto homeowners create warmer, more cohesive, beautifully designed spaces through curated paint selections, room styling, and full-service interior design.",
    primaryCta: "Book Your Paint Consultation",
    secondaryCta: "Explore Design Packages",
    stats: [
      { value: "$200", label: "per curated colour" },
      { value: "1", label: "room to start" },
      { value: "GTA", label: "Toronto & area" }
    ]
  },
  problem: {
    eyebrow: "The Problem",
    headline: "Choosing paint is harder than it looks.",
    points: [
      "Undertones shift the moment they hit your walls.",
      "Lighting changes the colour throughout the day.",
      "Flooring, trim, and furniture can clash with the wrong shade.",
      "A wrong choice wastes time, money, and a weekend repainting."
    ]
  },
  system: {
    eyebrow: "The Approach",
    headline: "A designer-approved colour you can feel confident about.",
    body:
      "Choosing the right paint colour should not feel like a gamble. Elena reviews your lighting, furniture, flooring, trim, and how you actually want the room to feel, then curates a colour that works in your real space, not just on a screen.",
    features: [
      {
        title: "Read the room",
        body: "Natural and artificial light, existing finishes, flooring, trim, and decor are all reviewed together."
      },
      {
        title: "Curate the colour",
        body: "A designer-approved paint selection with finish, sheen, and complementary accent or trim guidance."
      },
      {
        title: "Explain the why",
        body: "You learn why the colour works and the mood it creates, so you can move forward without second-guessing."
      }
    ]
  },
  process: {
    eyebrow: "How It Works",
    headline: "Simple. Personal. Designer-led.",
    steps: [
      {
        title: "Book your consultation",
        body: "Reserve your Curated Paint Selection and tell us about the space."
      },
      {
        title: "Share your space",
        body: "Send photos, room goals, lighting, existing finishes, and any inspiration."
      },
      {
        title: "Elena curates the colour",
        body: "She reviews your space and selects a designer-approved paint recommendation."
      },
      {
        title: "Receive your direction",
        body: "You get a clear colour selection, finish guidance, and confident next steps."
      }
    ]
  },
  output: {
    eyebrow: "Where We Help",
    headline: "From one room to a full home.",
    body:
      "Whether you are refreshing a single wall or planning a whole-home renovation, we bring a designer's eye to the decisions that make a space feel intentional.",
    tiles: [
      "PAINT REFRESH",
      "CONDO MAKEOVER",
      "PRE-SALE REFRESH",
      "RENOVATION PLANNING",
      "KITCHEN & BATH",
      "TRIM & CABINETS",
      "ROOM STYLING",
      "COMMERCIAL SPACES",
      "FULL HOME"
    ]
  },
  // Funnel-fallback portfolio: the same real project photography the interiors
  // gallery uses, in the flat funnel schema so the fallback path shows work too.
  portfolio: {
    eyebrow: "",
    headline: "Recent projects across the GTA.",
    body: "Real client spaces: the colours we chose, and how the rooms changed.",
    items: [
      {
        id: "warm-walnut-condo-living",
        title: "Warm Walnut Condo",
        caption: "Living room with walnut feature wall and layered soft textures.",
        mediaType: "image",
        src: "/assets/on-home-decor/projects/house-007/living.webp",
        alt: "Living room with a grey sofa, charcoal rug, and a low black media unit against a walnut wall",
        tags: { industry: ["residential"], format: ["room-styling"] }
      },
      {
        id: "basement-suite-kitchen",
        title: "Basement Suite Renovation",
        caption: "New white kitchen with butcher-block counters and matte-black hardware.",
        mediaType: "image",
        src: "/assets/on-home-decor/projects/house-006/kitchen-after.webp",
        alt: "Finished white kitchen with butcher-block counters, full backsplash, and integrated dishwasher",
        tags: { industry: ["residential"], format: ["renovation"] }
      },
      {
        id: "spa-bath-vanity",
        title: "Spa-Inspired Bath",
        caption: "Floating walnut vanity with underlit counter and vessel sink.",
        mediaType: "image",
        src: "/assets/on-home-decor/projects/house-005/bath-vanity.webp",
        alt: "Floating walnut vanity with a white vessel sink, underlit counter, and full-width mirror",
        tags: { industry: ["residential"], format: ["kitchen-bath"] }
      },
      {
        id: "cafe-repaint-room",
        title: "Café Repaint",
        caption: "One deep-green colour transformed the whole room.",
        mediaType: "image",
        src: "/assets/on-home-decor/projects/coffee-shop/room.webp",
        alt: "Café corner with deep-green walls, a gallery of framed prints, tan leather banquette, and an indoor tree",
        tags: { industry: ["commercial"], format: ["paint-selection"] }
      },
      {
        id: "restaurant-dining-room",
        title: "Timber-Frame Restaurant",
        caption: "Sage walls and glass pendants against original timber.",
        mediaType: "image",
        src: "/assets/on-home-decor/projects/restaurant/dining-room.webp",
        alt: "Timber-frame dining room with glass pendant lights, sage walls, and olive upholstered chairs",
        tags: { industry: ["commercial"], format: ["design-direction"] }
      },
      {
        id: "condo-feature-wall",
        title: "Condo Feature Wall",
        caption: "Concrete-texture accent with hexagonal mirror details.",
        mediaType: "image",
        src: "/assets/on-home-decor/projects/house-007/feature-wall.webp",
        alt: "Concrete-texture feature wall with hexagonal mirrors, a floating black console, and sheer violet curtains",
        tags: { industry: ["residential"], format: ["room-styling"] }
      }
    ]
  },
  packageSection: {
    eyebrow: "Design Packages",
    headline: "Start with one colour. Grow into a full transformation.",
    body:
      "Begin with a curated paint selection, then step up to room styling, renovation design direction, or a full-home transformation as your project grows. Larger renovation and full-home scopes are confirmed after a short consultation."
  },
  packages: [
    {
      id: "curated-paint-selection",
      name: "Curated Paint Selection",
      summary: "Designer-approved paint colour for one room, wall, cabinet, trim, or feature.",
      price: "$200",
      priceQualifier: "per colour",
      priceDisplay: "$200 per colour",
      altPrice: "Most homeowners start here",
      action: "checkout",
      paymentLink: "",
      bookingLink: "",
      stripe: {
        amount: 20000,
        currency: "cad",
        productName: "Curated Paint Selection",
        mode: "payment"
      },
      cta: "Book Your Paint Consultation",
      featured: true,
      description:
        "A personalized, designer-approved paint colour for a room, wall, cabinet, door, trim, or feature, chosen for your lighting, finishes, and the way you want the space to feel.",
      features: [
        "Personalized colour recommendation for your chosen area",
        "Lighting, flooring, trim, and furniture reviewed together",
        "Suggested finish/sheen and accent or trim guidance",
        "A clear explanation of why the colour works"
      ]
    },
    {
      id: "room-refresh-consultation",
      name: "Room Refresh Consultation",
      summary: "One-room design direction for clients who need more than paint.",
      price: "$500–$750",
      priceQualifier: "per room",
      priceDisplay: "$500–$750",
      altPrice: "Layout, palette & styling plan",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Plan a Room Refresh",
      description:
        "A focused design session for one room: layout suggestions, paint and palette direction, furniture and decor recommendations, lighting ideas, and a clear action plan.",
      features: [
        "Layout and styling priorities",
        "Paint and palette direction",
        "Furniture, decor, and lighting recommendations",
        "Shopping direction and a clear action plan"
      ]
    },
    {
      id: "designer-room-styling",
      name: "Designer Room Styling Package",
      summary: "A hands-on transformation of one room, concept to styling.",
      price: "$1,500–$3,500",
      priceQualifier: "per room",
      priceDisplay: "$1,500–$3,500 per room",
      altPrice: "Full concept + sourcing",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Style My Room",
      description:
        "A complete room design concept with colour palette, furniture and decor sourcing, moodboard, shopping list, and a placement and layout guide, with optional final styling install.",
      features: [
        "Full room design concept and moodboard",
        "Colour palette and furniture/decor sourcing",
        "Shopping list and placement/layout guide",
        "Optional install or final styling add-on"
      ]
    },
    {
      id: "kitchen-bath-design-direction",
      name: "Kitchen & Bathroom Design Direction",
      summary: "Renovation design support for higher-investment spaces.",
      price: "$2,500–$7,500+",
      priceQualifier: "per space",
      priceDisplay: "$2,500–$7,500+",
      altPrice: "Contractor-ready direction",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Get Renovation Direction",
      description:
        "Design vision and material direction for kitchens and bathrooms: cabinet, fixture, tile, countertop, and finish suggestions with layout feedback and contractor-ready guidance.",
      features: [
        "Design vision and material palette",
        "Cabinet, fixture, and finish direction",
        "Tile, countertop, and layout feedback",
        "Contractor-ready guidance where appropriate"
      ]
    },
    {
      id: "full-home-design-renovation-planning",
      name: "Full Home Design & Renovation Planning",
      summary: "Whole-home design and renovation planning support.",
      price: "$8,000–$25,000+",
      priceQualifier: "project",
      priceDisplay: "$8,000–$25,000+",
      altPrice: "Room-by-room planning",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Plan My Renovation",
      description:
        "A whole-home design concept with interior style direction, paint and materials palette, space planning, room-by-room guidance, renovation planning, and contractor coordination support.",
      features: [
        "Whole-home design concept and style direction",
        "Paint, materials, and finish selections",
        "Space planning and room-by-room guidance",
        "Renovation planning and contractor coordination support"
      ]
    },
    {
      id: "on-home-transformation-experience",
      name: "The ON Home Transformation Experience",
      summary: "Our signature, designer-led transformation from concept to completion.",
      price: "$15,000–$50,000+",
      priceQualifier: "by scope",
      priceDisplay: "$15,000–$50,000+",
      altPrice: "By application",
      action: "booking",
      paymentLink: "",
      bookingLink: "",
      cta: "Apply for a Full Home Consultation",
      description:
        "Our flagship service for serious homeowners who want a trusted design partner to guide the whole transformation: discovery, whole-home vision, selections, sourcing, vendor coordination, timeline guidance, and a styled final reveal.",
      features: [
        "Initial discovery and whole-home design vision",
        "Paint, material, finish selections, and sourcing",
        "Kitchen/bath concepts and space planning",
        "Contractor coordination, timeline, and final styling"
      ]
    }
  ],
  enterprise: {
    eyebrow: "Signature",
    headline: "The ON Home Transformation Experience.",
    body:
      "For serious homeowners who want more than advice: a trusted design partner to guide a cohesive, designer-led transformation from concept to completion, including selections, sourcing, vendor coordination, and a styled final reveal.",
    cta: "Apply for a Full Home Consultation",
    packageId: "on-home-transformation-experience"
  },
  checkout: {
    eyebrow: "Get Started",
    headline: "Book your Curated Paint Selection.",
    body:
      "Tell us about your space and the room or feature you want help with. In your message, include the number of colours you need, your timeline, and any photos or inspiration links. Elena will follow up to confirm your consultation.",
    submitCta: "Book My Consultation",
    disclaimer: "No payment is processed until live checkout is enabled by the admin."
  },
  fundingPromo: { enabled: false },
  faq: {
    eyebrow: "Questions",
    headline: "Everything you need to feel confident.",
    items: [
      {
        question: "How does the $200 paint selection work?",
        answer:
          "You book the consultation and share photos, room goals, lighting, and existing finishes. Elena reviews your space and curates a designer-approved colour with finish and next-step guidance."
      },
      {
        question: "Is the price really $200 per colour?",
        answer:
          "Yes. Each curated colour selection is $200. If you need colours for several rooms or features, simply request the number you need and we will plan accordingly."
      },
      {
        question: "Can I book help for more than one room?",
        answer:
          "Absolutely. Many clients start with one colour, then move into a Room Refresh, Designer Room Styling, or full-home planning as their project grows."
      },
      {
        question: "Do you help with paint finishes and trim colours?",
        answer:
          "Yes. Along with the wall colour, you get finish/sheen guidance and complementary accent, trim, cabinet, or feature-wall direction where it helps."
      },
      {
        question: "Do you provide full design services too?",
        answer:
          "Yes. We offer room styling, kitchen and bathroom design direction, full-home design and renovation planning, and our signature ON Home Transformation Experience."
      },
      {
        question: "Do you work outside Toronto?",
        answer:
          "We are based in Toronto and serve the GTA. Photo-based paint and styling guidance can often be provided beyond the immediate area; just ask."
      },
      {
        question: "Can you help with renovations?",
        answer:
          "Yes. We support renovation planning with material palettes, finish selections, layout feedback, contractor-ready direction, and project coordination."
      },
      {
        question: "Can you help small businesses or commercial spaces?",
        answer:
          "Yes. We help restaurants, retail shops, salons, clinics, and boutique offices create cohesive, elevated interiors that fit their brand."
      },
      {
        question: "What if I need furniture and decor recommendations too?",
        answer:
          "Our Room Refresh and Designer Room Styling packages include furniture, decor, lighting, and placement guidance with a shopping list."
      }
    ]
  },
  finalCta: {
    eyebrow: "Ready",
    headline: "Start with one colour. Transform the feeling of your entire space.",
    body: "Choose a colour you can feel confident about, with a designer's eye guiding the way.",
    cta: "Book Your Curated Paint Selection"
  },
  mobileCta: {
    primary: "Book Paint Consult",
    secondary: "Packages"
  },
  contact: {
    leadName: "Elena",
    email: "contact@on-homedecor.com",
    phone: "647-627-3803",
    location: "Toronto, Ontario / GTA"
  },
  routing: {
    leadWebhookUrl: "",
    replyToEmail: "contact@on-homedecor.com",
    phoneNumber: "647-627-3803",
    phoneNotes: "Curated Paint Selection and design consultation inquiries.",
    senderDomain: "on-homedecor.com"
  },
  telephony: { enabled: false },
  contractorSettings: {
    serviceAreas: ["Toronto", "GTA", "North York", "Scarborough", "Etobicoke", "Mississauga", "Vaughan", "Markham"],
    defaultCapacityNotes: "Track design consultation availability, project scopes, and trade/vendor coordination here."
  },
  teamId: "team_default"
});

export default onHomeDecorTenant;
