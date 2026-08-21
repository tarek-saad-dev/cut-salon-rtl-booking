import { redirect } from "next/navigation";
export default function LegacyBookRedirect() {
  redirect("/book");
}
