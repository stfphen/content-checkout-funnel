"use client";

import { createContext, useContext, useMemo, useState } from "react";

const AdminTabsContext = createContext("pipeline");

const navItems = [
  { id: "pipeline", label: "Pipeline", icon: <LeadIcon /> },
  { id: "prospecting", label: "Prospecting", icon: <SearchIcon /> },
  { id: "outreach", label: "Outreach", icon: <MailIcon /> },
  { id: "tenants", label: "Tenants", icon: <TenantIcon /> },
  { id: "team", label: "Team", icon: <TeamIcon /> }
];

export function AdminTabbedShell({ notice, children, visibleTabs }) {
  const visibleNavItems = useMemo(() => {
    if (!visibleTabs?.length) return navItems;
    return navItems.filter((item) => visibleTabs.includes(item.id));
  }, [visibleTabs]);
  const [activeTab, setActiveTab] = useState(visibleNavItems[0]?.id || "pipeline");
  const activeItem = useMemo(
    () => visibleNavItems.find((item) => item.id === activeTab) || visibleNavItems[0] || navItems[0],
    [activeTab, visibleNavItems]
  );

  return (
    <AdminTabsContext.Provider value={activeTab}>
      <div className="v2-admin-shell" data-active-tab={activeTab}>
        <nav className="v2-nav-container" aria-label="Admin navigation">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`v2-nav-item ${activeTab === item.id ? "is-active" : ""}`}
              aria-current={activeTab === item.id ? "page" : undefined}
              aria-controls={`admin-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <form action="/api/admin/logout" method="post" className="desktop-only v2-nav-logout">
            <button className="v2-nav-item v2-nav-item--danger" type="submit">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </form>
        </nav>

        <main className="v2-dashboard-main admin-shell">
          <header className="admin-header v2-view-header">
            <div>
              <p className="eyebrow">Admin Dashboard</p>
              <h1>{activeItem.label}</h1>
              <p>Manage white-label funnels, prospects, leads, contractors, and outreach drafts from one place.</p>
            </div>
            <form action="/api/admin/logout" method="post">
              <button className="button button--secondary" type="submit">Logout</button>
            </form>
          </header>

          {notice ? <div className="admin-notice">{notice}</div> : null}
          {children}
        </main>
      </div>
    </AdminTabsContext.Provider>
  );
}

export function AdminTabPanel({ tabId, children }) {
  const activeTab = useContext(AdminTabsContext);
  if (activeTab !== tabId) return null;

  return (
    <div id={`admin-tab-${tabId}`} className="admin-tab-panel" data-tab-panel={tabId}>
      {children}
    </div>
  );
}

function LeadIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0v1H5a2 2 0 00-2 2v2h18v-2a2 2 0 00-2-2h-3v-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 6 8-6" />
    </svg>
  );
}

function TenantIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V6a2 2 0 012-2h12a2 2 0 012 2v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-6h6v6M8 8h.01M12 8h.01M16 8h.01M8 11h.01M16 11h.01" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5M15 12H3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v18" />
    </svg>
  );
}
