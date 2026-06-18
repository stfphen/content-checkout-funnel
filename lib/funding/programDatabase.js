import {
  FUNDING_LANE_LABELS,
  FUNDING_LANES
} from "./constants.js";
import { scoreFundingFit } from "./scoring.js";

/**
 * @typedef {Object} FundingProgramMatch
 * @property {typeof manualFundingPrograms[number]} program
 * @property {number} matchScore
 * @property {"high" | "medium" | "low"} confidence
 * @property {{ id: string, label: string, score: number }[]} matchedLanes
 * @property {string[]} matchedSignals
 * @property {string[]} reviewGaps
 */

export const manualFundingPrograms = [
  {
    id: "canexport-smes",
    name: "CanExport SMEs",
    provider: "Government of Canada",
    fundingType: "Export marketing",
    statusLabel: "Manual review",
    sourceUrl: "https://www.tradecommissioner.gc.ca/funding-financement/canexport/sme-pme/index.aspx",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "verify_current_intake",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: [] },
    lanes: ["export_marketing", "market_expansion"],
    industries: ["manufacturing", "technology", "software", "food", "consumer goods", "clean tech"],
    targetBusinessLabels: ["Export-ready SMEs", "Manufacturers", "Technology companies"],
    projectTypes: ["export marketing", "international market development", "trade shows", "market research"],
    eligibleProjectExamples: ["International campaign assets", "Market-entry landing pages", "Export sales collateral"],
    servicePackageIds: ["fundable-project-blueprint", "application-support", "funded-growth-execution"],
    minEmployees: 1,
    maxEmployees: 500,
    minAnnualRevenue: 100000,
    fitNotes: "Potential fit for Canadian SMEs planning new export market development."
  },
  {
    id: "ontario-dmap",
    name: "Digital Modernization and Adoption Plan",
    provider: "Government of Ontario / Ontario Centre of Innovation",
    fundingType: "Digital adoption",
    statusLabel: "Manual review",
    sourceUrl: "https://news.ontario.ca/en/release/1007481/ontario-investing-5-million-to-help-small-businesses-adopt-digital-technologies",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "verify_current_intake",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: ["Ontario"] },
    lanes: ["digital_adoption", "ecommerce_growth", "market_expansion"],
    industries: ["manufacturing", "retail", "professional services", "technology", "construction"],
    targetBusinessLabels: ["Ontario SMEs", "Retailers", "Service businesses", "Manufacturers"],
    projectTypes: ["digital adoption plan", "technology planning", "automation", "ecommerce"],
    eligibleProjectExamples: ["Digital adoption roadmap", "E-commerce plan", "CRM and automation plan"],
    servicePackageIds: ["fundable-project-blueprint", "application-support"],
    minEmployees: 1,
    minAnnualRevenue: 50000,
    fitNotes: "Potential fit for Ontario businesses preparing a technology adoption plan."
  },
  {
    id: "strategic-agri-food-processing-fund",
    name: "Strategic Agri-Food Processing Fund",
    provider: "Government of Ontario",
    fundingType: "Modernization",
    statusLabel: "Manual review",
    sourceUrl: "https://www.ontario.ca/page/strategic-agri-food-processing-fund",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "verify_current_intake",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: ["Ontario"] },
    lanes: ["digital_adoption", "clean_tech", "market_expansion"],
    industries: ["food", "agri-food", "agriculture", "manufacturing"],
    targetBusinessLabels: ["Food processors", "Agri-food manufacturers", "Ontario producers"],
    projectTypes: ["processing capacity", "modernization", "automation", "facility expansion"],
    eligibleProjectExamples: ["Modernization narrative", "Operational content system", "Expansion project assets"],
    servicePackageIds: ["fundable-project-blueprint", "application-support", "funded-growth-execution"],
    minEmployees: 1,
    minAnnualRevenue: 100000,
    fitNotes: "Potential fit for Ontario agri-food processors with modernization or capacity projects."
  },
  {
    id: "irap",
    name: "NRC IRAP",
    provider: "National Research Council Canada",
    fundingType: "Innovation",
    statusLabel: "Manual review",
    sourceUrl: "https://nrc.canada.ca/en/support-technology-innovation",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "verify_current_intake",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: [] },
    lanes: ["creative_tech", "clean_tech", "digital_adoption"],
    industries: ["technology", "software", "clean tech", "manufacturing", "life sciences"],
    targetBusinessLabels: ["Technology SMEs", "Product companies", "Innovative manufacturers"],
    projectTypes: ["research and development", "prototype", "technology commercialization", "innovation"],
    eligibleProjectExamples: ["Prototype go-to-market assets", "Technical commercialization plan", "Pilot project narrative"],
    servicePackageIds: ["fundable-project-blueprint", "application-support", "funded-growth-execution"],
    minEmployees: 1,
    maxEmployees: 500,
    fitNotes: "Potential fit for Canadian SMEs developing or commercializing innovative technology."
  },
  {
    id: "canexport-innovation",
    name: "CanExport Innovation",
    provider: "Government of Canada",
    fundingType: "Export innovation",
    statusLabel: "Manual review",
    sourceUrl: "https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/global-affairs-canada-canexport-innovation",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "verify_current_intake",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: [] },
    lanes: ["export_marketing", "creative_tech", "clean_tech"],
    industries: ["technology", "software", "clean tech", "advanced manufacturing", "education"],
    targetBusinessLabels: ["R&D teams", "Technology exporters", "Clean-tech companies"],
    projectTypes: ["international r&d partnership", "technology validation", "co-development", "prototype"],
    eligibleProjectExamples: ["Partnership pitch materials", "International validation narrative", "Project scope deck"],
    servicePackageIds: ["fundable-project-blueprint", "application-support"],
    minEmployees: 1,
    fitNotes: "Potential fit for organizations pursuing international technology R&D partnerships."
  },
  {
    id: "canada-summer-jobs",
    name: "Canada Summer Jobs",
    provider: "Government of Canada",
    fundingType: "Workforce",
    statusLabel: "Seasonal",
    sourceUrl: "https://www.canada.ca/en/employment-social-development/services/funding/canada-summer-jobs.html",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "verify_current_intake",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: [] },
    lanes: ["workforce_training"],
    industries: ["retail", "hospitality", "nonprofit", "professional services", "manufacturing", "technology"],
    targetBusinessLabels: ["Hiring businesses", "Seasonal operators", "Growing teams"],
    projectTypes: ["youth hiring", "summer jobs", "training", "team capacity"],
    eligibleProjectExamples: ["Marketing assistant role plan", "Content operations training", "Digital coordinator scope"],
    servicePackageIds: ["application-support", "monthly-opportunity-intelligence"],
    minEmployees: 1,
    fitNotes: "Potential fit when the growth project includes youth hiring or seasonal team capacity."
  },
  {
    id: "canada-digital-adoption-program-bybt",
    name: "Canada Digital Adoption Program - Boost Your Business Technology",
    provider: "Government of Canada",
    fundingType: "Digital adoption",
    statusLabel: "Historical benchmark",
    sourceUrl: "https://ised-isde.canada.ca/site/atip-services/en/ised-info-source-updates/info-source-2025-update",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "concluded_verify_successor",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: [] },
    lanes: ["digital_adoption", "ecommerce_growth"],
    industries: ["retail", "manufacturing", "professional services", "construction", "technology"],
    targetBusinessLabels: ["Digitizing SMEs", "Retailers", "Service businesses"],
    projectTypes: ["digital adoption plan", "software implementation", "ecommerce", "automation"],
    eligibleProjectExamples: ["Successor-program readiness", "Digital plan retrofit", "Implementation budget narrative"],
    servicePackageIds: ["fundable-project-blueprint", "monthly-opportunity-intelligence"],
    minEmployees: 1,
    minAnnualRevenue: 100000,
    fitNotes: "Historical digital adoption benchmark; verify successor or equivalent provincial programs before positioning."
  },
  {
    id: "ontario-procurement-readiness",
    name: "Ontario Public Procurement Readiness",
    provider: "Manual advisory lane",
    fundingType: "Funded contracts",
    statusLabel: "Advisory",
    sourceUrl: "https://www.ontario.ca/page/selling-ontario-government",
    lastVerifiedOn: "2026-06-17",
    intakeStatus: "advisory_only",
    tenantIds: ["*"],
    jurisdictions: { countries: ["Canada"], provinces: ["Ontario"] },
    lanes: ["public_procurement"],
    industries: ["construction", "technology", "professional services", "clean tech", "manufacturing"],
    targetBusinessLabels: ["Government-ready suppliers", "B2B service firms", "Contractors"],
    projectTypes: ["supplier profile", "rfp readiness", "government sales", "procurement"],
    eligibleProjectExamples: ["Supplier profile", "RFP response assets", "Capability statement"],
    servicePackageIds: ["fundable-project-blueprint", "funded-growth-execution"],
    minEmployees: 1,
    fitNotes: "Advisory match for businesses preparing to sell to government; not a grant program."
  }
];

