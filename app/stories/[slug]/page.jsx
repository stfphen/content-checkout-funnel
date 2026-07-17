import DgtlMagDetailPage from "../../../components/dgtlmag/DgtlMagDetailPage";
import { getContentItem } from "../../../lib/dgtlmag/content";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = getContentItem("stories", slug);
  return {
    title: item ? `${item.title} | DGTLMag` : "Story | DGTLMag",
    description: item?.summary || "Read a DGTLMag story."
  };
}

export default async function StoryPage({ params }) {
  const { slug } = await params;
  return <DgtlMagDetailPage type="stories" slug={slug} />;
}
