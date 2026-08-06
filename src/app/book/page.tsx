import type { Metadata } from "next";
import BookBranchesClient from "@/components/book/BookBranchesClient";

export const metadata: Metadata = {
  title: "Book — Choose Location | Cut Salon",
  description: "Select your CUT Salon branch to start booking",
};

export default function BookPage() {
  return <BookBranchesClient />;
}
