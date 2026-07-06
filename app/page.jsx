import { headers } from "next/headers";
import DgtlMagHome from "../components/dgtlmag/DgtlMagHome";
import { resolveTemplate } from "../components/templates/registry";
import { getTenantForHost, resolveTenantMediaConfig } from "../lib/store";

export const dynamic = "force-dynamic";

function normalizeHost(host) {
  return String(host || "").split(":")[0].toLowerCase();
}

function shouldRenderDgtlMagHome(host, tenant) {
  const normalized = normalizeHost(host);
  const dgtlMagHosts = new Set([
    "dgtlmag.com",
    "www.dgtlmag.com",
    "dgtlgroup.io",
    "www.dgtlgroup.io",
    "localhost",
    "127.0.0.1"
  ]);

  return tenant?.slug === "dgtlmag" && dgtlMagHosts.has(normalized);
}

export default async function HomePage() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const tenant = await getTenantForHost(host);
  // Media-library references (mediaId) become plain src urls server-side.
  const resolved = await resolveTenantMediaConfig(tenant, { teamId: tenant.teamId });

  if (shouldRenderDgtlMagHome(host, resolved)) {
    return <DgtlMagHome />;
  }

  const { Component } = resolveTemplate(resolved);
  return <Component tenant={resolved} />;
}
