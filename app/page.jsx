import { headers } from "next/headers";
import FunnelPage from "../components/FunnelPage";
import { getTenantForHost, resolveTenantMediaConfig } from "../lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const tenant = await getTenantForHost(host);
  // Media-library references (mediaId) become plain src urls server-side.
  const resolved = await resolveTenantMediaConfig(tenant, { teamId: tenant.teamId });

  return <FunnelPage tenant={resolved} />;
}
