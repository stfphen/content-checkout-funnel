import { manualFundingProgramCategories } from "./programs.js";

/**
 * Rank broad manual opportunity categories against Funding Fit Scan answers.
 *
 * This matcher does not check live program availability, eligibility, deadlines,
 * funder rules, or award amounts. Every result is a potential category only and
 * requires human review before it is used in outreach or proposal work.
 */
export function matchFundingPrograms(fundingScan = {}, programs = manualFundingProgramCategories) {
  return programs
    .map((program, index) => ({
      ...program,
      score: scoreProgramMatch(fundingScan, program),
      originalIndex: index
    }))
    .sort((a, b) => b.score.value - a.score.value || a.originalIndex - b.originalIndex)
    .map(({ originalIndex, ...match }) => match);
}

function scoreProgramMatch(scan = {}, program = {}) {
  const reasons = [];
  const gaps = [];
  let value = 0;

  const context = buildScanContext(scan);
  const matchedKeywords = matchKeywords(context.haystack, program.keywords || []);
  if (matchedKeywords.length) {
    const keywordScore = Math.min(36, matchedKeywords.length * 12);
    value += keywordScore;
    reasons.push(`Matched scan language: ${matchedKeywords.slice(0, 3).join(", ")}`);
  }

  const matchedIndustry = matchKeywords(context.industry, program.industries || []);
  if (matchedIndustry.length) {
    value += 14;
    reasons.push(`Industry may align with ${program.name.toLowerCase()}.`);
  }

  for (const signal of program.signals || []) {
    const signalScore = scoreSignal(signal, context, reasons);
    value += signalScore;
  }

  if (context.hasBudget) {
    value += 8;
    reasons.push("Project budget was provided for review.");
  } else {
    gaps.push("Confirm available project budget.");
  }

  if (context.hasRevenue) {
    value += 6;
    reasons.push("Revenue traction was provided.");
  } else {
    gaps.push("Confirm revenue traction or self-funded project capacity.");
  }

  if (!context.industry) gaps.push("Confirm industry.");
  if (!context.location) gaps.push("Confirm operating location.");
  if (!context.mainGrowthGoal) gaps.push("Clarify the main growth goal.");
  if (!reasons.length) reasons.push("Insufficient scan detail for a strong category signal.");

  return {
    value: clamp(value),
    label: value >= 50 ? "Potential fit" : value >= 25 ? "Possible fit after review" : "Weak signal",
    reasons,
    gaps,
    requiresHumanReview: true
  };
}

function buildScanContext(scan = {}) {
  const digitalNeeds = cleanText(scan.digitalNeeds);
  const ecommerceNeeds = cleanText(scan.ecommerceNeeds);
  const automationNeeds = cleanText(scan.crmAutomationNeeds);
  const mainGrowthGoal = cleanText(scan.mainGrowthGoal);
  const industry = cleanText(scan.industry);
  const location = cleanText(scan.location);
  const haystack = [industry, location, digitalNeeds, ecommerceNeeds, automationNeeds, mainGrowthGoal].join(" ");

  return {
    industry,
    location,
    digitalNeeds,
    ecommerceNeeds,
    automationNeeds,
    mainGrowthGoal,
    haystack,
    employeeCount: Number(scan.employeeCount || 0),
    hasBudget: Boolean(scan.availableProjectBudget && scan.availableProjectBudget !== "under_5k"),
    hasRevenue: Boolean(scan.revenueRange && !["pre_revenue", "under_100k"].includes(scan.revenueRange)),
    hasExportSignal: scan.currentlyExporting === "yes" || scan.interestedInExporting === "yes",
    hasEcommerceSignal: hasSubstantiveNeed(ecommerceNeeds),
    hasDigitalSignal: hasSubstantiveNeed(digitalNeeds),
    hasAutomationSignal: hasSubstantiveNeed(automationNeeds)
  };
}

function scoreSignal(signal, context, reasons) {
  if (signal === "digitalNeeds" && context.hasDigitalSignal) {
    reasons.push("Digital needs were provided.");
    return 18;
  }
  if (signal === "ecommerceNeeds" && context.hasEcommerceSignal) {
    reasons.push("E-commerce needs were provided.");
    return 24;
  }
  if (signal === "automationNeeds" && context.hasAutomationSignal) {
    reasons.push("CRM or automation needs were provided.");
    return 22;
  }
  if (signal === "exportInterest" && context.hasExportSignal) {
    reasons.push("Export activity or export interest was provided.");
    return 30;
  }
  if (signal === "employeeCount" && context.employeeCount > 0) {
    reasons.push("Employee count was provided for capacity review.");
    return context.employeeCount >= 5 ? 16 : 8;
  }
  if (signal === "procurementIntent" && hasAny(context.haystack, ["procurement", "government", "rfp", "public sector"])) {
    reasons.push("Procurement or public-sector language appeared in the scan.");
    return 28;
  }
  if (signal === "cleanTech" && hasAny(context.haystack, ["clean tech", "cleantech", "climate", "energy", "sustainability", "carbon"])) {
    reasons.push("Clean technology or sustainability language appeared in the scan.");
    return 28;
  }
  if (signal === "growthGoal" && context.mainGrowthGoal) {
    reasons.push("A growth goal was provided.");
    return 14;
  }
  return 0;
}

function matchKeywords(haystack = "", keywords = []) {
  return keywords.filter((keyword) => hasKeyword(haystack, keyword));
}

function hasAny(haystack = "", keywords = []) {
  return keywords.some((keyword) => hasKeyword(haystack, keyword));
}

function hasKeyword(haystack = "", keyword = "") {
  const target = cleanText(keyword);
  if (!target) return false;
  if (target.includes(" ")) return haystack.includes(target);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(target)}([^a-z0-9]|$)`).test(haystack);
}

function hasSubstantiveNeed(value = "") {
  return Boolean(value) && !["none", "no", "n/a", "na", "not applicable"].includes(value);
}

function cleanText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

