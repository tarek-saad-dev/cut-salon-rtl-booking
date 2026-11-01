import type { Metadata, Viewport } from "next";
import { ExpiredCampaignPanel } from "@/components/offers/ExpiredCampaignPanel";

const description =
  "احتفال أكتوبر من CUT انتهى. شوف عرض نوفمبر الحالي: CUT Protein Reset بـ 600 جنيه.";

export const metadata: Metadata = {
  title: "احتفال أكتوبر انتهى | CUT Salon",
  description,
  alternates: { canonical: "/offers/october-333" },
  openGraph: { title: "احتفال أكتوبر انتهى", description, locale: "ar_EG", type: "website" },
  robots: { index: false, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function Page() {
  return (
    <ExpiredCampaignPanel
      formerTitle="احتفال أكتوبر"
      formerBlurb="التجربة السينمائية لعرض أكتوبر لم تعد متاحة للحجز الجديد. الحجوزات السابقة تظل سارية."
    />
  );
}
