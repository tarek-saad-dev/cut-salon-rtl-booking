"use client";

/**
 * CUT CLUB member experience — wallet-first responsive UI.
 * A null member is an UNVERIFIED visitor, never a zero-balance customer.
 * No phone/localStorage/clientId lookup and no purchase/redemption side effects.
 * A verified, server-authorized member projection can be supplied later.
 */
import { useEffect, useState } from "react";
import CutClubLogout from "./CutClubLogout";
import MovementHistory from "./MovementHistory";
import MembershipStatus from "./MembershipStatus";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2,
  ChevronLeft, Coins, Crown, Gift, History, House,
  LockKeyhole, Scissors, ShieldCheck, Sparkles, Ticket,
  Trophy, UserRound, Users, Wallet,
} from "lucide-react";

export type ClubArea = "home" | "wallet" | "rewards" | "memberships" | "challenges" | "referrals" | "profile";
type Area = ClubArea;
type Voucher = Readonly<{
  id: string;
  title: string;
  status: "active" | "used" | "expired";
  expiryLabel: string | null;
}>;
type Movement = Readonly<{
  id: string;
  title: string;
  occurredAtLabel: string;
  coinsDelta: number;
}>;
export type VerifiedClubMember = Readonly<{
  displayName: string;
  memberCode: string;
  tier: string | null;
  coins: number | null;
  promoCreditMinor: number | null;
  ownedVouchers: readonly Voucher[] | null;
  movements: readonly Movement[] | null;
  upcomingBooking: Readonly<{ service: string; date: string; branch: string }> | null;
  completedVisits: number | null;
}>;

const nav: readonly { id: Area; title: string; en: string; icon: LucideIcon }[] = [
  { id: "home", title: "الرئيسية", en: "OVERVIEW", icon: House },
  { id: "wallet", title: "محفظتي", en: "WALLET", icon: Wallet },
  { id: "rewards", title: "المكافآت", en: "REWARDS", icon: Gift },
  { id: "memberships", title: "العضويات", en: "MEMBERSHIPS", icon: Crown },
  { id: "challenges", title: "التحديات", en: "CHALLENGES", icon: Trophy },
  { id: "referrals", title: "الإحالات", en: "REFERRALS", icon: Users },
  { id: "profile", title: "حسابي", en: "PROFILE", icon: UserRound },
];
const mobileNav: readonly Area[] = ["home", "wallet", "rewards", "memberships", "profile"];
const surface = "rounded-[1.65rem] border border-[#d2b49d]/[.16] bg-[#1b1217] p-5 shadow-[0_16px_44px_rgba(0,0,0,.15)] sm:p-6";
const eyebrow = "text-[10px] font-bold tracking-[.22em] text-[#dec7b4]";

