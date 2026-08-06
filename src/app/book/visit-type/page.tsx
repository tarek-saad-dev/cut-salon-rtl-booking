import type { Metadata } from "next";
import { Suspense } from "react";
import BookVisitTypeClient from "@/components/book/BookVisitTypeClient";

export const metadata: Metadata = {
  title: "Book — Visit Type | Cut Salon",
  description: "Choose individual or group booking at CUT Salon",
};

export default function BookVisitTypePage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookVisitTypeClient />
    </Suspense>
  );
}
