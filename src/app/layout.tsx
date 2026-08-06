import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import MainNav from "@/components/MainNav";

const arabicDisplay = Noto_Naskh_Arabic({
  variable: "--font-ar-display-loaded",
  subsets: ["arabic"],
  weight: ["600", "700"],
  display: "swap",
});

const arabicUi = IBM_Plex_Sans_Arabic({
  variable: "--font-ar-ui-loaded",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    locale: "en_US",
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
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${arabicDisplay.variable} ${arabicUi.variable} antialiased`}>
        <Providers>
          <MainNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
