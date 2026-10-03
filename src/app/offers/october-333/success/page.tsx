import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Offers are activated in-branch; keep the legacy confirmation URL alive. */
export default function Page() {
  redirect("/offers/october-333");
}
