import type { Metadata, Viewport } from "next";
import { ExpiredCampaignPanel } from "@/components/offers/ExpiredCampaignPanel";

const description =
  "عرض أكتوبر من CUT انتهى. شوف عرض نوفمبر الحالي: CUT Protein Reset بـ 600 جنيه.";

export const metadata: Metadata = {
  title: "باكدج أكتوبر انتهى | CUT Salon",
  description,
  alternates: { canonical: "/offers/october-package" },
  openGraph: { title: "باكدج أكتوبر انتهى", description, locale: "ar_EG", type: "website" },
  robots: { index: false, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050505" };

export default function Page() {
  return (
    <ExpiredCampaignPanel
      formerTitle="باكدج أكتوبر"
      formerBlurb="عرض أكتوبر انتهى. الحجوزات السابقة تظل سارية، والعرض الحالي هو Protein Reset لشهر نوفمبر."
    />
  );
}
