import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CutClubExperiencePreview from "@/components/club/experience/CutClubExperiencePreview";
import { canRenderCutClubPreview } from "@/lib/club/experience/previewGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "CUT CLUB 2.0 | Internal Experience Preview",
  description: "Internal-only CUT CLUB 2.0 interactive design rehearsal. No customer data or transactions.",
  robots: {
    index: false, follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function CutClubExperiencePreviewPage() {
  if (!canRenderCutClubPreview(process.env)) notFound();
  return <CutClubExperiencePreview />;
}
