import type { Metadata } from "next";
import { Suspense } from "react";
import BookO2Client from "@/components/book/BookO2Client";

export const metadata: Metadata = {
  title: "Book — Cut Salon",
  description: "Book your CUT Salon appointment",
};

/**
 * Branch discovery is client-fetched, but this route must not sit behind
 * a year-long Full Route Cache (s-maxage=31536000) that can freeze shell /
 * future SSR branch state after enable/disable.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Instant shell — never await network before paint. */
export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" data-testid="book-o2-shell" />}>
      <BookO2Client />
    </Suspense>
  );
}
