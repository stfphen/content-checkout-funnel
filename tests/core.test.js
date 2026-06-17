import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { leadFromCsvRecord, parseCsv } from "../lib/csv.js";
import { normalizeTenantConfig } from "../lib/defaultTenant.js";
import { searchApolloPeople } from "../lib/integrations/apollo.js";
import { buildDraftEmail } from "../lib/outreach.js";
import { createLead, getLeadById, mergeLeadMetadata, updateLeadResearch } from "../lib/store.js";

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

test("metadata merge preserves existing keys", () => {
  const merged = mergeLeadMetadata(
    {
      displayName: { text: "Example Dental" },
      organization: { name: "Example Co", website: "https://example.co" },
      enrichments: {
        googlePlaces: { placeId: "place_123", rating: 4.8 },
        hunter: { domain: "example.co", emails: [{ value: "owner@example.co" }] },
        apollo: { people: [{ name: "Sam Founder", title: "Owner" }] }
      },
      position: "Founder",
      imported_by: "csv"
    },
    {
      organization: { linkedin_url: "https://linkedin.com/company/example-co" },
      enrichments: {
        website: { title: "Example Co" }
      },
      enrichment: { provider: "manual-review" }
    }
  );

  assert.equal(merged.displayName.text, "Example Dental");
  assert.equal(merged.organization.name, "Example Co");
  assert.equal(merged.organization.website, "https://example.co");
  assert.equal(merged.organization.linkedin_url, "https://linkedin.com/company/example-co");
  assert.equal(merged.enrichments.googlePlaces.placeId, "place_123");
  assert.equal(merged.enrichments.hunter.emails[0].value, "owner@example.co");
  assert.equal(merged.enrichments.apollo.people[0].title, "Owner");
  assert.equal(merged.enrichments.website.title, "Example Co");
  assert.equal(merged.position, "Founder");
  assert.equal(merged.imported_by, "csv");
  assert.equal(merged.enrichment.provider, "manual-review");
});

test("nested enrichment object can be added", () => {
  const merged = mergeLeadMetadata(
    {
      formattedAddress: "123 Queen St W",
      location: { city: "Toronto", province: "ON" }
    },
    {
      enrichment: {
        website: {
          title: "Example Dental",
          contacts: {
            primary: { email: "owner@example.com" }
          }
        }
      }
    }
  );

  assert.equal(merged.formattedAddress, "123 Queen St W");
  assert.equal(merged.location.city, "Toronto");
  assert.equal(merged.enrichment.website.title, "Example Dental");
  assert.equal(merged.enrichment.website.contacts.primary.email, "owner@example.com");
});

test("updateLeadResearch works in file-store mode", async () => {
  const storePath = path.join(process.cwd(), "data", "app-store.json");
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let originalStore;

  try {
    originalStore = await readFile(storePath, "utf8");
  } catch {
    originalStore = undefined;
  }

  delete process.env.DATABASE_URL;
  await rm(storePath, { force: true });

  try {
    const lead = await createLead({
      id: "lead_file_store_research",
      tenantId: "tenant_dgtlmag",
      business: "Example Dental",
      notes: "Imported from CSV",
      status: "new",
      metadata: {
        company: "Example Dental",
        owner: "Sam Founder",
        location: { city: "Toronto" }
      },
      createdAt: "2026-06-01T12:00:00.000Z"
    });

    const updated = await updateLeadResearch(lead.id, {
      notes: "Verified owner and website",
      status: "researched",
      metadata: {
        location: { province: "ON" },
        enrichment: {
          provider: "manual-review",
          website: { title: "Example Dental" }
        }
      }
    });

    assert.equal(updated.id, lead.id);
    assert.equal(updated.createdAt, "2026-06-01T12:00:00.000Z");
    assert.equal(updated.notes, "Verified owner and website");
    assert.equal(updated.status, "researched");
    assert.equal(updated.metadata.company, "Example Dental");
    assert.equal(updated.metadata.owner, "Sam Founder");
    assert.equal(updated.metadata.location.city, "Toronto");
    assert.equal(updated.metadata.location.province, "ON");
    assert.equal(updated.metadata.enrichment.provider, "manual-review");
    assert.equal(updated.metadata.enrichment.website.title, "Example Dental");

    const storedLead = await getLeadById(lead.id);
    assert.deepEqual(storedLead.metadata, updated.metadata);
    assert.notEqual(storedLead.updatedAt, lead.updatedAt);
  } finally {
    if (originalStore === undefined) {
      await rm(storePath, { force: true });
    } else {
      await writeFile(storePath, originalStore);
    }

    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }
});
