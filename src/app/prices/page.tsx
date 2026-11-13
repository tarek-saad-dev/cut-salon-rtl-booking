import { publicPageMetadata } from "@/lib/seo";
import { loadPublicServiceCatalog } from "@/lib/publicServiceCatalog";
import PublicCatalog from "@/components/services/PublicCatalog";
import PricesClient from "@/components/prices/PricesClient";

export const metadata = publicPageMetadata("/prices", "أسعار الحلاقة والعناية في الإسكندرية | CUT Salon", "تعرّف على أسعار قص الشعر والعناية باللحية وباقات تجهيز العريس في CUT Salon بالإسكندرية، واختر الخدمة المناسبة قبل حجز موعدك.");

export const revalidate = 300;

export default async function PricesPage() {
  const branches = await loadPublicServiceCatalog();
  return <PricesClient><div className="bg-cut-soft-ivory text-cut-black"><PublicCatalog branches={branches} /></div></PricesClient>;
}
