import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import CutClubExperience, {type ClubArea} from "@/components/club/CutClubExperience";
import CutClubAuth from "@/components/club/CutClubAuth";
import CutClubLogout from "@/components/club/CutClubLogout";
import { readCutClubMember } from "@/lib/club/serverCasher";

export default async function CutClubMemberGateway({area="wallet",privateMode=true}:{
  area?:ClubArea;privateMode?:boolean
}){
  if(process.env.CUT_CLUB_WEBSITE_AUTH_ENABLED!=="true"){
    return <CutClubExperience member={null} privateMode={privateMode} initialArea={area}/>;
  }
  const member=await readCutClubMember();
  if(!member)return <CutClubAuth/>;
  const reviewed=member.linkStatus==="REVIEW_REQUIRED";
  const suspended=member.linkStatus==="SUSPENDED";

  // Verified member keeps an opaque status-only session, but NEVER receives
  // historical balances, vouchers or PII while suspended/unapproved.
  if(reviewed||suspended){
    return <main dir="rtl" lang="ar" data-testid="cut-club-account-status"
      className="flex min-h-[85dvh] items-center justify-center bg-[#0d0a0e] px-4 py-12 text-[#f8eddf]">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#d6b58d]/20 bg-[#1c121a] shadow-[0_28px_90px_rgba(0,0,0,.32)]">
        <div className="h-1 bg-gradient-to-l from-[#e8cba6] via-[#894456] to-[#42232e]"/>
        <div className="p-7 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e9c69b]/20 bg-[#e9c69b]/10">
            {suspended?<AlertTriangle size={30} className="text-[#f0bea3]"/>:<Clock3 size={30} className="text-[#eac49a]"/>}
          </div>
          <p dir="ltr" lang="en" className="mt-6 text-xs font-black tracking-[.23em] text-[#d2a983]">CUT CLUB / ACCOUNT STATUS</p>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">
            {suspended?'عضويتك موقوفة مؤقتًا':'عضويتك تحت المراجعة'}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-8 text-[#ccb8ad] sm:text-base">
            {suspended
              ?'تم إيقاف الوصول إلى CUT CLUB مؤقتًا من الإدارة. لو محتاج تعرف التفاصيل أو تراجع حالة حسابك، تواصل مع فريق CUT Salon.'
              :'رقم واتساب اتأكد بنجاح. بنراجع ربط عضويتك بسجل العميل الصحيح علشان نحافظ على نقاطك ومكافآتك.'}
          </p>
          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#dfbd9c]/15 bg-[#0f0b10] p-4 text-right text-sm leading-7 text-[#dcc4ae]">
            <ShieldCheck size={20} className="mt-1 shrink-0 text-[#dec4a6]"/>
            <p>نقاطك وقسائمك محفوظة. مش هيظهر أي رصيد أو بيانات خاصة لحد ما حالة الحساب تتراجع وتتسمح له بالوصول.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e9d0b5] px-6 text-sm font-black text-[#2b1420] transition hover:bg-white">
              العودة إلى CUT Salon <ArrowLeft size={16}/>
            </a>
            <CutClubLogout/>
          </div>
        </div>
      </div>
    </main>;
  }

  const linked=member.linkStatus==="ACTIVE";
  return <div>
    {!linked && <section role="status" className="relative z-10 border-b border-emerald-400/20 bg-[#143027] px-5 py-4 text-[#daf6e8]" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-1 shrink-0 text-emerald-300"/>
          <div><p className="text-sm font-black">عضويتك اتفعّلت بنجاح</p>
            <p className="mt-1 text-xs leading-6 text-emerald-100/80">
              حسابك مؤكد برقم واتساب. مفيش محفظة قديمة مرتبطة حتى الآن؛ الرصيد هيظهر بعد ربط بياناتك من إدارة CUT Salon أو تسجيل زيارة مؤهلة.
            </p></div>
        </div>
        <CutClubLogout/>
      </div>
    </section>}
    <CutClubExperience member={linked?member:null} privateMode={privateMode} initialArea={area}/>
  </div>;
}
