import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Cut Salon - أفضل صالون حلاقة في الإسكندرية",
  description: "أفضل صالون حلاقة في الإسكندرية - خدمات تصفيف شعر متميزة مع برنامج Cut Club للولاء",
  icons: {
    icon: "/cutsalon.png",
    shortcut: "/cutsalon.png",
    apple: "/cutsalon.png",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
