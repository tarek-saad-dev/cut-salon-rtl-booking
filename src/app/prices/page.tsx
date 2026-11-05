import { publicPageMetadata } from "@/lib/seo";
import PricesClient from "@/components/prices/PricesClient";

export const metadata = publicPageMetadata("/prices", "أسعار الحلاقة والعناية في الإسكندرية | CUT Salon", "تعرّف على أسعار قص الشعر والعناية باللحية وباقات تجهيز العريس في CUT Salon بالإسكندرية، واختر الخدمة المناسبة قبل حجز موعدك.");

export default function PricesPage() {
  return <PricesClient />;
}
