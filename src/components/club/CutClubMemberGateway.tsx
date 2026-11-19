import CutClubExperience, {type ClubArea} from "@/components/club/CutClubExperience";
import CutClubAuth from "@/components/club/CutClubAuth";
import CutClubLogout from "@/components/club/CutClubLogout";
import { readCutClubMember } from "@/lib/club/serverCasher";

export default async function CutClubMemberGateway({area="wallet",privateMode=true}:{
  area?:ClubArea;privateMode?:boolean
}){
  // Deploy the new authentication screens without turning on a broken login
  // before Casher schema + tenant + secret have been configured.
  if (process.env.CUT_CLUB_WEBSITE_AUTH_ENABLED !== "true") {
    return <CutClubExperience member={null} privateMode={privateMode} initialArea={area}/>;
  }
  const member=await readCutClubMember();
  if(!member)return <CutClubAuth/>;
  const activated=member.linkStatus==="ACTIVE";
  return <div>
    {!activated && <section role="status" className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-amber-400/25 bg-[#382313] px-5 py-4 text-[#fae6cd]" dir="rtl">
      <div><p className="text-sm font-black">
        {member.linkStatus==="REVIEW_REQUIRED"?"تأكيد ربط العضوية مطلوب":"حساب CUT CLUB اتفعّل"}
      </p><p className="mt-1 text-xs leading-6">
        {member.linkStatus==="REVIEW_REQUIRED"
          ?"رقم واتساب اتأكد بنجاح. لحماية نقاطك القديمة، لازم الإدارة تتأكد من ربطك بسجل العميل الصحيح قبل عرض الرصيد."
          :"حسابك اتسجل واتأكد رقم واتساب. رصيد النقاط هيظهر لما يتربط بحساب عميل موجود أو أول زيارة فعلية."}
      </p></div>
      <CutClubLogout />
    </section>}
    <CutClubExperience member={activated?member:null} privateMode={privateMode} initialArea={area}/>
  </div>;
}
