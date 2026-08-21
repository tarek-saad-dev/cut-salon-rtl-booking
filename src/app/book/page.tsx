import type { Metadata } from "next";
import { Suspense } from "react";
import BookO2Client from "@/components/book/BookO2Client";

export const metadata: Metadata = {
  title: "Book — Cut Salon",
  description: "Book your CUT Salon appointment",
};

/** Instant shell — never await network before paint. */
export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" data-testid="book-o2-shell" />}>
      <BookO2Client />
    </Suspense>
  );
}