export const fundingOpportunityStatuses = [
  "verify_current_intake",
  "advisory_only",
  "concluded_verify_successor"
];

const activeLikeStatuses = new Set(["verify_current_intake", "advisory_only"]);

export function matchFundingProgramsForInput(input = {}, options = {}) {
  const fundingScore = options.fundingScore || scoreFundingFit(input);
  const programs = options.programs || manualFundingPrograms;
  const limit = Number(options.limit || 5);
  const normalizedInput = normalizeFundingInput(input);

  return programs
    .map((program) => scoreProgramMatch({ program, input: normalizedInput, fundingScore }))
    .filter((match) => match.matchScore > 0)
    .sort((a, b) => {
      const scoreDelta = b.matchScore - a.matchScore;
      if (scoreDelta) return scoreDelta;
      return a.program.name.localeCompare(b.program.name);
    })
    .slice(0, limit);
}

export function findFundingProgram(programId, programs = manualFundingPrograms) {
  return programs.find((program) => program.id === programId) || null;
}

export function listFundingProgramsForTenant(tenantId, programs = manualFundingPrograms) {
  return programs.filter((program) => {
    const tenantIds = program.tenantIds || ["*"];
    return tenantIds.includes("*") || tenantIds.includes(tenantId);
  });
}

function scoreProgramMatch({ program, input, fundingScore }) {
  const matchedSignals = [];
  const reviewGaps = [];
  let score = 0;

  const jurisdictionScore = scoreJurisdiction({ program, input, matchedSignals, reviewGaps });
  score += jurisdictionScore;

  const laneScore = scoreLanes({ program, fundingScore, matchedSignals });
  score += laneScore;

  if (matchesAny(input.industry, program.industries)) {
    score += 14;
    matchedSignals.push(`Industry aligns with ${program.name}`);
  }

  const projectText = [input.industry, ...input.goals, ...input.channels, ...input.currentCapabilities].join(" ");
  const matchedProjectType = (program.projectTypes || []).find((projectType) =>
    includesNormalized(projectText, projectType)
  );
  if (matchedProjectType) {
    score += 16;
    matchedSignals.push(`Project signal: ${matchedProjectType}`);
  }

  score += scoreBusinessReadiness({ program, input, matchedSignals, reviewGaps });

  if (!activeLikeStatuses.has(program.intakeStatus)) {
    score -= 22;
    reviewGaps.push("Program status is not current-ready; verify successor, intake, or replacement path.");
  } else if (program.intakeStatus === "verify_current_intake") {
    reviewGaps.push("Verify current intake window, budget, and application rules before recommending.");
  }

  const matchScore = clampScore(score);
  const confidence = matchScore >= 75 ? "high" : matchScore >= 50 ? "medium" : "low";

  return {
    program,
    matchScore,
    confidence,
    matchedLanes: program.lanes.map((lane) => ({
      id: lane,
      label: FUNDING_LANE_LABELS[lane] || lane,
      score: fundingScore.laneScores?.[lane] || 0
    })),
    matchedSignals,
    reviewGaps
  };
}

