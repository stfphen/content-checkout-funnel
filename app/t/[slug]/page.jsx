import FunnelPage from "../../../components/FunnelPage";
import {
  getRenderableTenantConfig,
  getTenantBySlug,
  resolveTenantMediaConfig
} from "../../../lib/store";

export const dynamic = "force-dynamic";

export default async function TenantPreviewPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const tenant = await getTenantBySlug(slug);

  // ?preview=draft renders the unpublished draft snapshot (used by the admin
  // Tenant Builder); default renders the published config.
  const mode = query?.preview === "draft" ? "draft" : "published";
  const config = getRenderableTenantConfig(tenant, mode);
  // Media-library references (mediaId) become plain src urls server-side —
  // FunnelPage is a client component and never talks to the store.
  const resolved = await resolveTenantMediaConfig(config, { teamId: tenant.teamId });

  return <FunnelPage tenant={resolved} />;
}
