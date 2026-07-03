import FunnelPage from "../FunnelPage";
import ShowcasePage from "../showcase/ShowcasePage";

// Tenant page templates. A tenant config may carry a top-level `template` field
// naming which renderer serves its page; anything unset or unknown falls back
// to the classic funnel so existing tenants render exactly as before. Keyed by
// template id (never by tenant slug) so any tenant can adopt any template.
export const DEFAULT_TEMPLATE_ID = "funnel";

const TEMPLATES = {
  funnel: {
    id: "funnel",
    Component: FunnelPage
  },
  showcase: {
    id: "showcase",
    Component: ShowcasePage,
    // Showcase pages own their metadata; funnel pages keep inheriting the
    // static layout metadata (returning nothing from generateMetadata).
    buildMetadata: (config) => ({
      title: config?.brand?.name || "Showcase",
      description: config?.brand?.tagline || config?.hero?.subheadline || ""
    })
  }
};

export function resolveTemplate(config) {
  return TEMPLATES[config?.template] || TEMPLATES[DEFAULT_TEMPLATE_ID];
}
