import DgtlMagDetailPage from "../../../components/dgtlmag/DgtlMagDetailPage";

export default async function ProfilePage({ params }) {
  const { slug } = await params;
  return <DgtlMagDetailPage type="profiles" slug={slug} />;
}
