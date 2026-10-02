import type { Metadata } from "next";
import { OctoberOfferSuccess } from "@/components/offers/october-333/OctoberOffer";
export const metadata: Metadata = { title: "تأكيد عرض أكتوبر | CUT Salon", robots: { index: false, follow: false } };
export default function Page() { return <OctoberOfferSuccess />; }
