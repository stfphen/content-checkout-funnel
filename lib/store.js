import { mkdir, readFile, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { defaultTenant, normalizeTenantConfig } from "./defaultTenant.js";

const DATA_PATH = path.join(process.cwd(), "data", "app-store.json");

let pgPool;
let schemaReady = false;

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function getPgPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pgPool) {
    const { Pool } = await import("pg");
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pgPool;
}

async function ensureSchema() {
  const pool = await getPgPool();
  if (!pool || schemaReady) return pool;

  await pool.query(`
    create table if not exists tenants (
      id text primary key,
      slug text unique not null,
      domains jsonb not null default '[]',
      status text not null default 'active',
      config jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists leads (
      id text primary key,
      tenant_id text not null,
      campaign_id text,
      business text,
      name text,
      email text,
      phone text,
      website_url text,
      notes text,
      package_id text,
      status text not null default 'new',
      source_url text,
      source_type text not null default 'form',
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists contractors (
      id text primary key,
      name text not null,
      email text,
      phone text,
      service_area text,
      availability_notes text,
      weekly_capacity integer,
      rate_notes text,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists draft_emails (
      id text primary key,
      lead_id text not null,
      tenant_id text not null,
      subject text not null,
      body text not null,
      status text not null default 'draft',
      created_at timestamptz not null default now()
    );
  `);

  const existing = await pool.query("select id from tenants where id = $1", [defaultTenant.id]);
  if (!existing.rowCount) {
    await pool.query(
      "insert into tenants (id, slug, domains, status, config) values ($1, $2, $3::jsonb, $4, $5::jsonb)",
      [
        defaultTenant.id,
        defaultTenant.slug,
        JSON.stringify(defaultTenant.domains),
        defaultTenant.status,
        JSON.stringify(defaultTenant)
      ]
    );
  }

  schemaReady = true;
  return pool;
}

