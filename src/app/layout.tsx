import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import MainNav from "@/components/MainNav";

export const metadata: Metadata = {
  title: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
  description: "أفضل صالون حلاقة في الإسكندرية - خدمات تصفيف شعر متميزة مع برنامج Cut Club للولاء",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.jpeg", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpeg",
    apple: "/cutsalon.png",
  },
  keywords: ["صالون حلاقة", "الإسكندرية", "Cut Salon", "حلاقة", "تصفيف شعر", "Cut Club"],
  authors: [{ name: "Cut Salon" }],
  openGraph: {
    title: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
    description: "أفضل صالون حلاقة في الإسكندرية - خدمات تصفيف شعر متميزة مع برنامج Cut Club للولاء",
    url: "https://cutsaloon.com/",
    siteName: "Cut Salon",
    images: [
      {
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
