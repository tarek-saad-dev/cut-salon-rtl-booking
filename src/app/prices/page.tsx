import type { Metadata } from "next";
import PricesClient from "@/components/prices/PricesClient";

export const metadata: Metadata = {
  title: "قائمة الأسعار | Cut Salon",
  description: "أسعار خدمات Cut Salon، الباقات، وتجهيز العريس.",
};

export default function PricesPage() {
  return <PricesClient />;
}