function scoreJurisdiction({ program, input, matchedSignals, reviewGaps }) {
  const countries = normalizeList(program.jurisdictions?.countries);
  const provinces = normalizeList(program.jurisdictions?.provinces);

  if (countries.length && input.country && !countries.includes(input.country)) {
    reviewGaps.push(`Program jurisdiction is ${program.jurisdictions.countries.join(", ")}.`);
    return 0;
  }

  if (provinces.length) {
    if (input.province && provinces.includes(input.province)) {
      matchedSignals.push(`Province match: ${titleCase(input.province)}`);
      return 24;
    }
    reviewGaps.push(`Confirm province fit: ${program.jurisdictions.provinces.join(", ")}.`);
    return 6;
  }

  if (countries.length && input.country && countries.includes(input.country)) {
    matchedSignals.push(`Country match: ${titleCase(input.country)}`);
    return 18;
  }

  return 8;
}

function scoreLanes({ program, fundingScore, matchedSignals }) {
  let score = 0;

  for (const lane of program.lanes || []) {
    const laneFit = Number(fundingScore.laneScores?.[lane] || 0);
    if (lane === fundingScore.bestFundingLane) {
      score += 28;
      matchedSignals.push(`Best lane match: ${FUNDING_LANE_LABELS[lane] || lane}`);
    } else if (laneFit >= 40) {
      score += 18;
      matchedSignals.push(`Strong lane signal: ${FUNDING_LANE_LABELS[lane] || lane}`);
    } else if (laneFit >= 20) {
      score += 10;
    }
  }

  return Math.min(score, 38);
}

