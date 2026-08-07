import type { Metadata } from "next";
import { Suspense } from "react";
import BookPhoneClient from "@/components/book/BookPhoneClient";

export const metadata: Metadata = {
  title: "Book — Mobile Number | Cut Salon",
  description: "Enter your mobile number to continue booking at CUT Salon",
};

export default function BookPhonePage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-cut-soft-ivory" />}>
      <BookPhoneClient />
    </Suspense>
  );
}
