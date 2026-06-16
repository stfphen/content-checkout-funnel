import { FUNDING_LANE_LABELS } from "./constants.js";
import { scoreFundingFit } from "./scoring.js";

const revenueMidpoints = {
  pre_revenue: 0,
  under_100k: 50000,
  "100k_500k": 250000,
  "500k_1m": 750000,
  "1m_5m": 2500000,
  "5m_plus": 5000000
};

export function isFundingScanLead(lead = {}) {
  const metadata = lead.sourceMetadata || lead.metadata || {};
  return lead.sourceType === "funding_scan" || Boolean(metadata.fundingScan);
}

export function fundingScanFromLead(lead = {}) {
  const metadata = lead.sourceMetadata || lead.metadata || {};
  return metadata.fundingScan || {};
}

export function buildFundingFitInputFromLead(lead = {}) {
  const scan = fundingScanFromLead(lead);
  const location = scan.location || [lead.city, lead.region, lead.country].filter(Boolean).join(", ");
  const digitalNeeds = scan.digitalNeeds || "";
  const ecommerceNeeds = scan.ecommerceNeeds || "";
  const crmAutomationNeeds = scan.crmAutomationNeeds || "";
  const mainGrowthGoal = scan.mainGrowthGoal || lead.notes || "";

  return {
    province: provinceFromLocation(location || lead.region),
    country: countryFromLocation(location || lead.country),
    industry: scan.industry || lead.category || "",
    goals: [mainGrowthGoal].filter(Boolean),
    channels: [ecommerceNeeds].filter(Boolean),
    currentCapabilities: [digitalNeeds, ecommerceNeeds, crmAutomationNeeds].filter(Boolean),
    annualRevenue: revenueMidpoints[scan.revenueRange] || 0,
    employeeCount: Number(scan.employeeCount || 0),
    sellsOnline: hasSubstantiveNeed(ecommerceNeeds),
    exports: scan.currentlyExporting === "yes" || scan.interestedInExporting === "yes",
    hasTrainingNeed: textIncludes([digitalNeeds, crmAutomationNeeds, mainGrowthGoal], ["training", "upskill", "enablement"]),
    sellsToGovernment: textIncludes([digitalNeeds, ecommerceNeeds, crmAutomationNeeds, mainGrowthGoal], ["government", "procurement", "rfp"]),
    usesCleanTech: textIncludes([scan.industry, mainGrowthGoal], ["clean tech", "cleantech", "sustainability", "climate", "energy"])
  };
}

export function scoreFundingLead(lead = {}) {
  const score = scoreFundingFit(buildFundingFitInputFromLead(lead));
  return {
    ...score,
    bestFundingLaneLabel: FUNDING_LANE_LABELS[score.bestFundingLane] || score.bestFundingLane
  };
}

function hasSubstantiveNeed(value) {
  const text = normalizeText(value);
  return Boolean(text) && !["none", "no", "n/a", "na", "not applicable"].includes(text);
}

function provinceFromLocation(value = "") {
  const text = normalizeText(value);
  if (text.includes("ontario") || /\bon\b/.test(text)) return "Ontario";
  if (text.includes("british columbia") || /\bbc\b/.test(text)) return "British Columbia";
  if (text.includes("alberta") || /\bab\b/.test(text)) return "Alberta";
  if (text.includes("quebec") || text.includes("québec") || /\bqc\b/.test(text)) return "Quebec";
  if (text.includes("manitoba") || /\bmb\b/.test(text)) return "Manitoba";
  if (text.includes("saskatchewan") || /\bsk\b/.test(text)) return "Saskatchewan";
  if (text.includes("nova scotia") || /\bns\b/.test(text)) return "Nova Scotia";
  if (text.includes("new brunswick") || /\bnb\b/.test(text)) return "New Brunswick";
  if (text.includes("newfoundland") || /\bnl\b/.test(text)) return "Newfoundland and Labrador";
  if (text.includes("prince edward") || /\bpe\b/.test(text)) return "Prince Edward Island";
  if (text.includes("yukon") || /\byt\b/.test(text)) return "Yukon";
  if (text.includes("northwest territories") || /\bnt\b/.test(text)) return "Northwest Territories";
  if (text.includes("nunavut") || /\bnu\b/.test(text)) return "Nunavut";
  return "";
}

function countryFromLocation(value = "") {
  const text = normalizeText(value);
  if (!text) return "Canada";
  if (text.includes("canada")) return "Canada";
  if (text.includes("united states") || text.includes("usa") || text.includes("u.s.")) return "United States";
  return "Canada";
}

function textIncludes(values, keywords) {
  const haystack = normalizeText(values.filter(Boolean).join(" "));
  return keywords.some((keyword) => haystack.includes(keyword));
}

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}
