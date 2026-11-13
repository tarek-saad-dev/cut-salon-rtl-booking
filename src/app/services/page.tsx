import { publicPageMetadata } from "@/lib/seo";
import { loadPublicServiceCatalog } from "@/lib/publicServiceCatalog";
import PublicCatalog from "@/components/services/PublicCatalog";
import ServiceContent from "@/components/services/ServiceContent";
export const metadata = publicPageMetadata("/services", "خدمات الشعر واللحية في الإسكندرية | CUT Salon", "دليل خدمات الشعر واللحية في CUT Salon: قارن الخدمات والأسعار حسب الفرع واختر خدمتك قبل الحجز.");
export const revalidate = 300;
export default async function ServicesPage() {
  const branches = await loadPublicServiceCatalog();
  return <main><ServiceContent /><PublicCatalog branches={branches} /></main>;
}
