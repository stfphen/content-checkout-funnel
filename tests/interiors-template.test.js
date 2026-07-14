import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { defaultTenant, normalizeTenantConfig } from "../lib/defaultTenant.js";
import { sanitizeTenantConfig, validateTenantConfig } from "../lib/tenantValidation.js";
import { dgtlGroupTenant } from "../lib/tenants/dgtlGroup.js";
import { dmtvTenant } from "../lib/tenants/dmtv.js";
import { dmtvStudioTenant } from "../lib/tenants/dmtvStudio.js";
import { elixrTenant } from "../lib/tenants/elixr.js";
import { onHomeDecorTenant } from "../lib/tenants/onHomeDecor.js";
import { fundedGrowthTenant } from "../lib/funding/tenant.js";

// The interiors template relies on two top-level tenant config fields that are
// not part of the funnel schema: `template` (renderer selection) and
// `interiors` (section content). Like the showcase/agency templates before it,
// both must ride through normalization and sanitization untouched. The suite
// also freezes ON Home Decor's canonical facts: the package ladder, the $200
// Stripe entry offer, and the no-hospitality-language rule.

test("interiors template field survives normalizeTenantConfig", () => {
  const normalized = normalizeTenantConfig({ slug: "any-tenant", template: "interiors" });
  assert.equal(normalized.template, "interiors");
});

test("on-home-decor config survives sanitize with template, design, and interiors intact", () => {
  const sanitized = sanitizeTenantConfig(onHomeDecorTenant);
  assert.equal(sanitized.template, "interiors");
  assert.equal(sanitized.slug, "on-home-decor");
  assert.equal(sanitized.design.direction, "warm-boutique");
  assert.equal(sanitized.design.verticalPreset, "local-trades-retail");
  assert.ok(sanitized.interiors, "interiors content block should pass through");
  assert.equal(sanitized.interiors.nav.links.length, 4);
  assert.ok(Array.isArray(sanitized.interiors.gallery.projects));
  assert.equal(sanitized.interiors.booking.consultationCta, "Book a Consultation");
  assert.equal(sanitized.interiors.booking.inquiryCta, "Start a Project Inquiry");
  assert.equal(sanitized.contractorSettings.serviceAreas.length, 8);
});

test("on-home-decor config passes tenant validation", () => {
  const { ok, errors } = validateTenantConfig(onHomeDecorTenant);
  assert.equal(ok, true, JSON.stringify(errors));
});

test("on-home-decor package ladder ids, order, and prices are frozen", () => {
  const ids = onHomeDecorTenant.packages.map((pack) => pack.id);
  assert.deepEqual(ids, [
    "curated-paint-selection",
    "room-refresh-consultation",
    "designer-room-styling",
    "kitchen-bath-design-direction",
    "full-home-design-renovation-planning",
    "on-home-transformation-experience"
  ]);
  assert.equal(onHomeDecorTenant.defaultPackageId, "curated-paint-selection");

  const entry = onHomeDecorTenant.packages[0];
  assert.equal(entry.action, "checkout");
  assert.equal(entry.featured, true);
  assert.equal(entry.stripe.amount, 20000);
  assert.equal(entry.stripe.currency, "cad");

  // Only the entry offer carries checkout; the rungs stay booking inquiries.
  for (const pack of onHomeDecorTenant.packages.slice(1)) {
    assert.equal(pack.action, "booking", `${pack.id} must stay a booking package`);
    assert.ok(!pack.stripe, `${pack.id} must not carry a Stripe price`);
  }
});

test("on-home-decor keeps fundingPromo off and carries no hospitality language", () => {
  assert.equal(onHomeDecorTenant.fundingPromo.enabled, false);
  const copy = JSON.stringify(onHomeDecorTenant);
  assert.ok(
    !/hospitality|accommodation|guest suite|nightly stay/i.test(copy),
    "hospitality/accommodation language must not appear in the config"
  );
});

test("interiors template is registered in the components registry", () => {
  // The registry imports JSX, which node --test cannot execute, so this
  // cross-check greps the source: an unknown template id silently falls back
  // to the funnel, and this is the only guard against that. Same pattern as
  // the authority template test.
  const source = readFileSync(
    new URL("../components/templates/registry.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /interiors:\s*\{/);
  assert.match(source, /InteriorsPage/);
  assert.match(source, /DEFAULT_TEMPLATE_ID = "funnel"/);
});

test("on-home-decor does not collide with any existing tenant", () => {
  const others = [
    defaultTenant,
    fundedGrowthTenant,
    dmtvTenant,
    dmtvStudioTenant,
    elixrTenant,
    dgtlGroupTenant
  ];
  for (const other of others) {
    assert.notEqual(onHomeDecorTenant.id, other.id);
    assert.notEqual(onHomeDecorTenant.slug, other.slug);
    for (const domain of onHomeDecorTenant.domains) {
      assert.ok(
        !other.domains.includes(domain),
        `domain ${domain} already claimed by ${other.slug}`
      );
    }
  }
});
