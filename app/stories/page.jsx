import DgtlMagCollectionPage from "../../components/dgtlmag/DgtlMagCollectionPage";

export const metadata = {
  title: "Stories | DGTLMag",
  description: "Read DGTLMag stories and field notes."
};

export default function StoriesPage() {
  return <DgtlMagCollectionPage type="stories" />;
}
