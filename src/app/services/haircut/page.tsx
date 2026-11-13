import { publicPageMetadata, CANONICAL_ORIGIN } from "@/lib/seo";
import { loadPublicServiceCatalog } from "@/lib/publicServiceCatalog";
import PublicCatalog from "@/components/services/PublicCatalog";
import ServiceContent from "@/components/services/ServiceContent";
export const metadata = publicPageMetadata("/services/haircut", "قص الشعر للرجال في الإسكندرية | CUT Salon", "اختيار خدمة قص الشعر ومقارنة الأسعار المنشورة حسب الفرع قبل الحجز في CUT Salon.");
export const revalidate = 300;
export default async function ServicePage() {
  const branches = await loadPublicServiceCatalog();
  const schema = { "@context": "https://schema.org", "@type": "Service", name: "قص الشعر للرجال في الإسكندرية", description: "اختيار خدمة قص الشعر ومقارنة الأسعار المنشورة حسب الفرع قبل الحجز في CUT Salon.", url: `${CANONICAL_ORIGIN}/services/haircut`, provider: { "@type": "Organization", name: "CUT Salon", url: CANONICAL_ORIGIN } };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><ServiceContent guide="haircut" /><PublicCatalog branches={branches} guide="haircut" /></main>;
}
