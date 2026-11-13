import { publicPageMetadata, CANONICAL_ORIGIN } from "@/lib/seo";
import { loadPublicServiceCatalog } from "@/lib/publicServiceCatalog";
import PublicCatalog from "@/components/services/PublicCatalog";
import ServiceContent from "@/components/services/ServiceContent";
export const metadata = publicPageMetadata("/services/beard", "حلاقة وتهذيب اللحية في الإسكندرية | CUT Salon", "دليل اختيار خدمة اللحية ومراجعة خدمات وأسعار كل فرع قبل حجز موعد في CUT Salon.");
export const revalidate = 300;
export default async function ServicePage() {
  const branches = await loadPublicServiceCatalog();
  const schema = { "@context": "https://schema.org", "@type": "Service", name: "حلاقة وتهذيب اللحية في الإسكندرية", description: "دليل اختيار خدمة اللحية ومراجعة خدمات وأسعار كل فرع قبل حجز موعد في CUT Salon.", url: `${CANONICAL_ORIGIN}/services/beard`, provider: { "@type": "Organization", name: "CUT Salon", url: CANONICAL_ORIGIN } };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><ServiceContent guide="beard" /><PublicCatalog branches={branches} guide="beard" /></main>;
}
