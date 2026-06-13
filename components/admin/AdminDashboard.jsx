"use client";

import { useState } from "react";

export default function AdminDashboard({
  tenants,
  leads,
  contractors,
  drafts,
  statuses,
  leadCounts,
  notice
}) {
  const [activeTab, setActiveTab] = useState("leads");

  const navItems = [
    { id: "leads", label: "Leads", icon: <LeadIcon /> },
    { id: "prospecting", label: "Prospecting", icon: <SearchIcon /> },
    { id: "tenants", label: "Tenants", icon: <TenantIcon /> },
    { id: "contractors", label: "Team", icon: <TeamIcon /> }
  ];

  return (
    <div className="v2-admin-shell">
      <nav className="v2-nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`v2-nav-item ${activeTab === item.id ? "is-active" : ""}`}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <form action="/api/admin/logout" method="post" className="desktop-only" style={{ marginTop: "auto", width: "100%" }}>
          <button className="v2-nav-item" type="submit" style={{ color: "#ff3b30" }}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </form>
      </nav>

      <main className="v2-dashboard-main">
        {notice ? <div className="admin-notice">{notice}</div> : null}

        {activeTab === "leads" ? (
          <section>
            <div className="v2-view-header">
              <p className="eyebrow">Pipeline</p>
              <h1>Lead Management</h1>
            </div>

            <div className="v2-metrics-scroll">
              {leadCounts.map((item) => (
                <article key={item.status} className="v2-metric-pill">
                  <span className="v2-metric-count">{item.count}</span>
                  <p className="v2-metric-label">{item.status.replaceAll("_", " ")}</p>
                </article>
              ))}
            </div>

            <div className="v2-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="v2-table-wrapper">
                <table className="v2-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="v2-cell-business">
                            <strong>{lead.business || lead.businessName || "Unknown"}</strong>
                            <small>{lead.name || lead.contactName || "No contact"}</small>
                          </div>
                        </td>
                        <td>
                          <form action="/api/admin/leads/status" method="post">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <select name="status" defaultValue={lead.status} className="v2-status-select">
                              {statuses.map((status) => (
                                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                              ))}
                            </select>
                            <button className="v2-inline-save" type="submit">Save</button>
                          </form>
                        </td>
                        <td>
                          <form action="/api/admin/drafts" method="post">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input type="hidden" name="tenantId" value={lead.tenantId} />
                            <input type="hidden" name="packageId" value={lead.packageId || tenants[0]?.defaultPackageId} />
                            <button className="v2-action-button" type="submit">
                              <DraftIcon />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "prospecting" ? (
          <section>
            <div className="v2-view-header">
              <p className="eyebrow">Prospecting</p>
              <h1>Prospecting Tools</h1>
            </div>
            <div className="v2-card">
              <p>Use the server-rendered admin batch builder for Google Places preview/import workflows.</p>
            </div>
          </section>
        ) : null}

        {activeTab === "tenants" ? (
          <section>
            <div className="v2-view-header">
              <p className="eyebrow">White Label</p>
              <h1>Preview and Publish</h1>
            </div>
            <div className="tenant-publish-list">
              {tenants.map((tenant) => (
                <article className="v2-card tenant-publish-card" key={tenant.id}>
                  <div>
                    <strong>{tenant.brand?.name || tenant.slug}</strong>
                    <span>{tenant.slug} · {tenant.status}</span>
                    <small>{tenant.lastPublishedAt ? `Last published ${tenant.lastPublishedAt}` : "Not published yet"}</small>
                  </div>
                  <div className="tenant-publish-card__actions">
                    <a href={`/t/${tenant.slug}?mode=draft`} target="_blank">Draft preview</a>
                    <a href={`/t/${tenant.slug}?mode=published`} target="_blank">Published preview</a>
                    <a href={`/api/admin/tenants/export?id=${encodeURIComponent(tenant.id)}`}>Export</a>
                    <form action="/api/admin/tenants/publish" method="post">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <button className="button button--primary" type="submit">Publish Draft</button>
                    </form>
                    <form action="/api/admin/tenants/duplicate" method="post">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <button className="button button--secondary" type="submit">Duplicate</button>
                    </form>
                  </div>
                </article>
              ))}
              {!tenants.length ? <div className="v2-card"><p>No tenants found.</p></div> : null}
            </div>
          </section>
        ) : null}

        {activeTab === "contractors" ? (
          <section>
            <div className="v2-view-header">
              <p className="eyebrow">Delivery</p>
              <h1>Team Capacity</h1>
            </div>
            <div className="v2-card">
              <p>{contractors.length} contractors tracked. {drafts.length} draft emails generated.</p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function LeadIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function TenantIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
