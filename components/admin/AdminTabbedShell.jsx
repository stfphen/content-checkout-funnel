"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Landmark,
  Search,
  Mail,
  Phone,
  Building2,
  UsersRound,
  Briefcase,
  LogOut,
  Sun,
  Moon,
  MoreHorizontal,
} from "lucide-react";

const AdminTabsContext = createContext("pipeline");

const ICON_PROPS = { size: 24, strokeWidth: 2, "aria-hidden": true };

const navItems = [
  { id: "pipeline", label: "Pipeline", icon: <Users {...ICON_PROPS} /> },
  { id: "funding", label: "Funding", icon: <Landmark {...ICON_PROPS} /> },
  { id: "prospecting", label: "Prospecting", icon: <Search {...ICON_PROPS} /> },
  { id: "accounts", label: "Accounts", icon: <Briefcase {...ICON_PROPS} /> },
  { id: "outreach", label: "Outreach", icon: <Mail {...ICON_PROPS} /> },
  { id: "calls", label: "Calls", icon: <Phone {...ICON_PROPS} /> },
  { id: "tenants", label: "Tenants", icon: <Building2 {...ICON_PROPS} /> },
  { id: "team", label: "Team", icon: <UsersRound {...ICON_PROPS} /> },
];

// Light/dark theme for the admin shell only. Resolved after mount (so SSR markup
// matches the first client render — no hydration mismatch), persisted to
// localStorage, and defaulted from the OS preference. While unresolved the shell
// is hidden via CSS (.v2-admin-shell:not([data-theme])) to avoid a flash.
function useAdminTheme() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    let initial = null;
    try {
      initial = localStorage.getItem("admin-theme");
    } catch {
      initial = null;
    }
    if (initial !== "light" && initial !== "dark") {
      initial = window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (!theme) return;
    try {
      localStorage.setItem("admin-theme", theme);
    } catch {
      /* ignore persistence failures (private mode, etc.) */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggle];
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  );
}

export function AdminTabbedShell({ notice, children, visibleTabs }) {
  const visibleNavItems = useMemo(() => {
    if (!visibleTabs?.length) return navItems;
    return navItems.filter((item) => visibleTabs.includes(item.id));
  }, [visibleTabs]);
  const [activeTab, setActiveTab] = useState(visibleNavItems[0]?.id || "pipeline");
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, toggleTheme] = useAdminTheme();
  const activeItem = useMemo(
    () => visibleNavItems.find((item) => item.id === activeTab) || visibleNavItems[0] || navItems[0],
    [activeTab, visibleNavItems]
  );

  // Mobile shows at most 5 bottom-bar slots: keep up to 4 primary tabs visible
  // and tuck the rest into a "More" sheet. Desktop renders every item in the
  // sidebar (the overflow group becomes display:contents there).
  const hasOverflow = visibleNavItems.length > 5;
  const primaryCount = hasOverflow ? 4 : visibleNavItems.length;
  const primaryItems = visibleNavItems.slice(0, primaryCount);
  const overflowItems = visibleNavItems.slice(primaryCount);
  const activeInOverflow = overflowItems.some((item) => item.id === activeTab);

  const selectTab = (id) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  const renderNavButton = (item) => (
    <button
      key={item.id}
      type="button"
      className={`v2-nav-item ${activeTab === item.id ? "is-active" : ""}`}
      aria-current={activeTab === item.id ? "page" : undefined}
      aria-controls={`admin-tab-${item.id}`}
      onClick={() => selectTab(item.id)}
    >
      {item.icon}
      <span>{item.label}</span>
    </button>
  );

  return (
    <AdminTabsContext.Provider value={activeTab}>
      <div className="v2-admin-shell" data-active-tab={activeTab} data-theme={theme || undefined}>
        {moreOpen ? (
          <button
            type="button"
            className="v2-nav-scrim"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
        ) : null}
        <nav
          className={`v2-nav-container ${moreOpen ? "is-more-open" : ""}`}
          aria-label="Admin navigation"
        >
          {primaryItems.map(renderNavButton)}
          {hasOverflow ? (
            <button
              type="button"
              className={`v2-nav-item v2-nav-more ${activeInOverflow ? "is-active" : ""}`}
              aria-haspopup="true"
              aria-expanded={moreOpen}
              aria-controls="v2-nav-overflow"
              onClick={() => setMoreOpen((open) => !open)}
            >
              <MoreHorizontal {...ICON_PROPS} />
              <span>More</span>
            </button>
          ) : null}
          {hasOverflow ? (
            <div className="v2-nav-overflow" id="v2-nav-overflow">
              {overflowItems.map(renderNavButton)}
            </div>
          ) : null}
          <form action="/api/admin/logout" method="post" className="desktop-only v2-nav-logout">
            <button className="v2-nav-item v2-nav-item--danger" type="submit">
              <LogOut {...ICON_PROPS} />
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
            <div className="admin-header__actions">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <form action="/api/admin/logout" method="post">
                <button className="button button--secondary" type="submit">Logout</button>
              </form>
            </div>
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
  const reduceMotion = useReducedMotion();
  if (activeTab !== tabId) return null;

  return (
    <motion.div
      id={`admin-tab-${tabId}`}
      className="admin-tab-panel"
      data-tab-panel={tabId}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
