import type { Metadata } from "next";
import { Suspense } from "react";
import BookServicesClient from "@/components/book/BookServicesClient";

export const metadata: Metadata = {
  title: "Book — Services | Cut Salon",
  description: "Choose your CUT Salon services",
};

export default function BookServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookServicesClient />
    </Suspense>
  );
}
