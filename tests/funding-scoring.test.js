import assert from "node:assert/strict";
import test from "node:test";
import {
  FUNDING_LANES,
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