function scoreBusinessReadiness({ program, input, matchedSignals, reviewGaps }) {
  let score = 0;

  if (program.minEmployees && input.employeeCount < program.minEmployees) {
    reviewGaps.push(`Confirm employee count meets ${program.name} requirements.`);
  } else if (input.employeeCount) {
    score += 5;
    matchedSignals.push("Employee count supplied");
  }

  if (program.maxEmployees && input.employeeCount > program.maxEmployees) {
    reviewGaps.push(`Employee count may exceed ${program.name} size limits.`);
  }

  if (program.minAnnualRevenue && input.annualRevenue < program.minAnnualRevenue) {
    reviewGaps.push(`Confirm revenue traction meets ${program.name} requirements.`);
  } else if (input.annualRevenue) {
    score += 7;
    matchedSignals.push("Revenue range supplied");
  }

  if (program.maxAnnualRevenue && input.annualRevenue > program.maxAnnualRevenue) {
    reviewGaps.push(`Revenue may exceed ${program.name} size limits.`);
  }

  return score;
}

function normalizeFundingInput(input = {}) {
  return {
    province: normalizeText(input.province),
    country: normalizeText(input.country || "Canada"),
    industry: normalizeText(input.industry),
    goals: normalizeList(input.goals),
    channels: normalizeList(input.channels),
    currentCapabilities: normalizeList(input.currentCapabilities),
    annualRevenue: Number(input.annualRevenue || 0),
    employeeCount: Number(input.employeeCount || 0)
  };
}

function normalizeList(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map(normalizeText).filter(Boolean);
}

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function matchesAny(value, candidates = []) {
  const text = normalizeText(value);
  return candidates.some((candidate) => includesNormalized(text, candidate));
}

function includesNormalized(value, candidate) {
  return normalizeText(value).includes(normalizeText(candidate));
}

function titleCase(value) {
  return normalizeText(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function validateManualFundingPrograms(programs = manualFundingPrograms) {
  const ids = new Set();
  const errors = [];

  programs.forEach((program, index) => {
    const path = `programs.${index}`;
    if (!program.id) errors.push(`${path}.id is required`);
    if (ids.has(program.id)) errors.push(`${path}.id must be unique`);
    ids.add(program.id);
    if (!program.name) errors.push(`${path}.name is required`);
    if (!program.provider) errors.push(`${path}.provider is required`);
    if (!program.sourceUrl) errors.push(`${path}.sourceUrl is required`);
    if (!program.lastVerifiedOn) errors.push(`${path}.lastVerifiedOn is required`);
    if (!program.intakeStatus) errors.push(`${path}.intakeStatus is required`);
    if (!Array.isArray(program.lanes) || !program.lanes.length) errors.push(`${path}.lanes is required`);
    for (const lane of program.lanes || []) {
      if (!FUNDING_LANES.includes(lane)) errors.push(`${path}.lanes includes unknown lane ${lane}`);
    }
  });

  return {
    ok: errors.length === 0,
    errors
  };
}