function numberOrNull(value: number | null | undefined): string | null {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER && Math.round(value * 100) / 100 === value
    ? new Intl.NumberFormat("ar-EG").format(value) : null;
}
function creditOrNull(value: number | null | undefined): string | null {
  return value !== null && value !== undefined && Number.isSafeInteger(value) && value >= 0
    ? new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value / 100) : null;
}
function Head({ en, title, subtitle }: { en: string; title: string; subtitle: string }) {
  return <div className="mb-7">
    <p lang="en" dir="ltr" className={eyebrow}>{en}</p>
    <h1 className="mt-2 text-3xl font-black leading-[1.45] text-[#fff9f1] sm:text-4xl">{title}</h1>
    <p className="mt-2 max-w-2xl text-sm leading-7 text-[#c6b5aa]">{subtitle}</p>
  </div>;
}
function CardTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <h2 className="flex items-center gap-2.5 text-lg font-bold text-[#fff7ed]">
    <Icon className="h-5 w-5 text-[#e1c0a0]" aria-hidden="true" />{children}
  </h2>;
}
function PrivateNotice({ compact = false }: { compact?: boolean }) {
  return <div role="note" className="flex items-start gap-3 rounded-2xl border border-[#d7b79b]/20 bg-[#d7b79b]/[.06] p-4">
    <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#e6c5a6]" />
    <p className="text-xs leading-6 text-[#e4cec0]">
      {compact
        ? "بيانات المحفظة بتظهر لصاحب الحساب فقط بعد إثبات ملكيته."
        : "محفظتك مرتبطة بحسابك الحقيقي في CUT Salon. مش هنعرض رصيد أو قسيمة أو حركة تخص أي عميل من مجرد رقم هاتف أو رابط، ومش هنستخدم أرصدة تجريبية بدل بياناتك."}
    </p>
  </div>;
}
function Empty({ title, description, icon: Icon = LockKeyhole }: {
  title: string; description: string; icon?: LucideIcon;
}) {
  return <div className="mt-5 rounded-2xl border border-dashed border-[#d9c0ad]/20 bg-black/10 px-5 py-10 text-center">
    <Icon className="mx-auto h-7 w-7 text-[#c6a68b]" aria-hidden="true" />
    <p className="mt-4 text-sm font-bold text-[#f4e4d6]">{title}</p>
    <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-[#ae9c91]">{description}</p>
  </div>;
}
function MemberCard({ member }: { member: VerifiedClubMember | null }) {
  return <section aria-label="بطاقة عضوية CUT CLUB" className="relative isolate overflow-hidden rounded-[1.8rem] border border-[#debda2]/30 bg-gradient-to-br from-[#672536] via-[#3a1724] to-[#150d13] p-6 shadow-[0_26px_70px_rgba(0,0,0,.25)] sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute -top-28 -left-20 h-72 w-72 rounded-full border-[50px] border-[#e7bd9b]/[.06]" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-16 h-80 w-80 rounded-full border-[55px] border-[#e7bd9b]/[.05]" />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <p dir="ltr" lang="en" className="text-left text-[10px] font-black tracking-[.25em] text-[#e7c7ad]">CUT CLUB / MEMBER CARD</p>
        <h2 className="mt-8 text-2xl font-black text-[#fff9f1] sm:text-3xl">{member?.displayName ?? "عضويتك في CUT CLUB"}</h2>
        <p dir="ltr" className="mt-2 text-right text-xs tracking-[.14em] text-[#dcbba7]">{member?.memberCode ?? "MEMBER ID — PRIVATE"}</p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#edd2bc]/30 bg-white/10"><Scissors className="h-6 w-6 text-[#f3dcc6]" aria-hidden="true" /></div>
    </div>
    <div className="relative mt-12 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
      <div><p className="text-xs text-[#d9bda9]">المستوى</p><p className="mt-1 text-lg font-bold text-[#fff7ed]">{member?.tier ?? "غير متاح"}</p></div>
      <div><p className="text-xs text-[#d9bda9]">CUT Coins</p><p dir="ltr" className="mt-1 text-right text-2xl font-bold tabular-nums text-[#fff7ed]">{numberOrNull(member?.coins) ?? "—"}</p></div>
    </div>
    {!member && <p className="relative mt-4 flex items-center gap-2 text-xs text-[#ebcbb6]"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> البيانات الخاصة لا تظهر للزائر</p>}
  </section>;
}
function Stat({ title, value, unit, icon: Icon, detail }: {
  title: string; value: string | null; unit?: string; icon: LucideIcon; detail: string;
}) {
  return <article className={surface}>
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-[#cbb6a7]">{title}</p><Icon aria-hidden="true" className="h-5 w-5 text-[#e6c5a8]" />
    </div>
    <p dir="ltr" className="mt-7 text-right text-3xl font-black tabular-nums text-[#fff9f1]">{value ?? "—"}
      {value !== null && unit && <span className="ms-2 text-xs font-bold text-[#d9bcaa]">{unit}</span>}
    </p>
    <p className="mt-3 text-xs text-[#a9988f]">{value === null ? "يظهر بعد التحقق من الحساب" : detail}</p>
  </article>;
}
function WalletScreen({ member, go }: { member: VerifiedClubMember | null; go: (area: Area) => void }) {
  const vouchers = member?.ownedVouchers ?? null;
  const movements = member?.movements ?? null;
  const activeVoucherCount = vouchers === null ? null : numberOrNull(vouchers.filter(v => v.status === "active").length);
  return <>
    <Head en="YOUR SPACE / WALLET" title="محفظتك. كل حاجة في مكانها."
      subtitle="نقاطك، الرصيد الترويجي، القسائم وحركة المحفظة؛ من غير خلط Coins بالرصيد بالجنيه." />
    <div className="grid items-stretch gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <MemberCard member={member} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Stat title="CUT Coins" icon={Coins} value={numberOrNull(member?.coins)} unit="CC" detail="رصيد النقاط" />
        <Stat title="رصيد ترويجي" icon={Wallet} value={creditOrNull(member?.promoCreditMinor)} unit="EGP" detail="رصيد مستقل عن CUT Coins" />
      </div>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className={surface}>
        <CardTitle icon={Ticket}>قسائمي ومكافآتي</CardTitle>
        {vouchers === null
          ? <Empty title="قسائمك خاصة بحسابك" description="هنا تظهر القسائم المملوكة لك وحالتها وصلاحيتها بعد التحقق من الحساب." icon={Ticket} />
          : vouchers.length === 0
            ? <Empty title="لا توجد قسائم مسجلة" description="مفيش قسائم مملوكة نشطة أو سابقة على الحساب." icon={Ticket} />
            : <ul className="mt-5 space-y-3">{vouchers.map(v => <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#d7b79b]/15 bg-white/[.03] p-4">
              <div><p className="text-sm font-semibold">{v.title}</p><p className="mt-1 text-xs text-[#bca69a]">{v.expiryLabel ?? "لا يوجد تاريخ صلاحية محدد"}</p></div>
              <span className="text-xs text-[#e2c0a4]">{v.status === "active" ? "متاحة" : v.status === "used" ? "مستخدمة" : "منتهية"}</span>
            </li>)}</ul>}
      </div>
      <div className={surface}>
        <CardTitle icon={History}>سجل حركة النقاط</CardTitle>
        {movements === null
          ? <Empty title="سجلك المالي خاص بيك" description="هنا تشوف الإضافات والخصومات والتواريخ من السجل الحقيقي بعد التحقق." icon={History} />
          : movements.length === 0
            ? <Empty title="مفيش حركات مسجلة" description="حركات النقاط هتظهر في المكان ده." icon={History} />
            : <MovementHistory initial={movements} />}
      </div>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <PrivateNotice />
      <button type="button" onClick={() => go("rewards")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ead7c4] px-6 text-sm font-bold text-[#31131e] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1c0a0]">استكشف المكافآت <ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
    </div>
    <p className="sr-only" aria-live="polite">عدد القسائم المتاحة {activeVoucherCount ?? "غير متاح"}</p>
  </>;
}
function HomeScreen({ member, go }: { member: VerifiedClubMember | null; go: (area: Area) => void }) {
  return <>
    <Head en="CUT CLUB / YOUR HOME" title="كل زيارة ليها قيمة."
      subtitle="هنا نقطة البداية: بطاقة العضوية، محفظتك، زياراتك، وكل اللي يخص تجربتك في CUT Salon." />
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <MemberCard member={member} />
      <section className={surface}>
        <CardTitle icon={CalendarDays}>زيارتك القادمة</CardTitle>
        <p className="mt-7 text-lg font-semibold text-[#f7eadd]">{member?.upcomingBooking?.service ?? "مفيش حجز مرتبط بحساب موثّق حاليًا"}</p>
        {member?.upcomingBooking && <p className="mt-2 text-sm text-[#c7b1a3]">{member.upcomingBooking.branch} · {member.upcomingBooking.date}</p>}
        <a href="/book" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#eaddcc] px-5 text-sm font-bold text-[#381321] hover:bg-white">احجز زيارتك <ArrowLeft className="h-4 w-4" aria-hidden="true" /></a>
      </section>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      <Stat title="CUT Coins" value={numberOrNull(member?.coins)} unit="CC" icon={Coins} detail="رصيدك الحالي" />
      <Stat title="القسائم المملوكة" value={member?.ownedVouchers ? numberOrNull(member.ownedVouchers.length) : null} icon={Ticket} detail="جميع الحالات" />
      <Stat title="زياراتك المكتملة" value={numberOrNull(member?.completedVisits)} icon={Scissors} detail="من سجل زياراتك" />
    </div>
    <div className="mt-9 grid gap-4 sm:grid-cols-2">
      {([
        { id: "wallet" as Area, title: "افتح محفظتك", subtitle: "Coins، القسائم، الرصيد بالجنيه وسجل الحركات", icon: Wallet },
        { id: "rewards" as Area, title: "اكتشف المكافآت", subtitle: "الخدمات والمكافآت حسب الشروط المعتمدة", icon: Gift },
        { id: "memberships" as Area, title: "مزايا العضوية", subtitle: "المستويات والشراكات التعليمية والطبية", icon: Crown },
        { id: "challenges" as Area, title: "رحلة الزيارات", subtitle: "التحديات والإنجازات لما تتفعل", icon: Trophy },
      ]).map(item => {
        const Icon = item.icon;
        return <button key={item.id} type="button" onClick={() => go(item.id)} className={surface + " flex min-h-36 items-center justify-between gap-4 text-right transition hover:border-[#ddbaa1]/50 hover:bg-[#27151d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6c5a9]"}>
          <div><Icon aria-hidden="true" className="h-7 w-7 text-[#edcbb0]" /><h2 className="mt-4 text-lg font-bold">{item.title}</h2><p className="mt-2 text-xs leading-6 text-[#b9a79e]">{item.subtitle}</p></div>
          <ChevronLeft className="h-5 w-5 shrink-0 text-[#debea4]" aria-hidden="true" />
        </button>;
      })}
    </div>
    <div className="mt-6"><PrivateNotice compact /></div>
  </>;
}

const categories = [
  { id: "hair", name: "Hair Cut", ar: "حلاقة الشعر", note: "الإتاحة والسعر بالنقاط حسب كتالوج النادي المعتمد", icon: Scissors },
  { id: "mask", name: "Face Mask", ar: "ماسك الوجه", note: "تخضع لشروط المكافأة والفرع والخدمة", icon: Sparkles },
  { id: "care", name: "Basic SkinCare", ar: "العناية بالبشرة", note: "تُعرض الشروط الفعلية عند إتاحة الاستبدال", icon: Gift },
  { id: "oil", name: "Oil Bath", ar: "حمام الزيت", note: "نوع الخدمة والأهلية من بيانات CUT Salon", icon: Crown },
];
function RewardsScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = categories.find(c => c.id === selected);
  return <>
    <Head en="CUT CLUB / THE REWARD ROOM" title="المكافآت اللي تستاهل زيارتك"
      subtitle="استكشف أقسام المكافآت. الأسعار والتوفر والاستبدال مش متاحين قبل ربط الكتالوج بحسابك الموثّق." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((item, index) => {
        const Icon = item.icon;
        return <article key={item.id} className="overflow-hidden rounded-[1.6rem] border border-[#d2b49d]/20 bg-[#1b1217]">
          <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[#5e1e2b] via-[#351623] to-[#1b1116]">
            <Icon aria-hidden="true" className="h-12 w-12 text-[#edcfb5]" />
            <span className="absolute bottom-3 left-4 text-4xl font-black text-white/10">0{index + 1}</span>
          </div>
          <div className="p-5"><p dir="ltr" className={eyebrow}>{item.name}</p><h2 className="mt-2 text-lg font-bold">{item.ar}</h2>
            <p className="mt-3 min-h-12 text-xs leading-6 text-[#c4b1a2]">{item.note}</p>
            <button type="button" onClick={() => setSelected(selected === item.id ? null : item.id)}
              aria-expanded={selected === item.id} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#d5bca6]/40 text-sm font-bold text-[#f1d8c3] hover:bg-white/5">تفاصيل الخدمة</button>
          </div>
        </article>;
      })}
    </div>
    {chosen && <div role="region" aria-label="تفاصيل المكافأة" className={surface + " mt-5"}>
      <CardTitle icon={Gift}>{chosen.ar}</CardTitle><p className="mt-4 text-sm leading-7 text-[#cdb9aa]">{chosen.note}. لا يوجد سعر Coins أو حجز مكافأة فعلي مفعّل من الصفحة العامة.</p>
    </div>}
    <div className="mt-5"><PrivateNotice compact /></div>
  </>;
}
function MembershipsScreen(){return <MembershipStatus/>;}
function ChallengesScreen() {
  return <>
    <Head en="CUT CLUB / YOUR JOURNEY" title="كل زيارة بتقرّبك"
      subtitle="تحديات مرتبطة بالزيارات الفعلية والعناية، مش مجرد أرقام أو مكافآت غير مستحقة." />
    <div className="grid gap-4 sm:grid-cols-2">
      {([
        { title: "رحلة الزيارات", desc: "تقدّمك في الزيارات المكتملة والمؤهلة", icon: Scissors },
        { title: "روتين العناية", desc: "تحديات العناية على فترات محددة", icon: Sparkles },
      ]).map(item => {
        const Icon = item.icon;
        return <section key={item.title} className={surface}><CardTitle icon={Icon}>{item.title}</CardTitle><p className="mt-3 text-sm leading-7 text-[#bba99e]">{item.desc}</p><Empty icon={Trophy} title="التقدم غير متاح" description="يظهر التقدم لما تتفعل قواعد التحديات ويتم ربط سجل الزيارات بالحساب." /></section>;
      })}
    </div>
  </>;
}
function ReferralsScreen() {
  return <>
    <Head en="CUT CLUB / INVITE" title="شارك تجربة CUT"
      subtitle="ادعُ أصحابك واستكشف الإحالات بعد تفعيل قواعدها وربطها بحسابك." />
    <div className={surface}>
      <CardTitle icon={Users}>دعواتك وإحالاتك</CardTitle>
      <Empty icon={LockKeyhole} title="كود الدعوة مش متاح حاليًا" description="مش هنولّد كود وهمي أو نحتسب إحالة قبل ما تبقى منسوبة لحساب عميل موثّق." />
      <a href="/book" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#e4c1a6] underline underline-offset-4">احجز زيارتك القادمة <ArrowUpRight className="h-4 w-4" /></a>
    </div>
  </>;
}
function ProfileScreen() {
  return <>
    <Head en="CUT CLUB / MY ACCOUNT" title="مساحتك، وخصوصيتك"
      subtitle="ملف العميل وعضوياته ووسائل التواصل والتفضيلات، من غير ما تختار عميل تاني بمجرد رقم الهاتف." />
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={surface}><CardTitle icon={UserRound}>بيانات العضو</CardTitle><Empty title="مفيش جلسة عضو موثقة" description="ملف العضوية والبيانات الشخصية مش بيتعرضوا لزائر غير موثّق." /></div>
      <div className={surface}><CardTitle icon={ShieldCheck}>حماية محفظتك</CardTitle><p className="mt-5 text-sm leading-8 text-[#c8b5a6]">الاسم ورقم العضوية والأرصدة والقسائم لا تظهر إلا لصاحب الحساب. واجهة CUT CLUB جاهزة للتوصيل بقناة إثبات ملكية آمنة؛ الهاتف وحده مش كفاية.</p><a className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[#e7c7ab] underline underline-offset-4" href="/">العودة لموقع CUT Salon</a></div>
    </div>
  </>;
}

export default function CutClubExperience({ member = null, initialArea = "wallet", privateMode = false }: {
  member?: VerifiedClubMember | null;
  initialArea?: ClubArea;
  privateMode?: boolean;
}) {
  const [area, setArea] = useState<Area>(initialArea);
  useEffect(() => {
    if (!privateMode) return;
    const onPopState = () => {
      const section = window.location.pathname.split("/")[2] as Area | undefined;
      setArea(nav.some(n => n.id === section) ? section! : "wallet");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [privateMode]);
  const navigate = (next: Area) => {
    setArea(next);
    if (privateMode && typeof window !== "undefined") {
      const path = next === "wallet" ? "/club" : "/club/" + next;
      if (window.location.pathname !== path) window.history.pushState(null, "", path);
    }
  };
  const selected = nav.find(item => item.id === area) ?? nav[1];
  let content: ReactNode;
  if (area === "wallet") content = <WalletScreen member={member} go={navigate} />;
  else if (area === "home") content = <HomeScreen member={member} go={setArea} />;
  else if (area === "rewards") content = <RewardsScreen />;
  else if (area === "memberships") content = <MembershipsScreen />;
  else if (area === "challenges") content = <ChallengesScreen />;
  else if (area === "referrals") content = <ReferralsScreen />;
  else content = <ProfileScreen />;

  return <div dir="rtl" lang="ar" data-testid="cut-club-experience"
    className="relative min-h-dvh bg-[#0d0a0e] font-body text-[#fff8f0] selection:bg-[#c9a58b]/30">
    <a href="#cut-club-content" className="sr-only focus:not-sr-only focus:absolute focus:right-3 focus:top-3 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-black">انتقل لمحتوى CUT CLUB</a>
    <div className="mx-auto flex min-h-dvh max-w-[1800px]">
      <aside aria-label="قائمة النادي" className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-l border-[#e6c5a5]/15 bg-[#110e12] px-4 py-7 md:flex lg:w-[270px]">
        <a href="/" dir="ltr" className="text-center text-2xl font-black tracking-[.2em] text-[#fae4d2]">CUT <span className="font-light text-[#c9a489]">CLUB</span></a>
        <p className="mt-2 text-center text-[9px] tracking-[.2em] text-[#ab9289]">MEMBER EXPERIENCE</p>
        <div className="mt-9 rounded-2xl border border-[#e6c5a5]/20 bg-gradient-to-br from-[#4e1a29] to-[#21141b] p-4">
          <p className="text-xs text-[#d7b89f]">بطاقة النادي</p>
          <p className="mt-3 text-sm font-bold text-[#fff1e4]">{member?.displayName ?? "مساحة العميل"}</p>
          <p className="mt-2 text-[11px] text-[#d2b5a2]">{member?.tier ?? "عضوية خاصة"}</p>
        </div>
        <nav aria-label="أقسام CUT CLUB" className="mt-7 flex-1 space-y-1">
          {nav.map(item => {
            const Icon = item.icon;
            const active = area === item.id;
            return <button type="button" key={item.id} aria-current={active ? "page" : undefined} onClick={() => navigate(item.id)}
              className={"flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-right text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ecc9ad] " +
                (active ? "bg-[#e1c6af] text-[#2c121a]" : "text-[#d0bbb0] hover:bg-white/[.055] hover:text-white")}>
              <Icon aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />{item.title}
            </button>;
          })}
        </nav>
        <a href="/book" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d4b79e]/35 text-sm font-bold text-[#e1c5af] hover:bg-white/5"><CalendarDays className="h-4 w-4" /> احجز زيارة</a>
        <a href="/" className="mt-5 inline-flex items-center gap-2 text-xs text-[#a99186] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> موقع CUT Salon</a>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-[84px] items-center justify-between gap-4 border-b border-[#e6c5a5]/10 px-5 py-5 md:px-8 lg:px-10">
          <a href="/" aria-label="العودة لموقع CUT Salon"><p className={eyebrow} lang="en" dir="ltr">THE CUT CLUB</p><p className="mt-1 text-sm font-bold text-[#faeee2]">{selected.title}</p></a>
          <div className="flex items-center gap-2">
            <a href="/prices" className="hidden min-h-10 items-center rounded-xl border border-[#c8a990]/30 px-4 text-xs font-bold text-[#dcc2ae] hover:bg-white/5 sm:inline-flex">الأسعار</a>
            <a href="/book" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ebd7c1] px-4 text-sm font-bold text-[#30151c] hover:bg-white"><CalendarDays className="h-4 w-4" aria-hidden="true" /> احجز الآن</a>
            {member && <CutClubLogout />}
          </div>
        </header>
        <nav aria-label="الوصول السريع" className="flex gap-2 overflow-x-auto px-5 pt-4 md:px-8 lg:px-10">
          {(["challenges", "referrals", "profile"] as const).map(id => {
            const item = nav.find(n => n.id === id)!;
            const Icon = item.icon;
            return <button type="button" key={id} onClick={() => navigate(id)}
              aria-pressed={area === id}
              className={"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition " +
                (area === id ? "border-[#dfc0a2] bg-[#ead3ba] text-[#32161f]" : "border-[#c6a790]/20 text-[#cbb6a7] hover:bg-white/5")}>
              <Icon aria-hidden="true" className="h-4 w-4" />{item.title}
            </button>;
          })}
        </nav>
        <main id="cut-club-content" className="mx-auto max-w-[1240px] px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-8 md:px-8 md:pb-12 lg:px-10">
          {content}
        </main>
      </div>
    </div>
    <nav aria-label="CUT CLUB الموبايل" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e6c5a5]/20 bg-[#140d12]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {mobileNav.map(id => {
          const item = nav.find(n => n.id === id)!;
          const Icon = item.icon;
          const active = area === id;
          return <button type="button" key={id} aria-label={item.title} aria-current={active ? "page" : undefined} onClick={() => setArea(id)}
            className={"flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#edcfb5] " +
              (active ? "text-[#f1d3b8]" : "text-[#a99a91]")}>
            <Icon aria-hidden="true" className="h-5 w-5" />{item.title}
          </button>;
        })}
      </div>
    </nav>
  </div>;
}
