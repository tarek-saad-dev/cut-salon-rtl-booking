import type { Metadata, Viewport } from "next";
import { OctoberPackageClient } from "@/components/offers/october-package/OctoberPackageClient";

const description =
  "باكدج أكتوبر من CUT: قص شعر، ذقن وفيد، حمام زيت وتنظيف بشرة كلاسيكي في زيارة واحدة بـ 333 جنيه بدل 720. احجز أونلاين، والدفع داخل الفرع.";

export const metadata: Metadata = {
  title: "باكدج أكتوبر | CUT Salon",
  description,
  alternates: { canonical: "/offers/october-package" },
  openGraph: { title: "باكدج أكتوبر من CUT", description, locale: "ar_EG", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050505" };

export default function Page() {
  return <OctoberPackageClient />;
}
