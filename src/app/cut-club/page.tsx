import { publicPageMetadata } from "@/lib/seo";
import CutClubExperience from "@/components/club/CutClubExperience";

export const metadata = publicPageMetadata(
  "/cut-club",
  "CUT CLUB | محفظتك وعضويتك في CUT Salon",
  "ادخل تجربة CUT CLUB: المحفظة، CUT Coins، القسائم، المكافآت، والعضويات في واجهة واحدة. بيانات العميل الشخصية لا تظهر بدون تحقق من الهوية."
);

/** Public entry to the actual member experience, with NO fake member data. */
export default function CutClubPage() {
  return <CutClubExperience />;
}
