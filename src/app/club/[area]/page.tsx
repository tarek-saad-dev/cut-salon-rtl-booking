import { notFound } from "next/navigation";
import type { ClubArea } from "@/components/club/CutClubExperience";
import CutClubMemberGateway from "@/components/club/CutClubMemberGateway";

const allowedAreas: readonly ClubArea[] = [
  "home", "wallet", "rewards", "memberships", "challenges", "referrals", "profile",
];

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClubAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!allowedAreas.some(value => value === area)) notFound();
  return <CutClubMemberGateway area={area as ClubArea} />;
}
