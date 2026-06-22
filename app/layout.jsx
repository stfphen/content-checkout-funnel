import { Geist, Geist_Mono } from "next/font/google";
import "../styles.css";

// Primary UI / display typeface — Geist: clean, technical-premium, used for both
// body and headings (one calm family, not a separate display face).
const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

// Monospace — Geist Mono for data, code, and email-preview blocks. Heavier
// weights (600/700) let large figures (hero stats, prices) read as instrument
// readouts without the browser synthesizing a faux-bold.
const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

// Drives the mobile viewport. viewportFit: "cover" lets the existing
// env(safe-area-inset-*) rules (mobile action bar, bottom padding, admin nav)
// actually resolve around the Dynamic Island / home indicator on modern iPhones.
// Zoom is intentionally left enabled (no maximumScale) for accessibility.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "Content Day",
  description:
    "A configurable white-label content creation funnel and lead generation dashboard.",
  // Per-tenant PWA manifest (Android/Chrome) resolved by host at request time.
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    // iOS home-screen icon: served per-tenant from the host, falling back to
    // the bundled SVG when a tenant hasn't set a custom icon.
    apple: "/branding/icon",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
