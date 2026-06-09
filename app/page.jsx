import { headers } from "next/headers";
import FunnelPage from "../components/FunnelPage";
import { getTenantForHost } from "../lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const tenant = await getTenantForHost(host);

  return <FunnelPage tenant={tenant} />;
}
