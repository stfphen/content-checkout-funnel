import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/auth";
import {
  listContractors,
  listDraftEmails,
  listLeads,
  listProspectingBatches,
  listTenants
} from "../../lib/store";
import {
  enrichmentStatuses,
  filterAndSortLeads,
  leadSources,
  outreachStatuses,
  pipelineStatuses
} from "../../lib/leadUtils";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;
  const notice = params?.notice;

  const [tenants, leads, contractors, drafts, batches] = await Promise.all([
    listTenants(),
    listLeads(),
    listContractors(),
    listDraftEmails(),
    listProspectingBatches()
  ]);

  const leadFilters = {
    query: params?.q || "",
    city: params?.city || "",
    category: params?.category || "",
    source: params?.source || "",
    enrichmentStatus: params?.enrichmentStatus || "",
    outreachStatus: params?.outreachStatus || "",
    pipelineStatus: params?.pipelineStatus || "",
    sort: params?.sort || "created_desc"
  };
  const filteredLeads = filterAndSortLeads(leads, leadFilters);
  const selectedBatch = batches.find((batch) => batch.id === params?.batchId) || batches[0];
  const exportQuery = new URLSearchParams(
    Object.fromEntries(Object.entries(leadFilters).filter(([, value]) => value))
  ).toString();

  const leadCounts = pipelineStatuses.map((status) => ({
    status,
    count: leads.filter((lead) => lead.pipelineStatus === status).length
  }));
  const cities = uniqueOptions(leads.map((lead) => lead.city));
  const categories = uniqueOptions(leads.map((lead) => lead.category));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Lead Generation Control</h1>
          <p>Manage white-label funnels, prospects, leads, contractors, and outreach drafts from one place.</p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="button button--secondary" type="submit">Logout</button>
        </form>
      </header>

      {notice ? <div className="admin-notice">{notice}</div> : null}

      <section className="admin-metrics" aria-label="Lead pipeline summary">
        {leadCounts.map((item) => (
          <article key={item.status}>
            <span>{item.count}</span>
            <p>{item.status.replaceAll("_", " ")}</p>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <h2>Prospecting Batch Builder</h2>
        <p>Create a search batch, preview Google Places results, then import selected prospects into the pipeline.</p>

        <div className="batch-builder">
          <form action="/api/admin/prospecting/batches" method="post" className="admin-form batch-builder__form">
            <label>
              Tenant
              <select name="tenantId" defaultValue={tenants[0]?.id}>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                ))}
              </select>
            </label>
            <label>
              Batch Name
              <input name="name" placeholder="Toronto med spas - June batch" required />
            </label>
            <label>
              Search Query
              <input name="query" placeholder="med spas in Toronto" />
            </label>
            <label>
              Category
              <input name="category" placeholder="med spas" />
            </label>
            <label>
              City / Location
              <input name="city" placeholder="Toronto" />
            </label>
            <label>
              Max Results
              <input name="maxResults" type="number" min="1" max="20" defaultValue="20" />
            </label>
            <label className="admin-check">
              <input name="enrichHunter" type="checkbox" />
              Enrich domains with Hunter when available
            </label>
            <label className="admin-check">
              <input name="enrichApollo" type="checkbox" />
              Find Apollo decision-maker profiles when available
            </label>
            <button className="button button--primary" type="submit">Create Preview Batch</button>
          </form>

          <div className="batch-history">
            <h3>Recent Batches</h3>
            <div className="admin-list">
              {batches.map((batch) => (
                <a key={batch.id} href={`/admin?batchId=${batch.id}`}>
                  <strong>{batch.name}</strong>
                  <span>
                    {batch.status} | found {batch.counts.found || 0} | imported {batch.counts.imported || 0} | skipped {batch.counts.skippedDuplicates || 0}
                  </span>
                </a>
              ))}
              {!batches.length ? <p>No batches yet.</p> : null}
            </div>
          </div>
        </div>

        {selectedBatch ? (
          <div className="batch-preview">
            <div className="batch-preview__header">
              <div>
                <h3>{selectedBatch.name}</h3>
                <p>{selectedBatch.query} | {selectedBatch.status}</p>
              </div>
              <span>{selectedBatch.previewResults.length} preview results</span>
            </div>
            {selectedBatch.error ? <p className="admin-error">{selectedBatch.error}</p> : null}
            <form action="/api/admin/prospecting/batches/import" method="post">
              <input type="hidden" name="batchId" value={selectedBatch.id} />
              <div className="preview-grid">
                {selectedBatch.previewResults.map((prospect, index) => (
                  <label key={`${prospect.googlePlaceId || prospect.businessName}-${index}`} className="preview-card">
                    <input type="checkbox" name="selected" value={index} defaultChecked />
                    <strong>{prospect.businessName || prospect.business}</strong>
                    <span>{prospect.category || "No category"} | {prospect.city || selectedBatch.city || "No city"}</span>
                    <small>{prospect.website || prospect.url || prospect.phone || "No website or phone"}</small>
                  </label>
                ))}
                {!selectedBatch.previewResults.length ? <p>No preview results yet.</p> : null}
              </div>
              {selectedBatch.previewResults.length ? (
                <button className="button button--primary" type="submit">Import Selected Prospects</button>
              ) : null}
            </form>
          </div>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="pipeline-header">
          <div>
            <h2>Lead Pipeline</h2>
            <p>{filteredLeads.length} visible leads from {leads.length} total.</p>
          </div>
          <a className="button button--secondary" href={`/api/admin/leads/export${exportQuery ? `?${exportQuery}` : ""}`}>
            Export Filtered CSV
          </a>
        </div>

        <form action="/admin" method="get" className="lead-filters">
          <input name="q" placeholder="Search business, contact, city, notes" defaultValue={leadFilters.query} />
          <select name="city" defaultValue={leadFilters.city}>
            <option value="">All cities</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <select name="category" defaultValue={leadFilters.category}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select name="source" defaultValue={leadFilters.source}>
            <option value="">All sources</option>
            {leadSources.map((source) => <option key={source} value={source}>{source.replaceAll("_", " ")}</option>)}
          </select>
          <select name="enrichmentStatus" defaultValue={leadFilters.enrichmentStatus}>
            <option value="">All enrichment</option>
            {enrichmentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
          <select name="outreachStatus" defaultValue={leadFilters.outreachStatus}>
            <option value="">All outreach</option>
            {outreachStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
          <select name="pipelineStatus" defaultValue={leadFilters.pipelineStatus}>
            <option value="">All pipeline</option>
            {pipelineStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
          <select name="sort" defaultValue={leadFilters.sort}>
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="score_desc">Score high to low</option>
            <option value="score_asc">Score low to high</option>
            <option value="city">City</option>
            <option value="source">Source</option>
            <option value="status">Status</option>
          </select>
          <button className="button button--primary" type="submit">Apply</button>
        </form>

        <div className="lead-control-list">
          {filteredLeads.map((lead) => (
            <details className="lead-card" key={lead.id}>
              <summary>
                <span>
                  <strong>{lead.businessName || lead.business || "Unknown business"}</strong>
                  <small>{lead.city || "No city"} | {lead.category || "No category"} | {lead.sourceType}</small>
                </span>
                <span className="lead-score">Score {lead.leadScore || 0}</span>
                <span className={`status-pill status-pill--${lead.pipelineStatus}`}>{lead.pipelineStatus}</span>
                {lead.possibleDuplicates?.length ? <span className="duplicate-pill">Possible duplicate</span> : null}
              </summary>

              <div className="lead-detail-grid">
                <section>
                  <h3>Lead Detail</h3>
                  <dl className="lead-facts">
                    <div><dt>Contact</dt><dd>{lead.contactName || "None"} {lead.contactTitle ? `| ${lead.contactTitle}` : ""}</dd></div>
                    <div><dt>Email</dt><dd>{lead.email || "None"}</dd></div>
                    <div><dt>Phone</dt><dd>{lead.phone || "None"}</dd></div>
                    <div><dt>Website</dt><dd>{lead.websiteUrl || "None"}</dd></div>
                    <div><dt>Address</dt><dd>{lead.address || "None"}</dd></div>
                    <div><dt>Batch</dt><dd>{lead.batchId || "None"}</dd></div>
                    <div><dt>Google</dt><dd>{lead.googleRating || 0} rating | {lead.googleReviewCount || 0} reviews</dd></div>
                  </dl>

                  {lead.possibleDuplicates?.length ? (
                    <div className="duplicate-review">
                      <strong>Possible duplicates</strong>
                      {lead.possibleDuplicates.map((duplicate) => (
                        <p key={duplicate.id}>{duplicate.businessName}: {duplicate.reasons.join(", ")}</p>
                      ))}
                    </div>
                  ) : null}

                  <h3>Source Metadata</h3>
                  <pre className="metadata-preview">{JSON.stringify(lead.sourceMetadata || lead.metadata || {}, null, 2)}</pre>
                </section>

                <section>
                  <h3>Edit Pipeline Fields</h3>
                  <form action="/api/admin/leads/update" method="post" className="admin-form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="redirectTo" value={`/admin${exportQuery ? `?${exportQuery}` : ""}`} />
                    <label>
                      Contact Name
                      <input name="contactName" defaultValue={lead.contactName || ""} />
                    </label>
                    <label>
                      Contact Title
                      <input name="contactTitle" defaultValue={lead.contactTitle || ""} />
                    </label>
                    <label>
                      Pipeline Status
                      <select name="pipelineStatus" defaultValue={lead.pipelineStatus}>
                        {pipelineStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                      </select>
                    </label>
                    <label>
                      Outreach Status
                      <select name="outreachStatus" defaultValue={lead.outreachStatus}>
                        {outreachStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                      </select>
                    </label>
                    <label>
                      Enrichment Status
                      <select name="enrichmentStatus" defaultValue={lead.enrichmentStatus}>
                        {enrichmentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                      </select>
                    </label>
                    <label>
                      Lead Score
                      <input name="leadScore" type="number" defaultValue={lead.leadScore || 0} />
                    </label>
                    <label>
                      Score Reason
                      <textarea name="leadScoreReason" rows="3" defaultValue={lead.leadScoreReason || ""} />
                    </label>
                    <label>
                      Pain Points
                      <textarea name="painPoints" rows="3" defaultValue={lead.painPoints || ""} />
                    </label>
                    <label>
                      Recommended Offer
                      <input name="recommendedOffer" defaultValue={lead.recommendedOffer || ""} />
                    </label>
                    <label>
                      Assigned To
                      <input name="assignedTo" defaultValue={lead.assignedTo || ""} />
                    </label>
                    <label>
                      Notes
                      <textarea name="notes" rows="4" defaultValue={lead.notes || ""} />
                    </label>
                    <button className="button button--primary" type="submit">Save Lead</button>
                  </form>

                  <form action="/api/admin/drafts" method="post" className="admin-form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="tenantId" value={lead.tenantId} />
                    <input type="hidden" name="packageId" value={lead.packageId || tenants[0]?.defaultPackageId} />
                    <button className="button button--secondary" type="submit">Generate Draft Email</button>
                  </form>
                </section>
              </div>
            </details>
          ))}
          {!filteredLeads.length ? <p>No leads match the current filters.</p> : null}
        </div>
      </section>

      <section className="admin-grid">
        <article className="admin-panel">
          <h2>CSV Lead Import</h2>
          <p>Headers accepted: business, contact, contact_title, email, phone, website, domain, address, city, province, country, category, notes, status.</p>
          <form action="/api/admin/leads/import" method="post" className="admin-form">
            <label>
              Tenant
              <select name="tenantId" defaultValue={tenants[0]?.id}>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                ))}
              </select>
            </label>
            <textarea name="csv" rows="10" placeholder="business,contact,email,phone,website,notes" required />
            <button className="button button--primary" type="submit">Import Leads</button>
          </form>
        </article>

        <article className="admin-panel">
          <h2>API Prospecting</h2>
          <p>Quick one-off provider actions. Use the batch builder above for daily acquisition work.</p>

          <div className="api-provider-stack">
            <form action="/api/admin/prospecting/google" method="post" className="admin-form api-provider-card">
              <h3>Google Places Search</h3>
              <label>
                Tenant
                <select name="tenantId" defaultValue={tenants[0]?.id}>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Search Query
                <input name="query" placeholder="med spas in Toronto" required />
              </label>
              <button className="button button--primary" type="submit">Find Prospects</button>
            </form>

            <div className="api-provider-grid">
              <form action="/api/admin/prospecting/hunter" method="post" className="admin-form api-provider-card">
                <h3>Hunter Domain Search</h3>
                <label>
                  Tenant
                  <select name="tenantId" defaultValue={tenants[0]?.id}>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Domain
                  <input name="domain" placeholder="example.com" required />
                </label>
                <button className="button button--secondary" type="submit">Enrich with Hunter</button>
              </form>

              <form action="/api/admin/prospecting/apollo" method="post" className="admin-form api-provider-card">
                <h3>Apollo Person Search</h3>
                <label>
                  Tenant
                  <select name="tenantId" defaultValue={tenants[0]?.id}>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Domain
                  <input name="domain" placeholder="example.com" required />
                </label>
                <label>
                  Titles
                  <input name="titles" placeholder="owner, founder, marketing manager" />
                </label>
                <button className="button button--secondary" type="submit">Enrich with Apollo</button>
              </form>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <h2>Contractor Capacity</h2>
          <p>Track delivery partners, service area, capacity, and rate notes before assigning booked work.</p>
          <form action="/api/admin/contractors" method="post" className="admin-form">
            <input name="name" placeholder="Contractor name" required />
            <input name="email" type="email" placeholder="email@example.com" />
            <input name="phone" placeholder="Phone" />
            <input name="serviceArea" placeholder="Toronto / GTA / Kitchener" />
            <input name="weeklyCapacity" type="number" min="0" placeholder="Weekly shoot capacity" />
            <textarea name="availabilityNotes" rows="3" placeholder="Availability notes" />
            <textarea name="rateNotes" rows="3" placeholder="Rate and margin notes" />
            <button className="button button--primary" type="submit">Add Contractor</button>
          </form>
          <div className="admin-list">
            {contractors.map((contractor) => (
              <div key={contractor.id}>
                <strong>{contractor.name}</strong>
                <span>{contractor.service_area || contractor.serviceArea || "No service area yet"}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <h2>Draft Emails</h2>
          <div className="admin-list admin-list--drafts">
            {drafts.map((draft) => (
              <div key={draft.id}>
                <strong>{draft.subject}</strong>
                <pre>{draft.body}</pre>
              </div>
            ))}
            {!drafts.length ? <p>No draft emails yet.</p> : null}
          </div>
        </article>
      </section>
    </main>
  );
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
