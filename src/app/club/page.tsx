import type { Metadata } from "next";
import CutClubExperience from "@/components/club/CutClubExperience";

/**
 * Private member destination. A verified Casher session projection will be
 * injected here when authorized; never derive a customer from query/phone.
 * Until then, render the same wallet-first UX in anonymous locked state.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata: Metadata = {
  title: "محفظتي | CUT CLUB",
  description: "مساحة العضو الشخصية في CUT CLUB.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function ClubMemberPage() {
  return <CutClubExperience member={null} privateMode />;
}
