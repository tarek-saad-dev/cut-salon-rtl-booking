import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import MainNav from "@/components/MainNav";

export const metadata: Metadata = {
  metadataBase: new URL("https://cutsaloon.com"),

  manifest: "/manifest.json",

  title: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
  description:
    "أفضل صالون حلاقة في الإسكندرية - خدمات تصفيف شعر متميزة مع برنامج Cut Club للولاء",

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
    "صالون حلاقة",
    "الإسكندرية",
    "Cut Salon",
    "حلاقة",
    "تصفيف شعر",
    "Cut Club",
  ],

  authors: [{ name: "Cut Salon" }],

  openGraph: {
    title: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
    description:
      "أفضل صالون حلاقة في الإسكندرية - خدمات تصفيف شعر متميزة مع برنامج Cut Club للولاء",
    url: "https://cutsaloon.com/",
    siteName: "Cut Salon",
    images: [
      {
        // TODO: Replace with /og-image.jpg when available (1200x630px recommended)
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
    description: "أفضل صالون حلاقة في الإسكندرية - خدمات تصفيف شعر متميزة",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <MainNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
