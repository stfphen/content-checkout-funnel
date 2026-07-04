import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultTenant, normalizeTenantConfig } from "../lib/defaultTenant.js";
import { sanitizeTenantConfig, validateTenantConfig } from "../lib/tenantValidation.js";
import { dgtlGroupTenant } from "../lib/tenants/dgtlGroup.js";
import { dmtvTenant } from "../lib/tenants/dmtv.js";
import { dmtvStudioTenant } from "../lib/tenants/dmtvStudio.js";
import { elixrTenant } from "../lib/tenants/elixr.js";
import { onHomeDecorTenant } from "../lib/tenants/onHomeDecor.js";
import { fundedGrowthTenant } from "../lib/funding/tenant.js";

// The agency template follows the showcase/authority contract: a top-level
// `template: "agency"` selects the renderer and the top-level `agency` block
// carries the section content the funnel template cannot express. Both must
// ride through normalization and sanitization untouched. (Registry resolution
// itself is JSX and can't run under node --test; the source cross-check below
// locks the registration instead, and the build/smoke pass exercises the real
// path.)

test("template: agency survives normalizeTenantConfig", () => {
  const normalized = normalizeTenantConfig({ slug: "any-tenant", template: "agency" });
  assert.equal(normalized.template, "agency");
});

test("dgtl-group config survives sanitize with template and agency block intact", () => {
  const sanitized = sanitizeTenantConfig(dgtlGroupTenant);
  assert.equal(sanitized.template, "agency");
  assert.equal(sanitized.slug, "dgtl-group");
  assert.ok(sanitized.agency, "agency content block should pass through");
  assert.equal(sanitized.agency.funnels.items.length, 3);
  assert.equal(sanitized.agency.team.tracks.length, 3);
  assert.ok(sanitized.agency.results.caseStudies.length >= 2);
  assert.match(
    sanitized.agency.funding.disclaimer,
    /does not guarantee/,
    "funding band must keep the compliance disclaimer"
  );
});

test("dgtl-group config passes tenant validation", () => {
  const { ok, errors } = validateTenantConfig(dgtlGroupTenant);
  assert.equal(ok, true, JSON.stringify(errors));
});

test("tenants without an agency block stay clean", () => {
  const sanitized = sanitizeTenantConfig({ ...defaultTenant });
  assert.equal(sanitized.agency, undefined);
});

test("registry source registers the agency template", () => {
  const registrySource = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "components",
      "templates",
      "registry.js"
    ),
    "utf8"
  );
  assert.match(registrySource, /agency:\s*\{/);
  assert.match(registrySource, /AgencyPage/);
  assert.match(registrySource, /DEFAULT_TEMPLATE_ID = "funnel"/);
});

test("dgtl-group id, slug, and domains are unique across all sibling tenants", () => {
  const siblings = [
    defaultTenant,
    dmtvTenant,
    dmtvStudioTenant,
    elixrTenant,
    onHomeDecorTenant,
    fundedGrowthTenant
  ];
  for (const sibling of siblings) {
    assert.notEqual(dgtlGroupTenant.id, sibling.id, `id collides with ${sibling.slug}`);
    assert.notEqual(dgtlGroupTenant.slug, sibling.slug, `slug collides with ${sibling.slug}`);
    for (const domain of dgtlGroupTenant.domains || []) {
      assert.ok(
        !(sibling.domains || []).includes(domain),
        `domain ${domain} collides with ${sibling.slug}`
      );
    }
  }
});

test("offer ladder mirrors the Content Day package ids", () => {
  assert.deepEqual(
    dgtlGroupTenant.packages.map((pack) => pack.id),
    ["ugc-content", "pro-content-day", "growth-retainer", "campaign-scope"]
  );
  assert.equal(dgtlGroupTenant.defaultPackageId, "pro-content-day");
  // This page converts through the lead form; the live-checkout stripe block
  // stays on the dgtlmag funnel only.
  for (const pack of dgtlGroupTenant.packages) {
    assert.equal(pack.stripe, undefined, `${pack.id} should not carry a stripe block`);
  }
});
