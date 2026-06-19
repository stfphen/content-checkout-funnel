import FunnelPage from "../../../components/FunnelPage";
import { getRenderableTenantConfig, getTenantBySlug } from "../../../lib/store";

export const dynamic = "force-dynamic";

export default async function TenantPreviewPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const tenant = await getTenantBySlug(slug);

  // ?preview=draft renders the unpublished draft snapshot (used by the admin
  // Tenant Builder); default renders the published config.
  const mode = query?.preview === "draft" ? "draft" : "published";
  const config = getRenderableTenantConfig(tenant, mode);

  return <FunnelPage tenant={config} />;
}
