import DgtlMagDetailPage from "../../../components/dgtlmag/DgtlMagDetailPage";
import { getContentItem } from "../../../lib/dgtlmag/content";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = getContentItem("drops", slug);
  return {
    title: item ? `${item.title} | DGTLMag` : "Drop | DGTLMag",
    description: item?.summary || "View a DGTLMag drop."
  };
}

export default async function DropPage({ params }) {
  const { slug } = await params;
  return <DgtlMagDetailPage type="drops" slug={slug} />;
}
