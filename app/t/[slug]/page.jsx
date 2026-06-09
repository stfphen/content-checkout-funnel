import FunnelPage from "../../../components/FunnelPage";
import { getTenantBySlug } from "../../../lib/store";

export const dynamic = "force-dynamic";

export default async function TenantPreviewPage({ params }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  return <FunnelPage tenant={tenant} />;
}
