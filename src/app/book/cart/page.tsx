import type { Metadata } from "next";
import { Suspense } from "react";
import BookCartClient from "@/components/book/BookCartClient";

export const metadata: Metadata = {
  title: "Book — Your Cart | Cut Salon",
  description: "Review your CUT Salon booking selection",
};

export default function BookCartPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookCartClient />
    </Suspense>
  );
}