async function readFileStore() {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  try {
    const raw = await readFile(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const initial = {
      tenants: [defaultTenant],
      leads: [],
      contractors: [],
      draftEmails: []
    };
    await writeFile(DATA_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function writeFileStore(store) {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

function normalizeHost(host) {
  return host.split(":")[0].toLowerCase();
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function mapTenantRow(row) {
  return normalizeTenantConfig({
    ...row.config,
    id: row.id,
    slug: row.slug,
    domains: row.domains,
    status: row.status
  });
}

export async function getTenantForHost(host) {
  const normalized = normalizeHost(host);
  const pool = await ensureSchema();

  if (pool) {
    const result = await pool.query("select * from tenants where status = 'active'");
    const tenants = result.rows.map(mapTenantRow);
    return (
      tenants.find((tenant) =>
        tenant.domains.map(normalizeHost).includes(normalized)
      ) || tenants[0] || defaultTenant
    );
  }

  const store = await readFileStore();
  return (
    store.tenants
      .map(normalizeTenantConfig)
      .find((tenant) => tenant.domains.map(normalizeHost).includes(normalized)) ||
    normalizeTenantConfig(store.tenants[0] || defaultTenant)
  );
}

export async function getTenantBySlug(slug) {
  const pool = await ensureSchema();
  if (pool) {
    const result = await pool.query("select * from tenants where slug = $1", [slug]);
    return result.rows[0] ? mapTenantRow(result.rows[0]) : defaultTenant;
  }
  const store = await readFileStore();
  return normalizeTenantConfig(store.tenants.find((tenant) => tenant.slug === slug) || defaultTenant);
}

export async function listTenants() {
  const pool = await ensureSchema();
  if (pool) {
    const result = await pool.query("select * from tenants order by created_at desc");
    return result.rows.map(mapTenantRow);
  }
  const store = await readFileStore();
  return store.tenants.map(normalizeTenantConfig);
}

export async function upsertTenantConfig(config) {
  const tenant = normalizeTenantConfig({
    ...config,
    id: config.id || `tenant_${config.slug || crypto.randomUUID()}`,
    slug: config.slug || config.brand?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tenant"
  });
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into tenants (id, slug, domains, status, config, updated_at)
       values ($1, $2, $3::jsonb, $4, $5::jsonb, now())
       on conflict (id) do update set
         slug = excluded.slug,
         domains = excluded.domains,
         status = excluded.status,
         config = excluded.config,
         updated_at = now()`,
      [
        tenant.id,
        tenant.slug,
        JSON.stringify(tenant.domains || []),
        tenant.status || "active",
        JSON.stringify(tenant)
      ]
    );
    return tenant;
  }

  const store = await readFileStore();
  const index = store.tenants.findIndex((item) => item.id === tenant.id || item.slug === tenant.slug);
  if (index >= 0) {
    store.tenants[index] = tenant;
  } else {
    store.tenants.push(tenant);
  }
  await writeFileStore(store);
  return tenant;
}

export async function createLead(input) {
  const lead = {
    id: input.id || id("lead"),
    tenantId: input.tenantId || defaultTenant.id,
    campaignId: input.campaignId || "",
    business: input.business || "",
    name: input.name || "",
    email: input.email || "",
    phone: input.phone || "",
    websiteUrl: input.url || input.websiteUrl || "",
    notes: input.notes || "",
    packageId: input.packageId || "",
    status: input.status || "new",
    sourceUrl: input.source || input.sourceUrl || "",
    sourceType: input.sourceType || "form",
    metadata: input.metadata || {},
    createdAt: input.createdAt || now(),
    updatedAt: now()
  };
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into leads
       (id, tenant_id, campaign_id, business, name, email, phone, website_url, notes, package_id, status, source_url, source_type, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)`,
      [
        lead.id,
        lead.tenantId,
        lead.campaignId,
        lead.business,
        lead.name,
        lead.email,
        lead.phone,
        lead.websiteUrl,
        lead.notes,
        lead.packageId,
        lead.status,
        lead.sourceUrl,
        lead.sourceType,
        JSON.stringify(lead.metadata)
      ]
    );
    return lead;
  }

  const store = await readFileStore();
  store.leads.unshift(lead);
  await writeFileStore(store);
  return lead;
}

function mapLeadRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    campaignId: row.campaign_id,
    business: row.business,
    name: row.name,
    email: row.email,
    phone: row.phone,
    websiteUrl: row.website_url,
    notes: row.notes,
    packageId: row.package_id,
    status: row.status,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    metadata: row.metadata || {},
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at
  };
}

export function mergeLeadMetadata(existingMetadata = {}, patch = {}) {
  const base = isPlainObject(existingMetadata) ? existingMetadata : {};
  if (!isPlainObject(patch)) return { ...base };

  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value)) {
      const existingValue = isPlainObject(base[key]) ? base[key] : {};
      merged[key] = mergeLeadMetadata(existingValue, value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

export async function listLeads({ tenantId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = tenantId
      ? await pool.query("select * from leads where tenant_id = $1 order by created_at desc", [tenantId])
      : await pool.query("select * from leads order by created_at desc limit 500");
    return result.rows.map(mapLeadRow);
  }
  const store = await readFileStore();
  return tenantId ? store.leads.filter((lead) => lead.tenantId === tenantId) : store.leads;
}

export async function getLeadById(leadId) {
  const pool = await ensureSchema();
  if (pool) {
    const result = await pool.query("select * from leads where id = $1 limit 1", [leadId]);
    return result.rows[0] ? mapLeadRow(result.rows[0]) : null;
  }

  const store = await readFileStore();
  return store.leads.find((lead) => lead.id === leadId) || null;
}

export async function updateLeadStatus(leadId, status) {
  const pool = await ensureSchema();
  if (pool) {
    await pool.query("update leads set status = $2, updated_at = now() where id = $1", [leadId, status]);
    return;
  }
  const store = await readFileStore();
  store.leads = store.leads.map((lead) =>
    lead.id === leadId ? { ...lead, status, updatedAt: now() } : lead
  );
  await writeFileStore(store);
}

export async function updateLeadResearch(leadId, { notes, metadata, status } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const current = await getLeadById(leadId);
    if (!current) return null;

    const updatedAt = now();
    const mergedMetadata = mergeLeadMetadata(current.metadata, metadata);
    const result = await pool.query(
      `update leads
       set notes = $2,
           status = $3,
           metadata = $4::jsonb,
           updated_at = $5
       where id = $1
       returning *`,
      [
        leadId,
        notes === undefined ? current.notes : notes ?? "",
        status === undefined ? current.status : status ?? current.status,
        JSON.stringify(mergedMetadata),
        updatedAt
      ]
    );
    return result.rows[0] ? mapLeadRow(result.rows[0]) : current;
  }

  const store = await readFileStore();
  const index = store.leads.findIndex((lead) => lead.id === leadId);
  if (index < 0) return null;

  const current = store.leads[index];
  const nextLead = {
    ...current,
    notes: notes === undefined ? current.notes : notes ?? "",
    status: status === undefined ? current.status : status ?? current.status,
    metadata: mergeLeadMetadata(current.metadata, metadata),
    createdAt: current.createdAt,
    updatedAt: now()
  };

  store.leads[index] = nextLead;
  await writeFileStore(store);
  return nextLead;
}

export async function listContractors() {
  const pool = await ensureSchema();
  if (pool) {
    const result = await pool.query("select * from contractors order by created_at desc");
    return result.rows;
  }
  const store = await readFileStore();
  return store.contractors;
}

export async function createContractor(input) {
  const contractor = {
    id: id("contractor"),
    name: input.name,
    email: input.email || "",
    phone: input.phone || "",
    serviceArea: input.serviceArea || "",
    availabilityNotes: input.availabilityNotes || "",
    weeklyCapacity: Number(input.weeklyCapacity || 0),
    rateNotes: input.rateNotes || "",
    active: true,
    createdAt: now()
  };
  const pool = await ensureSchema();
  if (pool) {
    await pool.query(
      `insert into contractors
       (id, name, email, phone, service_area, availability_notes, weekly_capacity, rate_notes, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        contractor.id,
        contractor.name,
        contractor.email,
        contractor.phone,
        contractor.serviceArea,
        contractor.availabilityNotes,
        contractor.weeklyCapacity,
        contractor.rateNotes,
        contractor.active
      ]
    );
    return contractor;
  }
  const store = await readFileStore();
  store.contractors.unshift(contractor);
  await writeFileStore(store);
  return contractor;
}

export async function createDraftEmail(input) {
  const draft = {
    id: id("draft"),
    leadId: input.leadId,
    tenantId: input.tenantId,
    subject: input.subject,
    body: input.body,
    status: "draft",
    createdAt: now()
  };
  const pool = await ensureSchema();
  if (pool) {
    await pool.query(
      "insert into draft_emails (id, lead_id, tenant_id, subject, body, status) values ($1,$2,$3,$4,$5,$6)",
      [draft.id, draft.leadId, draft.tenantId, draft.subject, draft.body, draft.status]
    );
    return draft;
  }
  const store = await readFileStore();
  store.draftEmails.unshift(draft);
  await writeFileStore(store);
  return draft;
}

export async function listDraftEmails() {
  const pool = await ensureSchema();
  if (pool) {
    const result = await pool.query("select * from draft_emails order by created_at desc limit 500");
    return result.rows;
  }
  const store = await readFileStore();
  return store.draftEmails;
}
