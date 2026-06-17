import { redirect } from "next/navigation";
import { AdminTabbedShell, AdminTabPanel } from "../../components/admin/AdminTabbedShell";
import OutreachQueueBuilder from "../../components/admin/OutreachQueueBuilder";
import { getAdminSession } from "../../lib/auth";
import { listAuditLogs } from "../../lib/audit";
import {
  canManageContractors,
  canManageLeads,
  canManageTenants,
  canManageUsers,
  canViewDashboard
} from "../../lib/permissions";
import {
  listContractors,
  listDraftEmails,
  listLeads,
  listOutreachCampaigns,
  listOutreachEvents,
  listOutreachQueue,
  listOutreachSuppressions,
  listOutreachTemplates,
  listProspectingBatches,
  listTenants,
  getSessionTeamId
} from "../../lib/store";
import {
  enrichmentStatuses,
  filterAndSortLeads,
  leadSources,
  outreachStatuses,
  pipelineStatuses
} from "../../lib/leadUtils";
import {
  buildOutreachMetrics,
  campaignStatuses,
  outreachQueueStatuses,
  renderOutreachTemplate,
  suppressionReasons,
  suggestFollowUpDate
} from "../../lib/outreachSequence";
import { listTeamUsers, USER_ROLES } from "../../lib/users";
import { fundingScanFromLead, isFundingScanLead, scoreFundingLead } from "../../lib/funding/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!canViewDashboard(session)) redirect("/admin/login");
  const params = await searchParams;
  const notice = params?.notice;
  const canManageLeadActions = canManageLeads(session);
  const canManageTenantActions = canManageTenants(session);
  const canManageContractorActions = canManageContractors(session);
  const teamId = getSessionTeamId(session);
  const canManageTeamUsers = canManageUsers(session) && Boolean(teamId);
  const visibleTabs = [
    ...(session.role === "contractor" ? [] : ["pipeline"]),
    ...(canManageLeadActions ? ["prospecting", "outreach"] : []),
    ...(canManageTenantActions ? ["tenants"] : []),
    ...(canManageTeamUsers || canManageContractorActions || session.role === "contractor" ? ["team"] : [])
  ];

  const [
    tenants,
    leads,
    contractors,
    drafts,
    batches,
    outreachTemplates,
    outreachCampaigns,
    outreachQueue,
    outreachSuppressions,
    outreachEvents,
    teamUsers,
    auditLogs
  ] = await Promise.all([
    listTenants({ teamId }),
    listLeads({ teamId }),
    listContractors({ teamId }),
    listDraftEmails({ teamId }),
    listProspectingBatches({ teamId }),
    listOutreachTemplates({ teamId }),
    listOutreachCampaigns({ teamId }),
    listOutreachQueue({ teamId }),
    listOutreachSuppressions({ teamId }),
    listOutreachEvents({ teamId }),
    canManageTeamUsers ? listTeamUsers(teamId) : Promise.resolve([]),
    canManageTeamUsers ? listAuditLogs({ teamId, limit: 75 }) : Promise.resolve([])
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
  const outreachMetrics = buildOutreachMetrics({ queue: outreachQueue, events: outreachEvents, leads });
  const activeTemplates = outreachTemplates.filter((template) => template.isActive !== false);
  const defaultTemplate = activeTemplates[0];
  const defaultTenant = tenants[0] || {};
  const sampleLead = filteredLeads[0] || leads[0] || {};
  const templatePreview = defaultTemplate
    ? renderOutreachTemplate(defaultTemplate, { lead: sampleLead, tenant: defaultTenant, senderName: "DGTL" })
    : null;
  const queueByLead = groupBy(outreachQueue, "leadId");
  const eventsByLead = groupBy(outreachEvents, "leadId");
  const dueFollowUps = leads.filter((lead) => {
    if (!lead.nextFollowUpAt) return false;
    return new Date(lead.nextFollowUpAt).getTime() <= Date.now();
  });
  const fundingScanLeads = leads
    .filter(isFundingScanLead)
    .map((lead) => ({
      lead,
      scan: fundingScanFromLead(lead),
      score: scoreFundingLead(lead)
    }));

  return (
    <AdminTabbedShell notice={notice} visibleTabs={visibleTabs}>
      <AdminTabPanel tabId="pipeline">
        <section className="admin-metrics v2-metrics-scroll" aria-label="Lead pipeline summary">
        {leadCounts.map((item) => (
          <article key={item.status} className="v2-metric-pill">
            <span className="v2-metric-count">{item.count}</span>
            <p className="v2-metric-label">{item.status.replaceAll("_", " ")}</p>
          </article>
        ))}
        </section>
      </AdminTabPanel>

      <AdminTabPanel tabId="pipeline">
      <section className="admin-panel admin-panel--wide">
        <div className="pipeline-header">
          <div>
            <h2>Funding Scan Leads</h2>
            <p>Review funding scan submissions, potential fit, recommended next step, and draft follow-up emails. Human review required.</p>
          </div>
          <span className="status-pill">{fundingScanLeads.length} scans</span>
        </div>

        <div className="funding-lead-list">
          {fundingScanLeads.map(({ lead, scan, score }) => (
            <article className="funding-lead-card" key={lead.id}>
              <div className="funding-lead-card__header">
                <div>
                  <h3>{lead.businessName || lead.business || "Unknown business"}</h3>
                  {lead.websiteUrl || scan.companyWebsite ? (
                    <a href={lead.websiteUrl || scan.companyWebsite} target="_blank" rel="noreferrer">
                      {lead.websiteUrl || scan.companyWebsite}
                    </a>
                  ) : (
                    <span className="muted-text">No website</span>
                  )}
                </div>
                <span className={`status-pill status-pill--${lead.pipelineStatus}`}>{lead.pipelineStatus}</span>
              </div>

              <dl className="funding-lead-stats">
                <div>
                  <dt>Potential fit</dt>
                  <dd>{score.overallFit}</dd>
                </div>
                <div>
                  <dt>Potential lane</dt>
                  <dd>{score.bestFundingLaneLabel}</dd>
                </div>
                <div>
                  <dt>Recommended next step</dt>
                  <dd>{score.recommendedOffer}</dd>
                </div>
              </dl>

              <div className="funding-gap-list">
                <strong>Human review required</strong>
                <p>This is a potential fit only. Do not confirm eligibility, funding amount, or approval without reviewing the specific funder or program administrator rules.</p>
                <strong>Readiness gaps</strong>
                {score.eligibilityGaps.length ? (
                  <ul>
                    {score.eligibilityGaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No immediate gaps from the scan inputs.</p>
                )}
              </div>

              {canManageLeadActions ? (
                <form action="/api/admin/drafts" method="post" className="inline-form">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="tenantId" value={lead.tenantId || tenants[0]?.id} />
                  <input type="hidden" name="packageId" value={lead.packageId || "funding-fit-scan"} />
                  <button className="button button--secondary" type="submit">Draft Funding Follow-Up</button>
                </form>
              ) : null}
            </article>
          ))}
          {!fundingScanLeads.length ? <p>No funding scan leads yet.</p> : null}
        </div>
      </section>
      </AdminTabPanel>

      {canManageLeadActions ? (
      <AdminTabPanel tabId="prospecting">
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
      </AdminTabPanel>
      ) : null}

      {canManageLeadActions ? (
      <AdminTabPanel tabId="outreach">
      <section className="admin-panel">
        <div className="pipeline-header">
          <div>
            <h2>Outreach Sequence V1</h2>
            <p>Queue approved B2B outreach, send selected messages through Resend, and track suppression, replies, bookings, and follow-ups.</p>
          </div>
          <span className="status-pill">{outreachQueue.length} queue items</span>
        </div>

        <div className="outreach-metrics">
          <article><span>{outreachMetrics.totalQueued}</span><p>Queued</p></article>
          <article><span>{outreachMetrics.totalApproved}</span><p>Approved</p></article>
          <article><span>{outreachMetrics.totalSent}</span><p>Sent</p></article>
          <article><span>{outreachMetrics.totalFailed}</span><p>Failed</p></article>
          <article><span>{outreachMetrics.totalSuppressedSkipped}</span><p>Suppressed / skipped</p></article>
          <article><span>{outreachMetrics.replyRate}%</span><p>Reply rate</p></article>
          <article><span>{outreachMetrics.bookedRate}%</span><p>Booked-call rate</p></article>
        </div>

        <div className="outreach-admin-grid">
          <section className="outreach-card">
            <h3>Template Library</h3>
            <form action="/api/admin/outreach/templates" method="post" className="admin-form">
              <input type="hidden" name="action" value="create" />
              <label>
                Tenant
                <select name="tenantId" defaultValue={tenants[0]?.id}>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                  ))}
                </select>
              </label>
              <input name="name" placeholder="Intro for med spas" required />
              <input name="category" placeholder="Optional category" />
              <input name="offerType" placeholder="Optional offer type" />
              <input name="subject" placeholder="Subject with {{businessName}}" required />
              <textarea name="body" rows="7" placeholder="Body with {{contactName}}, {{city}}, {{recommendedOffer}}" required />
              <button className="button button--primary" type="submit">Create Template</button>
            </form>
            <div className="outreach-list">
              {outreachTemplates.map((template) => (
                <details key={template.id} className="outreach-list-item">
                  <summary>
                    <strong>{template.name}</strong>
                    <span>{template.isActive === false ? "inactive" : template.system ? "starter" : "active"}</span>
                  </summary>
                  <pre>{renderOutreachTemplate(template, { lead: sampleLead, tenant: defaultTenant, senderName: "DGTL" }).body}</pre>
                  {!template.system ? (
                    <form action="/api/admin/outreach/templates" method="post" className="admin-form">
                      <input type="hidden" name="templateId" value={template.id} />
                      <input type="hidden" name="action" value="update" />
                      <input name="name" defaultValue={template.name} required />
                      <input name="category" defaultValue={template.category} />
                      <input name="offerType" defaultValue={template.offerType} />
                      <input name="subject" defaultValue={template.subject} required />
                      <textarea name="body" rows="6" defaultValue={template.body} required />
                      <label className="admin-check">
                        <input name="isActive" type="checkbox" defaultChecked={template.isActive !== false} />
                        Active
                      </label>
                      <button className="button button--secondary" type="submit">Save Template</button>
                    </form>
                  ) : null}
                  {!template.system && template.isActive !== false ? (
                    <form action="/api/admin/outreach/templates" method="post" className="inline-form">
                      <input type="hidden" name="templateId" value={template.id} />
                      <input type="hidden" name="action" value="deactivate" />
                      <button className="button button--secondary" type="submit">Deactivate</button>
                    </form>
                  ) : null}
                </details>
              ))}
            </div>
          </section>

          <section className="outreach-card">
            <h3>Campaigns</h3>
            <form action="/api/admin/outreach/campaigns" method="post" className="admin-form">
              <input type="hidden" name="action" value="create" />
              <label>
                Tenant
                <select name="tenantId" defaultValue={tenants[0]?.id}>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                  ))}
                </select>
              </label>
              <input name="name" placeholder="Toronto med spa outreach" required />
              <textarea name="description" rows="3" placeholder="Campaign notes" />
              <select name="status" defaultValue="draft">
                {campaignStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <input name="sourceFilter" placeholder="Optional source filter" />
              <input name="cityFilter" placeholder="Optional city filter" />
              <input name="categoryFilter" placeholder="Optional category filter" />
              <input name="dailySendCap" type="number" min="1" defaultValue="25" />
              <input name="perDomainDailyCap" type="number" min="1" defaultValue="1" />
              <button className="button button--primary" type="submit">Create Campaign</button>
            </form>
            <div className="outreach-list">
              {outreachCampaigns.map((campaign) => (
                <details key={campaign.id} className="outreach-list-item">
                  <summary>
                    <strong>{campaign.name}</strong>
                    <span>{campaign.status} | {campaign.dailySendCap}/day | {campaign.perDomainDailyCap}/domain</span>
                  </summary>
                  <form action="/api/admin/outreach/campaigns" method="post" className="admin-form">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input type="hidden" name="action" value="update" />
                    <input name="name" defaultValue={campaign.name} required />
                    <textarea name="description" rows="3" defaultValue={campaign.description} />
                    <select name="status" defaultValue={campaign.status}>
                      {campaignStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input name="sourceFilter" defaultValue={campaign.sourceFilter} />
                    <input name="cityFilter" defaultValue={campaign.cityFilter} />
                    <input name="categoryFilter" defaultValue={campaign.categoryFilter} />
                    <input name="dailySendCap" type="number" min="1" defaultValue={campaign.dailySendCap} />
                    <input name="perDomainDailyCap" type="number" min="1" defaultValue={campaign.perDomainDailyCap} />
                    <button className="button button--secondary" type="submit">Save Campaign</button>
                  </form>
                </details>
              ))}
              {!outreachCampaigns.length ? <p>No campaigns yet.</p> : null}
            </div>
          </section>
        </div>

        <section className="outreach-card outreach-card--wide">
          <div className="pipeline-header">
            <div>
              <h3>Queue Builder</h3>
              <p>Using the current lead filters: {filteredLeads.length} visible leads.</p>
            </div>
            {templatePreview ? <span className="status-pill">Preview: {templatePreview.subject}</span> : null}
          </div>
          <OutreachQueueBuilder
            leads={filteredLeads}
            tenants={tenants}
            templates={outreachTemplates}
            campaigns={outreachCampaigns}
            suppressions={outreachSuppressions}
          />
        </section>

        <div className="outreach-admin-grid">
          <section className="outreach-card">
            <h3>Approved Queue</h3>
            <form action="/api/admin/outreach/queue/send" method="post">
              <div className="outreach-list">
                {outreachQueue.slice(0, 75).map((item) => (
                  <label key={item.id} className="outreach-queue-row">
                    <input
                      type="checkbox"
                      name="queueItemId"
                      value={item.id}
                      defaultChecked={item.status === "approved"}
                      disabled={item.status !== "approved"}
                    />
                    <span>
                      <strong>{item.subject}</strong>
                      <small>{item.recipientEmail} | {item.status} | {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : "No schedule"}</small>
                      {item.failureReason ? <small>{item.failureReason}</small> : null}
                    </span>
                  </label>
                ))}
                {!outreachQueue.length ? <p>No outreach queued yet.</p> : null}
              </div>
              {outreachQueue.some((item) => item.status === "approved") ? (
                <button className="button button--primary" type="submit">Send Approved</button>
              ) : null}
            </form>
          </section>

          <section className="outreach-card">
            <h3>Suppression List</h3>
            <form action="/api/admin/outreach/suppressions" method="post" className="admin-form">
              <label>
                Tenant
                <select name="tenantId" defaultValue="">
                  <option value="">All tenants</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.brand.name}</option>
                  ))}
                </select>
              </label>
              <input name="email" type="email" placeholder="email@example.com" />
              <input name="domain" placeholder="example.com" />
              <select name="reason" defaultValue="manual">
                {suppressionReasons.map((reason) => <option key={reason} value={reason}>{reason.replaceAll("_", " ")}</option>)}
              </select>
              <button className="button button--primary" type="submit">Add Suppression</button>
            </form>
            <div className="outreach-list">
              {outreachSuppressions.slice(0, 50).map((item) => (
                <div key={item.id} className="outreach-list-row">
                  <strong>{item.email || item.domain}</strong>
                  <span>{item.reason} | {item.tenantId || "all tenants"}</span>
                </div>
              ))}
              {!outreachSuppressions.length ? <p>No suppressions yet.</p> : null}
            </div>
          </section>
        </div>

        <div className="outreach-admin-grid">
          <section className="outreach-card">
            <h3>Due Follow-ups</h3>
            <div className="outreach-list">
              {dueFollowUps.map((lead) => (
                <div key={lead.id} className="outreach-list-row">
                  <strong>{lead.businessName}</strong>
                  <span>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : "No date"} | {lead.email || "No email"}</span>
                </div>
              ))}
              {!dueFollowUps.length ? <p>No due follow-ups.</p> : null}
            </div>
          </section>

          <section className="outreach-card">
            <h3>Performance</h3>
            <div className="outreach-performance-grid">
              <MetricTable title="Sent by Source" data={outreachMetrics.sentBySource} />
              <MetricTable title="Sent by City" data={outreachMetrics.sentByCity} />
              <MetricTable title="Sent by Category" data={outreachMetrics.sentByCategory} />
              <MetricTable title="Queue Status" data={outreachMetrics.byStatus} />
            </div>
          </section>
        </div>
      </section>
      </AdminTabPanel>
      ) : null}

      <AdminTabPanel tabId="pipeline">
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
          {filteredLeads.map((lead) => {
            const leadQueue = queueByLead.get(lead.id) || [];
            const leadEvents = eventsByLead.get(lead.id) || [];
            return (
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
                    <div><dt>Last Contacted</dt><dd>{lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : "Never"}</dd></div>
                    <div><dt>Next Follow-up</dt><dd>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : "None"}</dd></div>
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
                  {canManageLeadActions ? (
                  <>
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
                      Recommended next step
                      <input name="recommendedOffer" defaultValue={lead.recommendedOffer || ""} />
                    </label>
                    <label>
                      Assigned To
                      <input name="assignedTo" defaultValue={lead.assignedTo || ""} />
                    </label>
                    <label>
                      Campaign
                      <select name="campaignId" defaultValue={lead.campaignId || ""}>
                        <option value="">No campaign</option>
                        {outreachCampaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Reply Status
                      <input name="replyStatus" defaultValue={lead.replyStatus || ""} />
                    </label>
                    <label>
                      Next Follow-up
                      <input name="nextFollowUpAt" type="date" defaultValue={lead.nextFollowUpAt ? String(lead.nextFollowUpAt).slice(0, 10) : ""} />
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

                  <div className="lead-actions">
                    <form action="/api/admin/outreach/events" method="post">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="action" value="replied" />
                      <button className="button button--secondary" type="submit">Mark Replied</button>
                    </form>
                    <form action="/api/admin/outreach/events" method="post">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="action" value="booked" />
                      <button className="button button--secondary" type="submit">Mark Booked</button>
                    </form>
                    <form action="/api/admin/outreach/events" method="post">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="action" value="do_not_contact" />
                      <button className="button button--secondary" type="submit">Do Not Contact</button>
                    </form>
                  </div>

                  <form action="/api/admin/outreach/events" method="post" className="admin-form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="action" value="follow_up" />
                    <label>
                      Follow-up Date
                      <input name="nextFollowUpAt" type="date" defaultValue={lead.nextFollowUpAt ? String(lead.nextFollowUpAt).slice(0, 10) : suggestFollowUpDate()} />
                    </label>
                    <button className="button button--secondary" type="submit">Set Follow-up</button>
                  </form>

                  <form action="/api/admin/outreach/queue" method="post" className="admin-form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="tenantId" value={lead.tenantId || tenants[0]?.id} />
                    <input type="hidden" name="queueStatus" value="queued" />
                    <input type="hidden" name="includeContacted" value="on" />
                    <label>
                      Follow-up Template
                      <select name="templateId" defaultValue={activeTemplates[1]?.id || activeTemplates[0]?.id || ""}>
                        {activeTemplates.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Sender Email
                      <input name="senderEmail" type="email" placeholder="you@approved-domain.com" />
                    </label>
                    <input name="scheduledFor" type="hidden" value={lead.nextFollowUpAt || ""} />
                    <button className="button button--secondary" type="submit">Queue Follow-up</button>
                  </form>
                  </>
                  ) : null}

                  <section className="outreach-history">
                    <h3>Outreach History</h3>
                    <div className="outreach-list">
                      {leadQueue.map((item) => (
                        <div key={item.id} className="outreach-list-row">
                          <strong>{item.subject}</strong>
                          <span>{item.status} | {item.recipientEmail} | {item.sentAt ? new Date(item.sentAt).toLocaleString() : "not sent"}</span>
                        </div>
                      ))}
                      {leadEvents.map((event) => (
                        <div key={event.id} className="outreach-list-row">
                          <strong>{event.type}</strong>
                          <span>{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                      {!leadQueue.length && !leadEvents.length ? <p>No outreach history yet.</p> : null}
                    </div>
                  </section>
                </section>
              </div>
            </details>
            );
          })}
          {!filteredLeads.length ? <p>No leads match the current filters.</p> : null}
        </div>
      </section>
      </AdminTabPanel>

      {canManageTenantActions ? (
      <AdminTabPanel tabId="tenants">
      <section className="admin-grid">
        <article className="admin-panel admin-panel--wide">
          <h2>Tenants</h2>
          <p>Review configured white-label brands and open public previews.</p>
          <div className="tenant-summary-grid">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="tenant-summary-card">
                <strong>{tenant.brand.name}</strong>
                <span>{tenant.slug} | {tenant.status}</span>
                <span>{tenant.domains.join(", ")}</span>
                <a className="button button--secondary" href={`/t/${tenant.slug}`} target="_blank">Preview</a>
              </div>
            ))}
          </div>
        </article>

      </section>
      </AdminTabPanel>
      ) : null}

      {canManageLeadActions ? (
      <AdminTabPanel tabId="pipeline">
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

      </section>
      </AdminTabPanel>
      ) : null}

      {canManageLeadActions ? (
      <AdminTabPanel tabId="prospecting">
      <section className="admin-grid">
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

      </section>
      </AdminTabPanel>
      ) : null}

      {(canManageTeamUsers || canManageContractorActions || session.role === "contractor") ? (
      <AdminTabPanel tabId="team">
      <section className="admin-grid">
        {canManageTeamUsers ? (
        <article className="admin-panel admin-panel--wide">
          <div className="pipeline-header">
            <div>
              <h2>Team Credentials</h2>
              <p>Create database-backed logins, update roles, and activate or deactivate access for {session.team.name}.</p>
            </div>
            <span className="status-pill">{teamUsers.length} users</span>
          </div>

          <form action="/api/admin/users" method="post" className="admin-form team-user-form">
            <input type="hidden" name="action" value="create" />
            <input type="hidden" name="teamId" value={session.team.id} />
            <label>
              Name
              <input name="name" placeholder="Team member name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="teammate@example.com" required />
            </label>
            <label>
              Temporary Password
              <input name="password" type="password" minLength="12" placeholder="At least 12 characters" required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="viewer" required>
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <button className="button button--primary" type="submit">Create Credential</button>
          </form>

          <div className="team-users-table" role="table" aria-label="Team users">
            <div className="team-users-table__row team-users-table__row--head" role="row">
              <span role="columnheader">Name</span>
              <span role="columnheader">Email</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Created</span>
              <span role="columnheader">Actions</span>
            </div>
            {teamUsers.map((user) => (
              <div key={user.id} className="team-users-table__row" role="row">
                <span role="cell"><strong>{user.name || "No name"}</strong></span>
                <span role="cell">{user.email}</span>
                <span role="cell">
                  <form action="/api/admin/users" method="post" className="inline-form team-role-form">
                    <input type="hidden" name="action" value="update_role" />
                    <input type="hidden" name="teamId" value={session.team.id} />
                    <input type="hidden" name="userId" value={user.id} />
                    <select name="role" defaultValue={user.role}>
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <button className="button button--secondary" type="submit">Save</button>
                  </form>
                </span>
                <span role="cell">
                  <span className={`status-pill status-pill--${user.status}`}>{user.status}</span>
                </span>
                <span role="cell">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</span>
                <span role="cell">
                  <form action="/api/admin/users" method="post" className="inline-form">
                    <input type="hidden" name="action" value={user.status === "active" ? "deactivate" : "reactivate"} />
                    <input type="hidden" name="teamId" value={session.team.id} />
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      className="button button--secondary"
                      type="submit"
                      disabled={user.id === session.user?.id && user.status === "active"}
                    >
                      {user.status === "active" ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </span>
              </div>
            ))}
            {!teamUsers.length ? <p>No team users yet.</p> : null}
          </div>
        </article>
        ) : null}

        {canManageTeamUsers ? (
        <article className="admin-panel admin-panel--wide">
          <div className="pipeline-header">
            <div>
              <h2>Audit Log</h2>
              <p>Recent team administration and sales operations.</p>
            </div>
            <span className="status-pill">{auditLogs.length} events</span>
          </div>
          <div className="team-users-table audit-log-table" role="table" aria-label="Audit log">
            <div className="team-users-table__row team-users-table__row--head" role="row">
              <span role="columnheader">Time</span>
              <span role="columnheader">User</span>
              <span role="columnheader">Action</span>
              <span role="columnheader">Target</span>
              <span role="columnheader">Metadata</span>
            </div>
            {auditLogs.map((event) => (
              <div key={event.id} className="team-users-table__row audit-log-table__row" role="row">
                <span role="cell">{event.createdAt ? new Date(event.createdAt).toLocaleString() : "Unknown"}</span>
                <span role="cell">{event.userName || event.userEmail || event.userId || "Unknown"}</span>
                <span role="cell"><strong>{event.action}</strong></span>
                <span role="cell">{[event.targetType, event.targetId].filter(Boolean).join(": ") || "None"}</span>
                <span role="cell"><code>{JSON.stringify(event.metadata || {})}</code></span>
              </div>
            ))}
            {!auditLogs.length ? <p>No audit events yet.</p> : null}
          </div>
        </article>
        ) : null}

        <article className="admin-panel">
          <h2>Contractor Capacity</h2>
          <p>Track delivery partners, service area, capacity, and rate notes before assigning booked work.</p>
          {canManageContractorActions ? (
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
          ) : null}
          <div className="admin-list">
            {contractors.map((contractor) => (
              <div key={contractor.id}>
                <strong>{contractor.name}</strong>
                <span>{contractor.service_area || contractor.serviceArea || "No service area yet"}</span>
              </div>
            ))}
          </div>
        </article>

        {canManageLeadActions ? (
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
        ) : null}
      </section>
      </AdminTabPanel>
      ) : null}
    </AdminTabbedShell>
  );
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = item[key] || "";
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
  }
  return groups;
}

function MetricTable({ title, data }) {
  const rows = Object.entries(data || {}).filter(([, count]) => count);
  return (
    <div className="metric-table">
      <strong>{title}</strong>
      {rows.map(([label, count]) => (
        <span key={label}>{label}: {count}</span>
      ))}
      {!rows.length ? <span>No sent data yet.</span> : null}
    </div>
  );
}
