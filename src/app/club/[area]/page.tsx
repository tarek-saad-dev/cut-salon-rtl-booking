import { notFound } from "next/navigation";
import CutClubExperience, { type ClubArea } from "@/components/club/CutClubExperience";

const allowedAreas: readonly ClubArea[] = [
  "home", "wallet", "rewards", "memberships", "challenges", "referrals", "profile",
];

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ClubAreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!allowedAreas.some(value => value === area)) notFound();
  return <CutClubExperience initialArea={area as ClubArea} privateMode member={null} />;
}
