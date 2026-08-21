import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ empId: string }> };

/** Legacy deep-link → canonical /book O2 engine. */
export default async function BookWithRedirect({ params }: PageProps) {
  const { empId: raw } = await params;
  const empId = Number(raw);
  if (Number.isFinite(empId) && empId > 0) {
    redirect(`/book?mode=barber&empId=${empId}`);
  }
  redirect("/book?mode=barber");
}
