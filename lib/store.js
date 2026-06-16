import { mkdir, readFile, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { defaultTenant, normalizeTenantConfig } from "./defaultTenant.js";
import {
  decorateLeadsWithDuplicates,
  normalizeLeadInput,
  shouldSkipReliableDuplicate,
  withLegacyAliases
} from "./leadUtils.js";
import {
  campaignStatuses,
  defaultOutreachTemplates,
  outreachEventTypes,
  outreachQueueStatuses,
  suppressionReasons
} from "./outreachSequence.js";
import { validateTenantConfigOrThrow } from "./tenantValidation.js";

const DATA_PATH = path.join(process.cwd(), "data", "app-store.json");
const DEFAULT_TEAM_ID = "team_default";

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

  // Legacy bootstrap kept temporarily for compatibility. Add future PostgreSQL
  // schema changes as SQL files in migrations/ and apply them with npm run migrate.
  await pool.query(`
    create table if not exists tenants (
      id text primary key,
      team_id text not null default 'team_default',
      slug text unique not null,
      domains jsonb not null default '[]',
      status text not null default 'active',
      config jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists leads (
      id text primary key,
      team_id text not null default 'team_default',
      tenant_id text not null,
      campaign_id text,
      batch_id text,
      business text,
      name text,
      contact_title text,
      email text,
      phone text,
      website_url text,
      domain text,
      address text,
      city text,
      region text,
      country text,
      category text,
      notes text,
      package_id text,
      status text not null default 'new',
      enrichment_status text not null default 'not_started',
      outreach_status text not null default 'not_started',
      pipeline_status text not null default 'new',
      lead_score integer not null default 0,
      lead_score_reason text,
      pain_points text,
      recommended_offer text,
      assigned_to text,
      google_place_id text,
      google_rating numeric,
      google_review_count integer,
      source_url text,
      source_type text not null default 'form',
      metadata jsonb not null default '{}',
      last_contacted_at timestamptz,
      next_follow_up_at timestamptz,
      reply_status text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table leads add column if not exists batch_id text;
    alter table tenants add column if not exists team_id text not null default 'team_default';
    alter table leads add column if not exists team_id text not null default 'team_default';
    alter table leads add column if not exists contact_title text;
    alter table leads add column if not exists domain text;
    alter table leads add column if not exists address text;
    alter table leads add column if not exists city text;
    alter table leads add column if not exists region text;
    alter table leads add column if not exists country text;
    alter table leads add column if not exists category text;
    alter table leads add column if not exists enrichment_status text not null default 'not_started';
    alter table leads add column if not exists outreach_status text not null default 'not_started';
    alter table leads add column if not exists pipeline_status text not null default 'new';
    alter table leads add column if not exists lead_score integer not null default 0;
    alter table leads add column if not exists lead_score_reason text;
    alter table leads add column if not exists pain_points text;
    alter table leads add column if not exists recommended_offer text;
    alter table leads add column if not exists assigned_to text;
    alter table leads add column if not exists google_place_id text;
    alter table leads add column if not exists google_rating numeric;
    alter table leads add column if not exists google_review_count integer;
    alter table leads add column if not exists last_contacted_at timestamptz;
    alter table leads add column if not exists next_follow_up_at timestamptz;
    alter table leads add column if not exists reply_status text;
    alter table leads add column if not exists campaign_id text;

    create table if not exists contractors (
      id text primary key,
      team_id text not null default 'team_default',
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
      team_id text not null default 'team_default',
      lead_id text not null,
      tenant_id text not null,
      subject text not null,
      body text not null,
      status text not null default 'draft',
      created_at timestamptz not null default now()
    );

    create table if not exists prospecting_batches (
      id text primary key,
      tenant_id text not null,
      name text not null,
      query text not null,
      category text,
      city text,
      provider text not null default 'google_places',
      status text not null default 'draft',
      max_results integer not null default 20,
      enrich_hunter boolean not null default false,
      enrich_apollo boolean not null default false,
      target_roles jsonb not null default '[]',
      preview_results jsonb not null default '[]',
      counts jsonb not null default '{}',
      error text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists outreach_templates (
      id text primary key,
      tenant_id text not null,
      name text not null,
      subject text not null,
      body text not null,
      category text,
      offer_type text,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists outreach_campaigns (
      id text primary key,
      tenant_id text not null,
      name text not null,
      description text,
      status text not null default 'draft',
      source_filter text,
      city_filter text,
      category_filter text,
      daily_send_cap integer not null default 25,
      per_domain_daily_cap integer not null default 1,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists outreach_queue (
      id text primary key,
      lead_id text not null,
      campaign_id text,
      template_id text,
      tenant_id text not null,
      status text not null default 'queued',
      subject text not null,
      body text not null,
      recipient_email text,
      sender_email text,
      scheduled_for timestamptz,
      sent_at timestamptz,
      failure_reason text,
      resend_message_id text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists outreach_suppression_list (
      id text primary key,
      tenant_id text,
      email text,
      domain text,
      reason text not null default 'manual',
      created_at timestamptz not null default now()
    );

    create table if not exists outreach_events (
      id text primary key,
      lead_id text not null,
      queue_id text,
      campaign_id text,
      type text not null,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now()
    );

    alter table contractors add column if not exists team_id text not null default 'team_default';
    alter table draft_emails add column if not exists team_id text not null default 'team_default';
  `);

  const existing = await pool.query("select id from tenants where id = $1", [defaultTenant.id]);
  if (!existing.rowCount) {
    await pool.query(
      "insert into tenants (id, team_id, slug, domains, status, config) values ($1, $2, $3, $4::jsonb, $5, $6::jsonb) on conflict (id) do nothing",
      [
        defaultTenant.id,
        DEFAULT_TEAM_ID,
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
    return normalizeFileStore(JSON.parse(raw));
  } catch {
    const initial = {
      tenants: [defaultTenant],
      leads: [],
      contractors: [],
      draftEmails: [],
      prospectingBatches: [],
      outreachTemplates: [],
      outreachCampaigns: [],
      outreachQueue: [],
      outreachSuppressionList: [],
      outreachEvents: []
    };
    await writeFile(DATA_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function normalizeFileStore(store) {
  return {
    tenants: store.tenants || [defaultTenant],
    leads: store.leads || [],
    contractors: store.contractors || [],
    draftEmails: store.draftEmails || [],
    prospectingBatches: store.prospectingBatches || [],
    outreachTemplates: store.outreachTemplates || [],
    outreachCampaigns: store.outreachCampaigns || [],
    outreachQueue: store.outreachQueue || [],
    outreachSuppressionList: store.outreachSuppressionList || [],
    outreachEvents: store.outreachEvents || []
  };
}

async function writeFileStore(store) {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

function normalizeHost(host) {
  return host.split(":")[0].toLowerCase();
}

function mapTenantRow(row) {
  return normalizeTenantConfig({
    ...row.config,
    id: row.id,
    teamId: row.team_id,
    slug: row.slug,
    domains: row.domains,
    status: row.status
  });
}

function normalizeTeamId(teamId) {
  return String(teamId || "").trim();
}

function requireTeamId(teamId) {
  const normalized = normalizeTeamId(teamId);
  if (!normalized) {
    throw new Error("Team context is required.");
  }
  return normalized;
}

function withTeamId(record, teamId) {
  return {
    ...record,
    teamId: record.teamId || teamId || DEFAULT_TEAM_ID
  };
}

async function resolveTeamIdForTenant(tenantId, teamId) {
  if (teamId) return requireTeamId(teamId);
  const tenant = await getTenantByIdOrSlug(tenantId);
  return tenant?.teamId || DEFAULT_TEAM_ID;
}

export function getSessionTeamId(session) {
  return session?.teamId || session?.team?.id || "";
}

export async function canAccessTenant(teamId, tenantId) {
  if (!teamId || !tenantId) return false;
  const tenant = await getTenantByIdOrSlug(tenantId, { teamId });
  return Boolean(tenant);
}

export async function requireTenantAccess(teamId, tenantId) {
  if (!(await canAccessTenant(teamId, tenantId))) {
    const error = new Error("Tenant is not available to this team.");
    error.status = 403;
    throw error;
  }
}

async function listTeamTenantIds(teamId) {
  if (!teamId) return null;
  const tenants = await listTenants({ teamId });
  return new Set(tenants.map((tenant) => tenant.id));
}

async function filterByTeamTenant(records, teamId) {
  const tenantIds = await listTeamTenantIds(teamId);
  if (!tenantIds) return records;
  return records.filter((record) => tenantIds.has(record.tenantId || record.tenant_id));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tenant";
}

function uniqueTenantSlug(baseSlug, tenants) {
  const existing = new Set(tenants.map((tenant) => tenant.slug));
  let slug = baseSlug;
  let suffix = 2;

  while (existing.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function tenantSnapshot(config) {
  const normalized = normalizeTenantConfig(config || {});
  const { draftConfig, publishedConfig, lastPublishedAt, ...snapshot } = normalized;
  return normalizeTenantConfig(snapshot);
}

function hasConfigSnapshot(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getRenderableTenantConfig(tenant, mode = "published") {
  const base = normalizeTenantConfig(tenant || defaultTenant);
  const snapshot = mode === "draft" ? base.draftConfig : base.publishedConfig;
  const selected = hasConfigSnapshot(snapshot) ? snapshot : base;

  return normalizeTenantConfig({
    ...base,
    ...selected,
    draftConfig: base.draftConfig || null,
    publishedConfig: base.publishedConfig || null,
    lastPublishedAt: base.lastPublishedAt || ""
  });
}

export async function getTenantForHost(host) {
  const normalized = normalizeHost(host);
  const pool = await ensureSchema();

  if (pool) {
    const result = await pool.query("select * from tenants where status = 'active'");
    const tenants = result.rows.map(mapTenantRow);
    return (
      tenants.find((tenant) => {
        const published = getRenderableTenantConfig(tenant, "published");
        return published.status === "active" && published.domains.map(normalizeHost).includes(normalized);
      }) || tenants.find((tenant) => getRenderableTenantConfig(tenant, "published").status === "active") || defaultTenant
    );
  }

  const store = await readFileStore();
  return (
    store.tenants
      .map(normalizeTenantConfig)
      .filter((tenant) => tenant.status === "active")
      .find((tenant) => {
        const published = getRenderableTenantConfig(tenant, "published");
        return published.status === "active" && published.domains.map(normalizeHost).includes(normalized);
      }) ||
    store.tenants.map(normalizeTenantConfig).find((tenant) => tenant.status === "active") ||
    normalizeTenantConfig(defaultTenant)
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

export async function getTenantByIdOrSlug(identifier, { teamId } = {}) {
  const target = String(identifier || "");
  const tenants = await listTenants({ teamId });
  return tenants.find((tenant) => tenant.id === target || tenant.slug === target) || null;
}

export async function listTenants({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query("select * from tenants where team_id = $1 order by created_at desc", [teamId])
      : await pool.query("select * from tenants order by created_at desc");
    return result.rows.map(mapTenantRow);
  }
  const store = await readFileStore();
  return store.tenants
    .map((tenant) => withTeamId(normalizeTenantConfig(tenant), tenant.teamId))
    .filter((tenant) => !teamId || tenant.teamId === teamId);
}

export async function upsertTenantConfig(config, { teamId } = {}) {
  const scopedTeamId = requireTeamId(teamId || config.teamId);
  const tenant = normalizeTenantConfig({
    ...config,
    teamId: scopedTeamId,
    id: config.id || `tenant_${config.slug || crypto.randomUUID()}`,
    slug: config.slug || config.brand?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tenant"
  });
  const pool = await ensureSchema();

  if (pool) {
    const result = await pool.query(
      `insert into tenants (id, team_id, slug, domains, status, config, updated_at)
       values ($1, $2, $3, $4::jsonb, $5, $6::jsonb, now())
       on conflict (id) do update set
         team_id = excluded.team_id,
         slug = excluded.slug,
         domains = excluded.domains,
         status = excluded.status,
         config = excluded.config,
         updated_at = now()
       where tenants.team_id = excluded.team_id
       returning id`,
      [
        tenant.id,
        scopedTeamId,
        tenant.slug,
        JSON.stringify(tenant.domains || []),
        tenant.status || "active",
        JSON.stringify(tenant)
      ]
    );
    if (!result.rowCount) {
      throw new Error("Tenant is not available to this team.");
    }
    return tenant;
  }

  const store = await readFileStore();
  const index = store.tenants.findIndex(
    (item) => (item.id === tenant.id || item.slug === tenant.slug) && (item.teamId || scopedTeamId) === scopedTeamId
  );
  if (index >= 0) {
    store.tenants[index] = tenant;
  } else {
    store.tenants.push(tenant);
  }
  await writeFileStore(store);
  return tenant;
}

export async function saveTenantDraftConfig(identifier, config, { teamId } = {}) {
  const scopedTeamId = requireTeamId(teamId);
  const draft = tenantSnapshot(validateTenantConfigOrThrow(config));
  const existing = identifier ? await getTenantByIdOrSlug(identifier, { teamId: scopedTeamId }) : null;

  if (!existing) {
    const tenant = normalizeTenantConfig({
      ...draft,
      teamId: scopedTeamId,
      status: "draft",
      draftConfig: {
        ...draft,
        status: "draft"
      },
      publishedConfig: null,
      lastPublishedAt: ""
    });
    return upsertTenantConfig(tenant, { teamId: scopedTeamId });
  }

  const base = normalizeTenantConfig(existing);
  const keepPublishedTopLevel = base.status === "active" || hasConfigSnapshot(base.publishedConfig);
  const next = normalizeTenantConfig({
    ...(keepPublishedTopLevel ? base : { ...base, ...draft, status: "draft" }),
    id: base.id,
    teamId: scopedTeamId,
    draftConfig: {
      ...draft,
      id: base.id,
      status: draft.status || "draft"
    },
    publishedConfig: base.publishedConfig || null,
    lastPublishedAt: base.lastPublishedAt || ""
  });

  return upsertTenantConfig(next, { teamId: scopedTeamId });
}

export async function publishTenantConfig(identifier, { teamId } = {}) {
  const scopedTeamId = requireTeamId(teamId);
  const existing = await getTenantByIdOrSlug(identifier, { teamId: scopedTeamId });
  if (!existing) {
    throw new Error("Tenant not found.");
  }

  const draft = tenantSnapshot(getRenderableTenantConfig(existing, "draft"));
  const published = validateTenantConfigOrThrow({
    ...draft,
    id: existing.id,
    status: "active"
  });
  const publishedAt = now();
  const tenant = normalizeTenantConfig({
    ...published,
    id: existing.id,
    teamId: scopedTeamId,
    status: "active",
    draftConfig: {
      ...published,
      id: existing.id,
      status: "active"
    },
    publishedConfig: {
      ...published,
      id: existing.id,
      status: "active"
    },
    lastPublishedAt: publishedAt
  });

  return upsertTenantConfig(tenant, { teamId: scopedTeamId });
}

export async function duplicateTenantConfig(identifier, overrides = {}, { teamId } = {}) {
  const scopedTeamId = requireTeamId(teamId);
  const tenants = await listTenants({ teamId: scopedTeamId });
  const source = tenants.find((tenant) => tenant.id === identifier || tenant.slug === identifier);
  if (!source) {
    throw new Error("Tenant not found.");
  }

  const slug = uniqueTenantSlug(slugify(overrides.slug || `${source.slug}-copy`), tenants);
  const sourceDraft = tenantSnapshot(getRenderableTenantConfig(source, "draft"));
  const tenant = validateTenantConfigOrThrow(
    normalizeTenantConfig({
      ...sourceDraft,
      id: overrides.id || `tenant_${slug.replaceAll("-", "_")}`,
      teamId: scopedTeamId,
      slug,
      status: overrides.status || "draft",
      domains: overrides.domains || [`${slug}.local`],
      brand: {
        ...sourceDraft.brand,
        name: overrides.brandName || `${sourceDraft.brand?.name || "Tenant"} Copy`
      },
      draftConfig: null,
      publishedConfig: null,
      lastPublishedAt: ""
    })
  );

  return upsertTenantConfig({
    ...tenant,
    teamId: scopedTeamId,
    draftConfig: tenant,
    publishedConfig: null,
    lastPublishedAt: ""
  }, { teamId: scopedTeamId });
}

export async function createLead(input) {
  const teamId = await resolveTeamIdForTenant(input.tenantId || defaultTenant.id, input.teamId);
  const lead = normalizeLeadInput({
    ...input,
    teamId,
    id: input.id || id("lead"),
    tenantId: input.tenantId || defaultTenant.id,
    createdAt: input.createdAt || now(),
    updatedAt: now()
  });
  const pool = await ensureSchema();

  if (pool) {
    const duplicate = shouldSkipReliableDuplicate(lead, await listLeads({ tenantId: lead.tenantId, teamId }));
    if (duplicate) return { ...duplicate.lead, skippedDuplicate: true, duplicateReasons: duplicate.reasons };

    await pool.query(
      `insert into leads
       (id, team_id, tenant_id, campaign_id, batch_id, business, name, contact_title, email, phone, website_url, domain,
        address, city, region, country, category, notes, package_id, status, enrichment_status, outreach_status,
        pipeline_status, lead_score, lead_score_reason, pain_points, recommended_offer, assigned_to, google_place_id,
        google_rating, google_review_count, source_url, source_type, metadata, last_contacted_at, next_follow_up_at,
        reply_status, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34::jsonb,$35,$36,$37,$38,$39)`,
      [
        lead.id,
        teamId,
        lead.tenantId,
        lead.campaignId,
        lead.batchId,
        lead.businessName,
        lead.contactName,
        lead.contactTitle,
        lead.email,
        lead.phone,
        lead.websiteUrl,
        lead.domain,
        lead.address,
        lead.city,
        lead.region,
        lead.country,
        lead.category,
        lead.notes,
        lead.packageId,
        lead.status,
        lead.enrichmentStatus,
        lead.outreachStatus,
        lead.pipelineStatus,
        lead.leadScore,
        lead.leadScoreReason,
        lead.painPoints,
        lead.recommendedOffer,
        lead.assignedTo,
        lead.googlePlaceId,
        lead.googleRating || null,
        lead.googleReviewCount || null,
        lead.sourceUrl,
        lead.sourceType,
        JSON.stringify(lead.sourceMetadata || {}),
        lead.lastContactedAt || null,
        lead.nextFollowUpAt || null,
        lead.replyStatus || null,
        lead.createdAt,
        lead.updatedAt
      ]
    );
    return lead;
  }

  const store = await readFileStore();
  const duplicate = shouldSkipReliableDuplicate(
    lead,
    store.leads.filter((item) => (item.teamId || teamId) === teamId && item.tenantId === lead.tenantId)
  );
  if (duplicate) return { ...duplicate.lead, skippedDuplicate: true, duplicateReasons: duplicate.reasons };
  store.leads.unshift(lead);
  await writeFileStore(store);
  return lead;
}

function mapLeadRow(row) {
  return withLegacyAliases({
    id: row.id,
    teamId: row.team_id,
    tenantId: row.tenant_id,
    campaignId: row.campaign_id,
    batchId: row.batch_id,
    businessName: row.business,
    contactName: row.name,
    contactTitle: row.contact_title,
    email: row.email,
    phone: row.phone,
    website: row.website_url,
    websiteUrl: row.website_url,
    domain: row.domain,
    address: row.address,
    city: row.city,
    region: row.region,
    country: row.country,
    category: row.category,
    notes: row.notes,
    packageId: row.package_id,
    status: row.status,
    enrichmentStatus: row.enrichment_status,
    outreachStatus: row.outreach_status,
    pipelineStatus: row.pipeline_status || row.status,
    leadScore: row.lead_score,
    leadScoreReason: row.lead_score_reason,
    painPoints: row.pain_points,
    recommendedOffer: row.recommended_offer,
    assignedTo: row.assigned_to,
    googlePlaceId: row.google_place_id,
    googleRating: Number(row.google_rating || 0),
    googleReviewCount: Number(row.google_review_count || 0),
    sourceUrl: row.source_url,
    source: row.source_type,
    sourceType: row.source_type,
    sourceMetadata: row.metadata || {},
    metadata: row.metadata || {},
    lastContactedAt: row.last_contacted_at?.toISOString?.() || row.last_contacted_at || "",
    nextFollowUpAt: row.next_follow_up_at?.toISOString?.() || row.next_follow_up_at || "",
    replyStatus: row.reply_status || "",
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at
  });
}

export async function listLeads({ tenantId, teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const clauses = [];
    const params = [];
    if (teamId) {
      params.push(teamId);
      clauses.push(`team_id = $${params.length}`);
    }
    if (tenantId) {
      params.push(tenantId);
      clauses.push(`tenant_id = $${params.length}`);
    }
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const limit = teamId || tenantId ? "" : "limit 500";
    const result = await pool.query(`select * from leads ${where} order by created_at desc ${limit}`, params);
    return decorateLeadsWithDuplicates(result.rows.map(mapLeadRow));
  }
  const store = await readFileStore();
  const leads = store.leads
    .filter((lead) => !teamId || (lead.teamId || DEFAULT_TEAM_ID) === teamId)
    .filter((lead) => !tenantId || lead.tenantId === tenantId)
    .map((lead) => normalizeLeadInput(withTeamId(lead, lead.teamId)));
  return decorateLeadsWithDuplicates(leads);
}

export async function updateLeadStatus(leadId, status, { teamId } = {}) {
  return updateLead(leadId, { pipelineStatus: status, status }, { teamId });
}

export async function updateLead(leadId, updates, { teamId } = {}) {
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `update leads set
        name = coalesce($2, name),
        contact_title = coalesce($3, contact_title),
        notes = coalesce($4, notes),
        enrichment_status = coalesce($5, enrichment_status),
        outreach_status = coalesce($6, outreach_status),
        pipeline_status = coalesce($7, pipeline_status),
        status = coalesce($7, status),
        lead_score = coalesce($8, lead_score),
        lead_score_reason = coalesce($9, lead_score_reason),
        pain_points = coalesce($10, pain_points),
        recommended_offer = coalesce($11, recommended_offer),
        assigned_to = coalesce($12, assigned_to),
        last_contacted_at = coalesce($13, last_contacted_at),
        metadata = coalesce($14::jsonb, metadata),
        campaign_id = coalesce($15, campaign_id),
        next_follow_up_at = coalesce($16, next_follow_up_at),
        reply_status = coalesce($17, reply_status),
        updated_at = now()
       where id = $1
         and ($18::text is null or team_id = $18)`,
      [
        leadId,
        updates.contactName ?? updates.name ?? null,
        updates.contactTitle ?? null,
        updates.notes ?? null,
        updates.enrichmentStatus ?? null,
        updates.outreachStatus ?? null,
        updates.pipelineStatus ?? updates.status ?? null,
        updates.leadScore === undefined ? null : Number(updates.leadScore),
        updates.leadScoreReason ?? null,
        updates.painPoints ?? null,
        updates.recommendedOffer ?? null,
        updates.assignedTo ?? null,
        updates.lastContactedAt || null,
        updates.sourceMetadata || updates.metadata ? JSON.stringify(updates.sourceMetadata || updates.metadata) : null,
        updates.campaignId ?? null,
        updates.nextFollowUpAt || null,
        updates.replyStatus ?? null,
        teamId || null
      ]
    );
    return;
  }
  const store = await readFileStore();
  store.leads = store.leads.map((lead) => {
    if (lead.id !== leadId) return lead;
    if (teamId && (lead.teamId || DEFAULT_TEAM_ID) !== teamId) return lead;
    const merged = normalizeLeadInput({ ...lead, ...updates, updatedAt: now() });
    return merged;
  });
  await writeFileStore(store);
}

function normalizeBatch(input = {}) {
  return {
    id: input.id || id("batch"),
    tenantId: input.tenantId || defaultTenant.id,
    name: input.name || `${input.category || input.query || "Prospecting"} - ${input.city || "Batch"}`,
    query: input.query || [input.category, input.city].filter(Boolean).join(" in "),
    category: input.category || "",
    city: input.city || "",
    provider: input.provider || "google_places",
    status: input.status || "draft",
    maxResults: Number(input.maxResults || 20),
    enrichHunter: Boolean(input.enrichHunter),
    enrichApollo: Boolean(input.enrichApollo),
    targetRoles: input.targetRoles || [
      "owner",
      "founder",
      "marketing",
      "manager",
      "general manager",
      "director",
      "operations",
      "business development"
    ],
    previewResults: input.previewResults || [],
    counts: input.counts || {
      found: 0,
      imported: 0,
      skippedDuplicates: 0,
      enriched: 0,
      failed: 0
    },
    error: input.error || "",
    createdAt: input.createdAt || now(),
    updatedAt: input.updatedAt || now()
  };
}

function mapBatchRow(row) {
  return normalizeBatch({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    query: row.query,
    category: row.category,
    city: row.city,
    provider: row.provider,
    status: row.status,
    maxResults: row.max_results,
    enrichHunter: row.enrich_hunter,
    enrichApollo: row.enrich_apollo,
    targetRoles: row.target_roles || [],
    previewResults: row.preview_results || [],
    counts: row.counts || {},
    error: row.error,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at
  });
}

export async function createProspectingBatch(input) {
  if (input.teamId) await requireTenantAccess(input.teamId, input.tenantId || defaultTenant.id);
  const batch = normalizeBatch(input);
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into prospecting_batches
       (id, tenant_id, name, query, category, city, provider, status, max_results,
        enrich_hunter, enrich_apollo, target_roles, preview_results, counts, error, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16,$17)`,
      [
        batch.id,
        batch.tenantId,
        batch.name,
        batch.query,
        batch.category,
        batch.city,
        batch.provider,
        batch.status,
        batch.maxResults,
        batch.enrichHunter,
        batch.enrichApollo,
        JSON.stringify(batch.targetRoles),
        JSON.stringify(batch.previewResults),
        JSON.stringify(batch.counts),
        batch.error,
        batch.createdAt,
        batch.updatedAt
      ]
    );
    return batch;
  }

  const store = await readFileStore();
  store.prospectingBatches.unshift(batch);
  await writeFileStore(store);
  return batch;
}

export async function listProspectingBatches({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select prospecting_batches.*
           from prospecting_batches
           join tenants on tenants.id = prospecting_batches.tenant_id
           where tenants.team_id = $1
           order by prospecting_batches.created_at desc
           limit 100`,
          [teamId]
        )
      : await pool.query("select * from prospecting_batches order by created_at desc limit 100");
    return result.rows.map(mapBatchRow);
  }
  const store = await readFileStore();
  return filterByTeamTenant(store.prospectingBatches.map(normalizeBatch), teamId);
}

export async function getProspectingBatch(batchId, { teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select prospecting_batches.*
           from prospecting_batches
           join tenants on tenants.id = prospecting_batches.tenant_id
           where prospecting_batches.id = $1 and tenants.team_id = $2`,
          [batchId, teamId]
        )
      : await pool.query("select * from prospecting_batches where id = $1", [batchId]);
    return result.rows[0] ? mapBatchRow(result.rows[0]) : null;
  }
  const store = await readFileStore();
  const batch = store.prospectingBatches.find((item) => item.id === batchId);
  if (!batch) return null;
  const normalized = normalizeBatch(batch);
  const allowed = await filterByTeamTenant([normalized], teamId);
  return allowed[0] || null;
}

export async function updateProspectingBatch(batchId, updates, { teamId } = {}) {
  const pool = await ensureSchema();
  const normalizedUpdates = {
    ...updates,
    updatedAt: now()
  };

  if (pool) {
    await pool.query(
      `update prospecting_batches set
        status = coalesce($2, status),
        preview_results = coalesce($3::jsonb, preview_results),
        counts = coalesce($4::jsonb, counts),
        error = coalesce($5, error),
        updated_at = now()
       where id = $1
         and ($6::text is null or exists (
           select 1 from tenants
           where tenants.id = prospecting_batches.tenant_id
             and tenants.team_id = $6
         ))`,
      [
        batchId,
        normalizedUpdates.status || null,
        normalizedUpdates.previewResults ? JSON.stringify(normalizedUpdates.previewResults) : null,
        normalizedUpdates.counts ? JSON.stringify(normalizedUpdates.counts) : null,
        normalizedUpdates.error === undefined ? null : normalizedUpdates.error,
        teamId || null
      ]
    );
    return getProspectingBatch(batchId, { teamId });
  }

  const store = await readFileStore();
  const allowedTenantIds = await listTeamTenantIds(teamId);
  store.prospectingBatches = store.prospectingBatches.map((batch) =>
    batch.id === batchId && (!allowedTenantIds || allowedTenantIds.has(batch.tenantId))
      ? normalizeBatch({ ...batch, ...normalizedUpdates })
      : batch
  );
  await writeFileStore(store);
  return getProspectingBatch(batchId, { teamId });
}

export async function listContractors({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query("select * from contractors where team_id = $1 order by created_at desc", [teamId])
      : await pool.query("select * from contractors order by created_at desc");
    return result.rows;
  }
  const store = await readFileStore();
  return store.contractors
    .map((contractor) => withTeamId(contractor, contractor.teamId))
    .filter((contractor) => !teamId || contractor.teamId === teamId);
}

export async function createContractor(input) {
  const teamId = requireTeamId(input.teamId);
  const contractor = {
    id: id("contractor"),
    teamId,
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
       (id, team_id, name, email, phone, service_area, availability_notes, weekly_capacity, rate_notes, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        contractor.id,
        teamId,
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
  const teamId = await resolveTeamIdForTenant(input.tenantId, input.teamId);
  const draft = {
    id: id("draft"),
    teamId,
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
      "insert into draft_emails (id, team_id, lead_id, tenant_id, subject, body, status) values ($1,$2,$3,$4,$5,$6,$7)",
      [draft.id, teamId, draft.leadId, draft.tenantId, draft.subject, draft.body, draft.status]
    );
    return draft;
  }
  const store = await readFileStore();
  store.draftEmails.unshift(draft);
  await writeFileStore(store);
  return draft;
}

export async function listDraftEmails({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query("select * from draft_emails where team_id = $1 order by created_at desc limit 500", [teamId])
      : await pool.query("select * from draft_emails order by created_at desc limit 500");
    return result.rows;
  }
  const store = await readFileStore();
  return store.draftEmails
    .map((draft) => withTeamId(draft, draft.teamId))
    .filter((draft) => !teamId || draft.teamId === teamId);
}

function normalizeTemplate(input = {}) {
  return {
    id: input.id || id("template"),
    tenantId: input.tenantId || input.tenant_id || "",
    name: input.name || "Untitled Template",
    subject: input.subject || "",
    body: input.body || "",
    category: input.category || "",
    offerType: input.offerType || input.offer_type || "",
    isActive: input.isActive ?? input.is_active ?? true,
    system: Boolean(input.system),
    createdAt: input.createdAt || input.created_at?.toISOString?.() || input.created_at || now(),
    updatedAt: input.updatedAt || input.updated_at?.toISOString?.() || input.updated_at || now()
  };
}

function withDefaultTemplates(templates = []) {
  const existing = new Set(templates.map((template) => template.id));
  return [
    ...templates,
    ...defaultOutreachTemplates.filter((template) => !existing.has(template.id)).map(normalizeTemplate)
  ];
}

export async function listOutreachTemplates({ includeDefaults = true, teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select outreach_templates.*
           from outreach_templates
           join tenants on tenants.id = outreach_templates.tenant_id
           where tenants.team_id = $1
           order by outreach_templates.updated_at desc`,
          [teamId]
        )
      : await pool.query("select * from outreach_templates order by updated_at desc");
    const templates = result.rows.map(normalizeTemplate);
    return includeDefaults ? withDefaultTemplates(templates) : templates;
  }
  const store = await readFileStore();
  const templates = await filterByTeamTenant(store.outreachTemplates.map(normalizeTemplate), teamId);
  return includeDefaults ? withDefaultTemplates(templates) : templates;
}

export async function createOutreachTemplate(input) {
  if (input.teamId) await requireTenantAccess(input.teamId, input.tenantId);
  const template = normalizeTemplate({
    ...input,
    id: input.id || id("template"),
    createdAt: now(),
    updatedAt: now()
  });
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into outreach_templates
       (id, tenant_id, name, subject, body, category, offer_type, is_active, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        template.id,
        template.tenantId,
        template.name,
        template.subject,
        template.body,
        template.category,
        template.offerType,
        template.isActive,
        template.createdAt,
        template.updatedAt
      ]
    );
    return template;
  }

  const store = await readFileStore();
  store.outreachTemplates.unshift(template);
  await writeFileStore(store);
  return template;
}

export async function updateOutreachTemplate(templateId, updates, { teamId } = {}) {
  const pool = await ensureSchema();
  const updatedAt = now();

  if (pool) {
    await pool.query(
      `update outreach_templates set
        name = coalesce($2, name),
        subject = coalesce($3, subject),
        body = coalesce($4, body),
        category = coalesce($5, category),
       offer_type = coalesce($6, offer_type),
       is_active = coalesce($7, is_active),
       updated_at = $8
       where id = $1
         and ($9::text is null or exists (
           select 1 from tenants
           where tenants.id = outreach_templates.tenant_id
             and tenants.team_id = $9
         ))`,
      [
        templateId,
        updates.name ?? null,
        updates.subject ?? null,
        updates.body ?? null,
        updates.category ?? null,
        updates.offerType ?? null,
        updates.isActive === undefined ? null : Boolean(updates.isActive),
        updatedAt,
        teamId || null
      ]
    );
    return (await listOutreachTemplates({ includeDefaults: false, teamId })).find((item) => item.id === templateId) || null;
  }

  const store = await readFileStore();
  const allowedTenantIds = await listTeamTenantIds(teamId);
  store.outreachTemplates = store.outreachTemplates.map((template) =>
    template.id === templateId && (!allowedTenantIds || allowedTenantIds.has(template.tenantId))
      ? normalizeTemplate({ ...template, ...updates, updatedAt })
      : template
  );
  await writeFileStore(store);
  return store.outreachTemplates.find((item) => item.id === templateId) || null;
}

function normalizeCampaign(input = {}) {
  const status = campaignStatuses.includes(input.status) ? input.status : "draft";
  return {
    id: input.id || id("campaign"),
    tenantId: input.tenantId || input.tenant_id || defaultTenant.id,
    name: input.name || "Untitled Campaign",
    description: input.description || "",
    status,
    sourceFilter: input.sourceFilter || input.source_filter || "",
    cityFilter: input.cityFilter || input.city_filter || "",
    categoryFilter: input.categoryFilter || input.category_filter || "",
    dailySendCap: Number(input.dailySendCap ?? input.daily_send_cap ?? 25),
    perDomainDailyCap: Number(input.perDomainDailyCap ?? input.per_domain_daily_cap ?? 1),
    createdAt: input.createdAt || input.created_at?.toISOString?.() || input.created_at || now(),
    updatedAt: input.updatedAt || input.updated_at?.toISOString?.() || input.updated_at || now()
  };
}

export async function listOutreachCampaigns({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select outreach_campaigns.*
           from outreach_campaigns
           join tenants on tenants.id = outreach_campaigns.tenant_id
           where tenants.team_id = $1
           order by outreach_campaigns.updated_at desc`,
          [teamId]
        )
      : await pool.query("select * from outreach_campaigns order by updated_at desc");
    return result.rows.map(normalizeCampaign);
  }
  const store = await readFileStore();
  return filterByTeamTenant(store.outreachCampaigns.map(normalizeCampaign), teamId);
}

export async function createOutreachCampaign(input) {
  if (input.teamId) await requireTenantAccess(input.teamId, input.tenantId || defaultTenant.id);
  const campaign = normalizeCampaign({
    ...input,
    id: input.id || id("campaign"),
    createdAt: now(),
    updatedAt: now()
  });
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into outreach_campaigns
       (id, tenant_id, name, description, status, source_filter, city_filter, category_filter,
        daily_send_cap, per_domain_daily_cap, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        campaign.id,
        campaign.tenantId,
        campaign.name,
        campaign.description,
        campaign.status,
        campaign.sourceFilter,
        campaign.cityFilter,
        campaign.categoryFilter,
        campaign.dailySendCap,
        campaign.perDomainDailyCap,
        campaign.createdAt,
        campaign.updatedAt
      ]
    );
    return campaign;
  }

  const store = await readFileStore();
  store.outreachCampaigns.unshift(campaign);
  await writeFileStore(store);
  return campaign;
}

export async function updateOutreachCampaign(campaignId, updates, { teamId } = {}) {
  const pool = await ensureSchema();
  const updatedAt = now();

  if (pool) {
    await pool.query(
      `update outreach_campaigns set
        name = coalesce($2, name),
        description = coalesce($3, description),
        status = coalesce($4, status),
        source_filter = coalesce($5, source_filter),
        city_filter = coalesce($6, city_filter),
        category_filter = coalesce($7, category_filter),
        daily_send_cap = coalesce($8, daily_send_cap),
        per_domain_daily_cap = coalesce($9, per_domain_daily_cap),
        updated_at = $10
       where id = $1
         and ($11::text is null or exists (
           select 1 from tenants
           where tenants.id = outreach_campaigns.tenant_id
             and tenants.team_id = $11
         ))`,
      [
        campaignId,
        updates.name ?? null,
        updates.description ?? null,
        updates.status ?? null,
        updates.sourceFilter ?? null,
        updates.cityFilter ?? null,
        updates.categoryFilter ?? null,
        updates.dailySendCap === undefined ? null : Number(updates.dailySendCap),
        updates.perDomainDailyCap === undefined ? null : Number(updates.perDomainDailyCap),
        updatedAt,
        teamId || null
      ]
    );
    return (await listOutreachCampaigns({ teamId })).find((item) => item.id === campaignId) || null;
  }

  const store = await readFileStore();
  const allowedTenantIds = await listTeamTenantIds(teamId);
  store.outreachCampaigns = store.outreachCampaigns.map((campaign) =>
    campaign.id === campaignId && (!allowedTenantIds || allowedTenantIds.has(campaign.tenantId))
      ? normalizeCampaign({ ...campaign, ...updates, updatedAt })
      : campaign
  );
  await writeFileStore(store);
  return store.outreachCampaigns.find((item) => item.id === campaignId) || null;
}

function normalizeQueueItem(input = {}) {
  const status = outreachQueueStatuses.includes(input.status) ? input.status : "queued";
  return {
    id: input.id || id("queue"),
    leadId: input.leadId || input.lead_id || "",
    campaignId: input.campaignId || input.campaign_id || "",
    templateId: input.templateId || input.template_id || "",
    tenantId: input.tenantId || input.tenant_id || defaultTenant.id,
    status,
    subject: input.subject || "",
    body: input.body || "",
    recipientEmail: input.recipientEmail || input.recipient_email || "",
    senderEmail: input.senderEmail || input.sender_email || "",
    scheduledFor: input.scheduledFor || input.scheduled_for?.toISOString?.() || input.scheduled_for || now(),
    sentAt: input.sentAt || input.sent_at?.toISOString?.() || input.sent_at || "",
    failureReason: input.failureReason || input.failure_reason || "",
    resendMessageId: input.resendMessageId || input.resend_message_id || "",
    createdAt: input.createdAt || input.created_at?.toISOString?.() || input.created_at || now(),
    updatedAt: input.updatedAt || input.updated_at?.toISOString?.() || input.updated_at || now()
  };
}

export async function listOutreachQueue({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select outreach_queue.*
           from outreach_queue
           join tenants on tenants.id = outreach_queue.tenant_id
           where tenants.team_id = $1
           order by outreach_queue.created_at desc
           limit 1000`,
          [teamId]
        )
      : await pool.query("select * from outreach_queue order by created_at desc limit 1000");
    return result.rows.map(normalizeQueueItem);
  }
  const store = await readFileStore();
  return filterByTeamTenant(store.outreachQueue.map(normalizeQueueItem), teamId);
}

export async function getOutreachQueueItem(queueId, { teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select outreach_queue.*
           from outreach_queue
           join tenants on tenants.id = outreach_queue.tenant_id
           where outreach_queue.id = $1 and tenants.team_id = $2`,
          [queueId, teamId]
        )
      : await pool.query("select * from outreach_queue where id = $1", [queueId]);
    return result.rows[0] ? normalizeQueueItem(result.rows[0]) : null;
  }
  const store = await readFileStore();
  const item = store.outreachQueue.find((queueItem) => queueItem.id === queueId);
  if (!item) return null;
  const allowed = await filterByTeamTenant([normalizeQueueItem(item)], teamId);
  return allowed[0] || null;
}

export async function createOutreachQueueItem(input) {
  if (input.teamId) await requireTenantAccess(input.teamId, input.tenantId || defaultTenant.id);
  const item = normalizeQueueItem({
    ...input,
    id: input.id || id("queue"),
    createdAt: now(),
    updatedAt: now()
  });
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into outreach_queue
       (id, lead_id, campaign_id, template_id, tenant_id, status, subject, body, recipient_email, sender_email,
        scheduled_for, sent_at, failure_reason, resend_message_id, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        item.id,
        item.leadId,
        item.campaignId || null,
        item.templateId || null,
        item.tenantId,
        item.status,
        item.subject,
        item.body,
        item.recipientEmail,
        item.senderEmail,
        item.scheduledFor || null,
        item.sentAt || null,
        item.failureReason,
        item.resendMessageId,
        item.createdAt,
        item.updatedAt
      ]
    );
    return item;
  }

  const store = await readFileStore();
  store.outreachQueue.unshift(item);
  await writeFileStore(store);
  return item;
}

export async function createOutreachQueueItems(items = []) {
  const created = [];
  for (const item of items) {
    created.push(await createOutreachQueueItem(item));
  }
  return created;
}

export async function updateOutreachQueueItem(queueId, updates, { teamId } = {}) {
  const pool = await ensureSchema();
  const updatedAt = now();

  if (pool) {
    await pool.query(
      `update outreach_queue set
        status = coalesce($2, status),
        scheduled_for = coalesce($3, scheduled_for),
        sent_at = coalesce($4, sent_at),
        failure_reason = coalesce($5, failure_reason),
        resend_message_id = coalesce($6, resend_message_id),
        updated_at = $7
       where id = $1
         and ($8::text is null or exists (
           select 1 from tenants
           where tenants.id = outreach_queue.tenant_id
             and tenants.team_id = $8
         ))`,
      [
        queueId,
        updates.status ?? null,
        updates.scheduledFor || null,
        updates.sentAt || null,
        updates.failureReason ?? null,
        updates.resendMessageId ?? null,
        updatedAt,
        teamId || null
      ]
    );
    return getOutreachQueueItem(queueId, { teamId });
  }

  const store = await readFileStore();
  const allowedTenantIds = await listTeamTenantIds(teamId);
  store.outreachQueue = store.outreachQueue.map((item) =>
    item.id === queueId && (!allowedTenantIds || allowedTenantIds.has(item.tenantId))
      ? normalizeQueueItem({ ...item, ...updates, updatedAt })
      : item
  );
  await writeFileStore(store);
  return getOutreachQueueItem(queueId, { teamId });
}

function normalizeSuppression(input = {}) {
  const reason = suppressionReasons.includes(input.reason) ? input.reason : "manual";
  return {
    id: input.id || id("suppress"),
    tenantId: input.tenantId || input.tenant_id || "",
    email: String(input.email || "").trim().toLowerCase(),
    domain: String(input.domain || "").trim().toLowerCase(),
    reason,
    createdAt: input.createdAt || input.created_at?.toISOString?.() || input.created_at || now()
  };
}

export async function listOutreachSuppressions({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select outreach_suppression_list.*
           from outreach_suppression_list
           left join tenants on tenants.id = outreach_suppression_list.tenant_id
           where outreach_suppression_list.tenant_id is null
              or tenants.team_id = $1
           order by outreach_suppression_list.created_at desc`,
          [teamId]
        )
      : await pool.query("select * from outreach_suppression_list order by created_at desc");
    return result.rows.map(normalizeSuppression);
  }
  const store = await readFileStore();
  const suppressions = store.outreachSuppressionList.map(normalizeSuppression);
  const tenantIds = await listTeamTenantIds(teamId);
  if (!tenantIds) return suppressions;
  return suppressions.filter((item) => !item.tenantId || tenantIds.has(item.tenantId));
}

export async function createOutreachSuppression(input) {
  if (input.teamId && input.tenantId) await requireTenantAccess(input.teamId, input.tenantId);
  const suppression = normalizeSuppression({
    ...input,
    id: input.id || id("suppress"),
    createdAt: now()
  });
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into outreach_suppression_list (id, tenant_id, email, domain, reason, created_at)
       values ($1,$2,$3,$4,$5,$6)`,
      [
        suppression.id,
        suppression.tenantId || null,
        suppression.email || null,
        suppression.domain || null,
        suppression.reason,
        suppression.createdAt
      ]
    );
    return suppression;
  }

  const store = await readFileStore();
  const duplicate = store.outreachSuppressionList.find((item) =>
    (suppression.email && item.email === suppression.email) ||
    (suppression.domain && item.domain === suppression.domain)
  );
  if (duplicate) return normalizeSuppression(duplicate);
  store.outreachSuppressionList.unshift(suppression);
  await writeFileStore(store);
  return suppression;
}

function normalizeEvent(input = {}) {
  const type = outreachEventTypes.includes(input.type) ? input.type : "drafted";
  return {
    id: input.id || id("event"),
    leadId: input.leadId || input.lead_id || "",
    queueId: input.queueId || input.queue_id || "",
    campaignId: input.campaignId || input.campaign_id || "",
    type,
    metadata: input.metadata || {},
    createdAt: input.createdAt || input.created_at?.toISOString?.() || input.created_at || now()
  };
}

export async function listOutreachEvents({ teamId } = {}) {
  const pool = await ensureSchema();
  if (pool) {
    const result = teamId
      ? await pool.query(
          `select outreach_events.*
           from outreach_events
           join leads on leads.id = outreach_events.lead_id
           where leads.team_id = $1
           order by outreach_events.created_at desc
           limit 1000`,
          [teamId]
        )
      : await pool.query("select * from outreach_events order by created_at desc limit 1000");
    return result.rows.map(normalizeEvent);
  }
  const store = await readFileStore();
  const events = store.outreachEvents.map(normalizeEvent);
  if (!teamId) return events;
  const leads = await listLeads({ teamId });
  const leadIds = new Set(leads.map((lead) => lead.id));
  return events.filter((event) => leadIds.has(event.leadId));
}

export async function createOutreachEvent(input) {
  if (input.teamId && input.leadId) {
    const leads = await listLeads({ teamId: input.teamId });
    if (!leads.some((lead) => lead.id === input.leadId)) {
      throw new Error("Lead is not available to this team.");
    }
  }
  const event = normalizeEvent({
    ...input,
    id: input.id || id("event"),
    createdAt: now()
  });
  const pool = await ensureSchema();

  if (pool) {
    await pool.query(
      `insert into outreach_events (id, lead_id, queue_id, campaign_id, type, metadata, created_at)
       values ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [
        event.id,
        event.leadId,
        event.queueId || null,
        event.campaignId || null,
        event.type,
        JSON.stringify(event.metadata || {}),
        event.createdAt
      ]
    );
    return event;
  }

  const store = await readFileStore();
  store.outreachEvents.unshift(event);
  await writeFileStore(store);
  return event;
}
