import type { Metadata, Viewport } from "next";
import { OctoberExperience } from "@/components/offers/october-333/OctoberExperience";

const description =
  "أكتوبر له مكانة خاصة. قص شعر، ذقن، حمام زيت وعناية كلاسيكية بالبشرة — قيمتها 670 جنيه، في احتفال أكتوبر من CUT بـ 333 جنيه. يبدأ 5 أكتوبر، والتفعيل والدفع داخل الفرع.";

export const metadata: Metadata = {
  title: "احتفال أكتوبر من CUT | CUT Salon",
  description,
  alternates: { canonical: "/offers/october-333" },
  openGraph: { title: "احتفال أكتوبر من CUT", description, locale: "ar_EG", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#050505" };

export default function Page() {
  return <OctoberExperience />;
}
