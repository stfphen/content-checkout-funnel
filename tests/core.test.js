import assert from "node:assert/strict";
import test from "node:test";
import { leadFromCsvRecord, parseCsv } from "../lib/csv.js";
import { normalizeTenantConfig } from "../lib/defaultTenant.js";
import { searchApolloPeople } from "../lib/integrations/apollo.js";
import { buildDraftEmail } from "../lib/outreach.js";

test("normalizes partial tenant config with default funnel content", () => {
  const tenant = normalizeTenantConfig({
    id: "tenant_partner",
    slug: "partner",
    domains: ["partner.example.com"],
    brand: { name: "Partner Media" }
  });

  assert.equal(tenant.brand.name, "Partner Media");
  assert.equal(tenant.hero.headline, "Get a full month of content filmed in one day.");
  assert.equal(tenant.packages.length, 4);
  assert.equal(tenant.domains[0], "partner.example.com");
});

test("parses CSV leads with quoted fields", () => {
  const records = parseCsv(
    'business,contact,email,phone,website,notes\n"Example Clinic","Jane Owner",jane@example.com,4165550100,https://example.com,"Toronto, med spa"'
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].business, "Example Clinic");
  assert.equal(records[0].notes, "Toronto, med spa");
});

test("maps CSV record into lead shape", () => {
  const lead = leadFromCsvRecord(
    {
      business: "Example Shop",
      contact: "Sam",
      email: "sam@example.com",
      website: "https://shop.example",
      notes: "Retail lead"
    },
    "tenant_dgtlmag"
  );

  assert.equal(lead.tenantId, "tenant_dgtlmag");
  assert.equal(lead.business, "Example Shop");
  assert.equal(lead.sourceType, "csv");
});

test("builds a draft email from tenant and lead context", () => {
  const tenant = normalizeTenantConfig({});
  const draft = buildDraftEmail({
    tenant,
    packageId: "pro-content-day",
    lead: {
      business: "Example Dental",
      name: "Alex"
    }
  });

  assert.match(draft.subject, /Example Dental/);
  assert.match(draft.body, /Hey Alex/);
  assert.match(draft.body, /Pro Content Day/);
});

test("searches Apollo people with current endpoint and query params", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APOLLO_API_KEY;
  let requestUrl;
  let requestOptions;

  process.env.APOLLO_API_KEY = "apollo-test-key";
  globalThis.fetch = async (url, options) => {
    requestUrl = new URL(String(url));
    requestOptions = options;
    return {
      ok: true,
      async json() {
        return {
          people: [
            {
              first_name: "Sam",
              last_name: "Owner",
              title: "Founder",
              has_email: true,
              organization: { name: "Example Co" }
            }
          ]
        };
      }
    };
  };

  try {
    const result = await searchApolloPeople({
      domain: "https://www.example.com/path",
      titles: ["owner", "founder"]
    });

    assert.equal(result.ok, true);
    assert.equal(requestUrl.origin, "https://api.apollo.io");
    assert.equal(requestUrl.pathname, "/api/v1/mixed_people/api_search");
    assert.equal(requestUrl.searchParams.get("q_organization_domains_list[]"), "example.com");
    assert.deepEqual(requestUrl.searchParams.getAll("person_titles[]"), ["owner", "founder"]);
    assert.equal(requestOptions.method, "POST");
    assert.equal(requestOptions.headers["x-api-key"], "apollo-test-key");
    assert.equal(result.contacts[0].emailAvailable, true);
    assert.equal(result.contacts[0].company, "Example Co");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APOLLO_API_KEY;
    else process.env.APOLLO_API_KEY = originalKey;
  }
});
