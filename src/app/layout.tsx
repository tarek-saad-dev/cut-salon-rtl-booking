import type { Metadata, Viewport } from "next";
import { CANONICAL_ORIGIN, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo";
import type { CSSProperties } from "react";
import { Alexandria } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import SiteChrome from "@/components/SiteChrome";
import {
  CAMPAIGN_ANNOUNCEMENT_BAR_HEIGHT_PX,
  getActiveCampaign,
} from "@/config/campaigns";

const alexandria = Alexandria({
  variable: "--font-alexandria-loaded",
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

/** Local Arabic display face — used only for hero / section display headings. */
const laxr = localFont({
  src: [
    {
      path: "../assets/fonts/LAXR.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-laxr-loaded",
  display: "swap",
  fallback: ["Alexandria", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),

  manifest: "/manifest.json",

  title: { default: SITE_TITLE, template: "%s | CUT Salon" },
  description: SITE_DESCRIPTION,

  icons: {
    icon: [
      { url: "/favicon1.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/android-icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon1.ico",
    apple: "/apple-icon-180x180.png",
  },

  keywords: [
    "barber salon",
    "Alexandria",
    "Cut Salon",
    "haircut",
    "grooming",
    "Cut Club",
  ],

  authors: [{ name: "Cut Salon" }],


};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const campaignActive = Boolean(getActiveCampaign());
  const campaignBarHeight = campaignActive
    ? `${CAMPAIGN_ANNOUNCEMENT_BAR_HEIGHT_PX}px`
    : "0px";

  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      style={
        {
          ["--cut-campaign-bar-height"]: campaignBarHeight,
        } as CSSProperties
      }
    >
      <body className={`${alexandria.variable} ${laxr.variable} antialiased`}>
        <Providers>
          <SiteChrome />
          {children}
        </Providers>
      </body>
    </html>
  );
}
