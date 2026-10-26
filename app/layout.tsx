import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Pinyon_Script } from "next/font/google";
import "./globals.css";

const pinyon = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

// Base for absolute URLs in link previews. SITE_URL wins; on Vercel the
// production domain is used automatically; locally it falls back to the dev server.
const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Studio Dahlia — Live Wedding & Event Illustration, Singapore",
  description:
    "Hand-painted live guest illustrations for weddings and events in Singapore, plus personal commissions and brand illustration.",
  openGraph: {
    title: "Studio Dahlia — Live Wedding & Event Illustration",
    description: "Hand-painted watercolour keepsakes, painted live for your guests.",
    images: ["/img/isaac-zakirah.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF7F6",
};

// Marks JS as available before first paint, so scroll-reveal content can start
// hidden without flashing; without JS everything simply stays visible.
const jsFlag = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pinyon.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
