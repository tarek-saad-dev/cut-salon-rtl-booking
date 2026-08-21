import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Alexandria } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import MainNav from "@/components/MainNav";
import CampCaesarCampaign from "@/components/campaign/CampCaesarCampaign";
import {
  CAMPAIGN_ANNOUNCEMENT_BAR_HEIGHT_PX,
  getActiveCampaign,
} from "@/config/campaigns";

const alexandria = Alexandria({
  variable: "--font-alexandria-loaded",
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
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
  metadataBase: new URL("https://cutsaloon.com"),

  manifest: "/manifest.json",

  title: "Cut Salon - Premium Barber Salon in Alexandria",
  description:
    "Premium barber salon in Alexandria — expert haircuts, grooming, and Cut Club loyalty rewards",

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

  openGraph: {
    title: "Cut Salon - Premium Barber Salon in Alexandria",
    description:
      "Premium barber salon in Alexandria — expert haircuts, grooming, and Cut Club loyalty rewards",
    url: "https://cutsaloon.com/",
    siteName: "Cut Salon",
    images: [
      {
        // TODO: Replace with /og-image.jpg when available (1200x630px recommended)
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "Cut Salon - Premium Barber Salon in Alexandria",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cut Salon - Premium Barber Salon in Alexandria",
    description: "Premium barber salon in Alexandria — expert haircuts and grooming",
    // TODO: Replace with /og-image.jpg when available
    images: ["/logo.jpeg"],
  },
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
          <CampCaesarCampaign />
          <MainNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
