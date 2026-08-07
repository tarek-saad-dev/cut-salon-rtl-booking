import type { Metadata } from "next";
import BookConfirmedClient from "@/components/book/BookConfirmedClient";

export const metadata: Metadata = {
  title: "Booking Confirmed | Cut Salon",
  description: "Your CUT Salon appointment is confirmed",
};

export default function BookConfirmedPage() {
  return <BookConfirmedClient />;
}
