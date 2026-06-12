import { redirect } from "next/navigation";
import { getAdminSession } from "../../lib/auth";
import {
  listContractors,
  listDraftEmails,
  listLeads,
  listTenants
} from "../../lib/store";

export const dynamic = "force-dynamic";

const statuses = [
  "new",
  "researched",
  "drafted",
  "approved",
  "sent_external",
  "replied",
  "booked",
  "won",
  "lost",
  "do_not_contact"
];

export default async function AdminPage({ searchParams }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;
  const notice = params?.notice;

  const [tenants, leads, contractors, drafts] = await Promise.all([
    listTenants(),
    listLeads(),
    listContractors(),
    listDraftEmails()
  ]);

  const leadCounts = statuses.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length
  }));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Lead Generation Control</h1>
          <p>Manage white-label funnels, leads, contractors, and outreach drafts from one place.</p>
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

      <section className="admin-grid">
        <article className="admin-panel">
          <h2>Tenant Configs</h2>
          <p>Create white-label domains from JSON. Export an existing config, edit it, then import it back.</p>
          <form action="/api/admin/tenants/import" method="post" className="admin-form">
            <textarea
              name="configJson"
              rows="14"
              defaultValue={JSON.stringify(tenants[0], null, 2)}
              required
            />
            <button className="button button--primary" type="submit">Import Config</button>
          </form>
          <div className="admin-list">
            {tenants.map((tenant) => (
              <div key={tenant.id}>
                <strong>{tenant.brand.name}</strong>
                <span>{tenant.domains.join(", ")}</span>
                <a href={`/t/${tenant.slug}`} target="_blank">Preview</a>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <h2>CSV Lead Import</h2>
          <p>Headers accepted: business, company, contact, email, phone, website, url, instagram, notes, status.</p>
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
          <p>Search local prospects through Google Places, then enrich contacts with Hunter or Apollo when API keys are configured.</p>

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
      </section>

      <section className="admin-panel">
        <h2>Lead Pipeline</h2>
        <div className="lead-table">
          <div className="lead-table__head">
            <span>Business</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Source</span>
            <span>Actions</span>
          </div>
          {leads.map((lead) => (
            <div className="lead-table__row" key={lead.id}>
              <span>
                <strong>{lead.business || "Unknown business"}</strong>
                <small>{lead.websiteUrl}</small>
              </span>
              <span>
                {lead.name || "No contact"}
                <small>{lead.email || lead.phone}</small>
              </span>
              <form action="/api/admin/leads/status" method="post">
                <input type="hidden" name="leadId" value={lead.id} />
                <select name="status" defaultValue={lead.status}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <button type="submit">Save</button>
              </form>
              <span>{lead.sourceType}</span>
              <form action="/api/admin/drafts" method="post">
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="tenantId" value={lead.tenantId} />
                <input type="hidden" name="packageId" value={lead.packageId || tenants[0]?.defaultPackageId} />
                <button className="button button--secondary" type="submit">Draft Email</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <h2>Draft Emails</h2>
        <div className="admin-list admin-list--drafts">
          {drafts.map((draft) => (
            <div key={draft.id}>
              <strong>{draft.subject}</strong>
              <pre>{draft.body}</pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
