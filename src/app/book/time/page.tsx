import type { Metadata } from "next";
import { Suspense } from "react";
import BookTimeClient from "@/components/book/BookTimeClient";

export const metadata: Metadata = {
  title: "Book — Select Time | Cut Salon",
  description: "Choose your available appointment time at CUT Salon",
};

export default function BookTimePage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookTimeClient />
    </Suspense>
  );
}
