import assert from "node:assert/strict";
import test from "node:test";
import {
  FUNDING_LANES,
  manualFundingProgramCategories,
  matchFundingPrograms,
  normalizeFundingOpportunity,
  scoreFundingFit
} from "../lib/funding/index.js";

test("scores a sample Ontario business with stable funding fit output", () => {
  const result = scoreFundingFit({
    province: "Ontario",
    country: "Canada",
    industry: "Retail ecommerce",
    goals: ["Increase online sales", "Market expansion"],
    channels: ["Shopify", "Paid ads", "Email"],
    currentCapabilities: ["Website", "Basic CRM"],
    annualRevenue: 250000,
    employeeCount: 8,
    sellsOnline: true,
    exports: false,
    hasTrainingNeed: true,
    sellsToGovernment: false,
    usesCleanTech: false
  });

  assert.equal(result.overallFit, 54);
  assert.equal(result.bestFundingLane, "ecommerce_growth");
  assert.equal(result.recommendedOffer, "Ecommerce conversion and paid acquisition growth plan");
  assert.deepEqual(Object.keys(result.laneScores), FUNDING_LANES);
  assert.deepEqual(result.laneScores, {
    digital_adoption: 42,
    ecommerce_growth: 54,
    export_marketing: 18,
    creative_tech: 4,
    clean_tech: 4,
    workforce_training: 28,
    public_procurement: 10,
    market_expansion: 26
  });
  assert.deepEqual(result.eligibilityGaps, []);
  assert.ok(result.reasoning.includes("Ontario location: +8 to common provincial business-growth lanes"));
  assert.ok(result.reasoning.includes("Sells online: ecommerce and digital adoption signals"));
});

test("exports funding ingestion placeholder helpers from funding index", () => {
  const opportunity = normalizeFundingOpportunity({
    title: "Training Fund",
    sourceUrl: "https://example.com/training-fund"
  });

  assert.equal(opportunity.title, "Training Fund");
  assert.equal(opportunity.requiresHumanReview, true);
});

test("matches ecommerce and digital adoption opportunity categories", () => {
  const matches = matchFundingPrograms({
    industry: "Retail ecommerce",
    location: "Toronto, Ontario",
    employeeCount: "8",
    revenueRange: "100k_500k",
    currentlyExporting: "no",
    interestedInExporting: "no",
    digitalNeeds: "Website analytics and digital modernization",
    ecommerceNeeds: "Shopify conversion improvements and paid ads",
    crmAutomationNeeds: "Basic customer follow-up automation",
    availableProjectBudget: "15k_50k",
    mainGrowthGoal: "Increase online sales"
  });

  assert.equal(matches[0].id, "ecommerce-growth");
  assert.ok(matches.slice(0, 3).some((match) => match.id === "digital-adoption"));
  assert.equal(matches[0].score.requiresHumanReview, true);
  assert.match(matches[0].score.reasons.join(" "), /E-commerce needs/);
});

test("matches export marketing opportunity category", () => {
  const matches = matchFundingPrograms({
    industry: "Manufacturing",
    location: "Hamilton, Ontario",
    employeeCount: "12",
    revenueRange: "500k_1m",
    currentlyExporting: "no",
    interestedInExporting: "yes",
    digitalNeeds: "Website modernization for international buyers",
    ecommerceNeeds: "Dealer portal",
    crmAutomationNeeds: "Sales pipeline automation",
    availableProjectBudget: "50k_100k",
    mainGrowthGoal: "Build export marketing assets for US market entry"
  });

  assert.equal(matches[0].id, "export-market-development");
  assert.equal(matches[0].score.label, "Potential fit");
  assert.match(matches[0].score.reasons.join(" "), /Export activity or export interest/);
});

test("keeps weak or missing-info profile as human-review-only", () => {
  const matches = matchFundingPrograms({
    industry: "",
    location: "",
    employeeCount: "",
    revenueRange: "pre_revenue",
    digitalNeeds: "",
    ecommerceNeeds: "none",
    crmAutomationNeeds: "",
    availableProjectBudget: "under_5k",
    mainGrowthGoal: ""
  });

  assert.equal(matches.length, manualFundingProgramCategories.length);
  assert.equal(matches[0].score.label, "Weak signal");
  assert.equal(matches[0].score.requiresHumanReview, true);
  assert.ok(matches[0].score.gaps.includes("Confirm industry."));
  assert.ok(matches[0].score.gaps.includes("Clarify the main growth goal."));
});
