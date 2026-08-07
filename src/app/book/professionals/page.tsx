import type { Metadata } from "next";
import { Suspense } from "react";
import BookProfessionalsClient from "@/components/book/BookProfessionalsClient";

export const metadata: Metadata = {
  title: "Book — Choose Professional | Cut Salon",
  description: "Select your CUT Salon barber",
};

export default function BookProfessionalsPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookProfessionalsClient />
    </Suspense>
  );
}
