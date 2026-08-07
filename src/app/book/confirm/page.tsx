import type { Metadata } from "next";
import { Suspense } from "react";
import BookConfirmClient from "@/components/book/BookConfirmClient";

export const metadata: Metadata = {
  title: "Book — Confirm | Cut Salon",
  description: "Confirm your CUT Salon booking",
};

export default function BookConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookConfirmClient />
    </Suspense>
  );
}
