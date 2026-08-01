import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTenantConfig } from "../lib/defaultTenant.js";
import { sanitizeTenantConfig, validateTenantConfig } from "../lib/tenantValidation.js";
import { dgtlInfluenceTenant } from "../lib/tenants/dgtlInfluence.js";
import { dgtlGroupTenant } from "../lib/tenants/dgtlGroup.js";
import { dmtvTenant } from "../lib/tenants/dmtv.js";
import { dmtvStudioTenant } from "../lib/tenants/dmtvStudio.js";
import { elixrTenant } from "../lib/tenants/elixr.js";
import { onHomeDecorTenant } from "../lib/tenants/onHomeDecor.js";
import { defaultTenant } from "../lib/defaultTenant.js";
import { fundedGrowthTenant } from "../lib/funding/tenant.js";

// The influence-journal template relies on the same mechanism as the agency
// template: a top-level `template` field (renderer selection) and an
// `influenceJournal` content block, neither part of the funnel schema. Both
// must ride through normalization and sanitization untouched.

test("influence-journal template field survives normalizeTenantConfig", () => {
  const normalized = normalizeTenantConfig({ slug: "any-tenant", template: "influence-journal" });
  assert.equal(normalized.template, "influence-journal");
});

test("dgtl-influence config survives sanitize with template and content block intact", () => {
  const sanitized = sanitizeTenantConfig(dgtlInfluenceTenant);
  assert.equal(sanitized.template, "influence-journal");
  assert.equal(sanitized.slug, "dgtl-influence");
  assert.ok(sanitized.influenceJournal, "influenceJournal content block should pass through");
  assert.equal(sanitized.influenceJournal.creators.items.length, 2);
});

test("dgtl-influence config passes tenant validation", () => {
  const { ok, errors } = validateTenantConfig(dgtlInfluenceTenant);
  assert.equal(ok, true, JSON.stringify(errors));
});

test("dgtl-influence is scoped to its own domain, not /t/<slug>", () => {
  assert.deepEqual(dgtlInfluenceTenant.domains, ["dgtlinfluence.com", "www.dgtlinfluence.com"]);
});

test("dgtl-influence creator entries default to in_production with no invented data", () => {
  for (const creator of dgtlInfluenceTenant.influenceJournal.creators.items) {
    assert.equal(creator.status, "in_production");
    assert.equal(creator.href, "");
  }
});

test("dgtl-influence does not collide with any existing tenant", () => {
  const others = [defaultTenant, dmtvTenant, dmtvStudioTenant, elixrTenant, onHomeDecorTenant, fundedGrowthTenant, dgtlGroupTenant];
  for (const other of others) {
    assert.notEqual(dgtlInfluenceTenant.id, other.id);
    assert.notEqual(dgtlInfluenceTenant.slug, other.slug);
    const overlap = dgtlInfluenceTenant.domains.filter((d) => other.domains.includes(d));
    assert.deepEqual(overlap, [], `domain overlap with ${other.slug}`);
  }
});
