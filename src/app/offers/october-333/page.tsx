import type { Metadata } from "next";
import { OctoberOffer } from "@/components/offers/october-333/OctoberOffer";
export const metadata: Metadata = { title: "عرض أكتوبر 333 جنيه | CUT Salon", description: "أربع خدمات بقيمة 670 جنيه مقابل 333 جنيه. لأول 100 طلب مؤكد، والدفع في الفرع.", alternates: { canonical: "/offers/october-333" } };
export default function Page() { return <OctoberOffer />; }
