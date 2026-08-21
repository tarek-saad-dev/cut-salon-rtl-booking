import { redirect } from "next/navigation";

/** Legacy multi-page step → canonical /book. */
export default function LegacyBookRedirect() {
  redirect("/book");
}
