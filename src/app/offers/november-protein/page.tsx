import { publicPageMetadata } from "@/lib/seo";
import type { Viewport } from "next";
import { MetaPixelPageView } from "@/components/analytics/MetaPixelPageView";
import { NovemberProteinClient } from "@/components/offers/november-protein/NovemberProteinClient";
import { novemberProteinOffer } from "@/config/novemberProteinOffer";

const description =
  "CUT PROTEIN RESET — نوفمبر سبيشال في CUT Salon بالإسكندرية: قص شعر، بروتين، فوط ساخنة وباردة وماسك عناية بـ 600 جنيه. تقييم احترافي مطلوب. احجز أونلاين والدفع داخل الفرع.";

export const metadata = publicPageMetadata(
  novemberProteinOffer.href,
  "بروتين الشعر بالإسكندرية | November Protein Reset | CUT Salon",
  description,
);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
};

export default function Page() {
  return (
    <>
      <MetaPixelPageView />
      <NovemberProteinClient />
    </>
  );
}
