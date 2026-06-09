import "../styles.css";

export const metadata = {
  title: "Content Day",
  description:
    "A configurable white-label content creation funnel and lead generation dashboard."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
