import type { Metadata, Viewport } from "next";
import { MetaPixelPageView } from "@/components/analytics/MetaPixelPageView";
import { NovemberProteinClient } from "@/components/offers/november-protein/NovemberProteinClient";
import { novemberProteinOffer } from "@/config/novemberProteinOffer";

const description =
  "CUT PROTEIN RESET — نوفمبر سبيشال: قص شعر، بروتين، فوط ساخنة وباردة وماسك عناية بـ 600 جنيه. قيّم احترافي مطلوب. احجز أونلاين والدفع داخل الفرع.";

export const metadata: Metadata = {
  title: "CUT Protein Reset | November Special | CUT Salon",
  description,
  alternates: { canonical: novemberProteinOffer.href },
  openGraph: {
    title: "YOUR HAIR. RESET. — CUT Protein Reset 600 EGP",
    description,
    locale: "ar_EG",
    type: "website",
    url: novemberProteinOffer.href,
  },
};

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
