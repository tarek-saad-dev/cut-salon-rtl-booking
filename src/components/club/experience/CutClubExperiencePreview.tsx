"use client";

/**
 * CUT CLUB 2.0 responsive experience rehearsal — synthetic, dev-only (#56).
 *
 * NO fetch, OTP, cookies, localStorage, database, real balances or money.
 * Navigation and reward inspection are UI-only; transactions are disabled.
 * Parent route refuses all production requests irrespective of environment.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  House, Wallet, Gift, Crown, Trophy, Users, UserRound, Scissors,
  Sparkles, CalendarDays, ShieldCheck, Ticket, LockKeyhole, Stethoscope,
  GraduationCap, BriefcaseBusiness, Star, X, Info, ArrowLeft, CheckCircle2,
  Share2, History, Coins, Target, MapPin, ChevronLeft, HeartHandshake,
  MessageSquareText, Award, CircleHelp, ArrowUpRight,
} from "lucide-react";
import {
  CLUB_NAVIGATION, DEMO_MEMBERS, DEMO_REWARDS, MEMBERSHIP_PROGRAMS,
  DEMO_CHALLENGES,
} from "@/lib/club/experience/previewModel";
import type {
  ClubArea, DemoMember, DemoReward, MembershipProgram, PreviewPersona,
} from "@/lib/club/experience/previewModel";

const navIcons: Record<ClubArea, LucideIcon> = {
  home: House,
  wallet: Wallet,
  rewards: Gift,
  memberships: Crown,
  challenges: Trophy,
  referrals: Users,
  profile: UserRound,
};

const formatNum = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);

const card = "rounded-[1.6rem] border border-[#a48879]/20 bg-[#1c1014] p-5 shadow-[0_14px_40px_rgba(0,0,0,.16)] sm:p-6";
const label = "text-[10px] font-bold uppercase tracking-[.24em] text-[#d4b9a6]";

function SectionTitle({ eyebrow, title, description, aside }: {
  eyebrow: string; title: string; description: string; aside?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={label} dir="ltr">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-snug text-[#fff8ed] sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-[#ccbcb3]">{description}</p>
      </div>
      {aside}
    </div>
  );
}

function Notice({ children, icon: Icon = ShieldCheck }: {
  children: ReactNode; icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#d8bc9d]/25 bg-[#d8bc9d]/[.07] px-4 py-3 text-xs leading-6 text-[#ebd9c5]">
      <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function BrowseAction({ text = "مقفل لحين إطلاق النظام الآمن" }: { text?: string }) {
  return (
    <button type="button" disabled
      title="ميزة غير متاحة في المعاينة"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.045] px-4 text-xs font-bold text-[#aa9990] disabled:cursor-not-allowed">
      <LockKeyhole aria-hidden="true" className="h-4 w-4" />
      {text}
    </button>
  );
}

function MiniStat({ title, value, suffix, icon: Icon }: {
  title: string; value: string; suffix?: string; icon: LucideIcon;
}) {
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-[#c8b7ab]">{title}</p>
        <Icon aria-hidden="true" className="h-4 w-4 text-[#d8bc9d]" />
      </div>
      <p dir="ltr" className="mt-4 text-right text-3xl font-bold tabular-nums tracking-tight text-[#fcf9ed]">
        <bdi>{value}</bdi>
        {suffix ? <span className="ms-2 text-xs font-semibold text-[#c6ae99]">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-[11px] text-[#a99790]">قيمة تجريبية للعرض فقط</p>
    </div>
  );
}

function MemberCard({ member }: { member: DemoMember }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#e2bfa4]/35 bg-gradient-to-bl from-[#5e1e2b] via-[#360d17] to-[#140b10] p-6 shadow-[0_25px_60px_rgba(0,0,0,.22)] sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full border-[25px] border-[#e8c5a8]/[.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full border-[45px] border-[#e8c5a8]/[.06]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p dir="ltr" className="text-[11px] font-bold tracking-[.26em] text-[#e1c1a4]">CUT CLUB / MEMBER</p>
          <p className="mt-5 text-2xl font-extrabold text-[#fff8ed] sm:text-3xl">{member.name}</p>
          <p dir="ltr" className="mt-2 text-right text-[11px] tracking-[.18em] text-[#d0b3a4]">{member.cutId}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e7c5ac]/30 bg-white/10">
          <Scissors className="h-6 w-6 text-[#e7c5ac]" aria-hidden="true" />
        </div>
      </div>
      <div className="relative mt-10 flex items-end justify-between gap-3 border-t border-white/15 pt-5">
        <div>
          <p className="text-xs text-[#d4b6a6]">المستوى الحالي</p>
          <p dir="ltr" className="mt-1 text-xl font-bold tracking-[.17em] text-[#fff8ed]">{member.tier.toUpperCase()}</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-[#d4b6a6]">CUT Coins</p>
          <p dir="ltr" className="mt-1 text-2xl font-bold text-[#fff8ed]">{formatNum(member.coins)}</p>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ member, navigate }: { member: DemoMember; navigate: (tab: ClubArea) => void }) {
  return (
    <>
      <SectionTitle eyebrow="YOUR SPACE / 01" title="كل زيارة ليها حكاية"
        description="مكان واحد يجمع عضويتك وزياراتك ومكافآتك. المعاينة دي بتعرض تجربة العميل المستقبلية بأرقام توضيحية." />
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <MemberCard member={member} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className={card}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2c6a6]/10"><CalendarDays className="h-5 w-5 text-[#e2c6a6]" /></span>
              <div><p className="text-xs text-[#beafa5]">زيارتك القادمة</p><h3 className="font-semibold">{member.nextBooking || "مفيش حجز تجريبي"}</h3></div>
            </div>
            <a href="/book" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f1e2d2] px-5 text-sm font-bold text-[#38131e] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9bea6]">
              احجز زيارتك <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className={card}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">رحلتك مع CUT</p>
              <span className="rounded-full bg-[#d8bc9d]/10 px-3 py-1 text-[11px] text-[#d8bc9d]">عضوية {member.tier}</span>
            </div>
            <p className="mt-3 text-3xl font-bold">{formatNum(member.visits)} <span className="text-sm font-medium text-[#cab7ac]">زيارات تجريبية</span></p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d8bc9d]" style={{ width: String(Math.min(100, (member.milestone % 5) * 20)) + "%" }} /></div>
            <button onClick={() => navigate("challenges")} className="mt-4 min-h-10 text-xs font-bold text-[#e8c7ac] underline underline-offset-4">اكتشف تحديات الزيارات</button>
          </div>
        </div>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <MiniStat title="CUT Coins" value={formatNum(member.coins)} suffix="CC" icon={Coins} />
        <MiniStat title="القسائم" value={formatNum(member.vouchers.filter(v => v.status === "active").length)} icon={Ticket} />
        <MiniStat title="زياراتك" value={formatNum(member.visits)} icon={Scissors} />
      </div>
      <div className="mt-10">
        <SectionTitle eyebrow="BUILT AROUND YOU" title="أكتر من مجرد نقاط"
          description="من العضوية للمكافآت، كل حاجة بتتكامل مع رحلة العميل." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            { icon: Wallet, title: "محفظتك", desc: "رصيدك، القسائم، وحركة النقاط.", to: "wallet" as ClubArea },
            { icon: Gift, title: "مكافآتك", desc: "استكشف أمثلة المتجر والصناديق.", to: "rewards" as ClubArea },
            { icon: Crown, title: "عضويتك", desc: "المستويات والاتفاقيات المستقبلية.", to: "memberships" as ClubArea },
            { icon: Trophy, title: "تحدياتك", desc: "رحلة الزيارات والإنجازات.", to: "challenges" as ClubArea },
            { icon: Users, title: "شارك CUT", desc: "تصور الإحالات والدعوات.", to: "referrals" as ClubArea },
            { icon: ShieldCheck, title: "خصوصيتك", desc: "هوية موثقة قبل عرض أي بيانات.", to: "profile" as ClubArea },
          ]).map(({ icon: Icon, title, desc, to }) => (
            <button key={to} onClick={() => navigate(to)}
              className={card + " group min-h-44 text-right transition hover:border-[#d9bca5]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dbbba0]"}>
              <Icon aria-hidden="true" className="h-6 w-6 text-[#dabda6]" />
              <p className="mt-5 text-lg font-bold">{title}</p>
              <p className="mt-2 text-xs leading-6 text-[#bdaa9d]">{desc}</p>
              <ArrowLeft aria-hidden="true" className="mt-3 h-4 w-4 text-[#e4cbb6] transition group-hover:-translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function WalletScreen({ member }: { member: DemoMember }) {
  return (
    <>
      <SectionTitle eyebrow="YOUR WALLET / 02" title="محفظتك، بوضوح"
        description="النقاط والرصيد الترويجي والقسائم 3 أنواع مختلفة، ومينفعش نخلطهم. الأرقام دي مجرد عينة للشكل النهائي." />
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat title="CUT Coins" value={formatNum(member.coins)} suffix="CC" icon={Coins} />
        <MiniStat title="رصيد ترويجي توضيحي" value={formatNum(member.promoCreditEGP)} suffix="EGP" icon={Wallet} />
        <MiniStat title="قسائم نشطة" value={String(member.vouchers.filter(v => v.status === "active").length)} icon={Ticket} />
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        <section className={card} aria-labelledby="voucher-heading">
          <div className="flex items-center justify-between gap-3"><h3 id="voucher-heading" className="text-lg font-bold">قسائمك</h3><Ticket className="h-5 w-5 text-[#d8bc9d]" /></div>
          {member.vouchers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 p-8 text-center">
              <Gift aria-hidden="true" className="mx-auto h-8 w-8 text-[#c8b09c]" />
              <p className="mt-3 text-sm text-[#c4b0a5]">مفيش قسائم في الحساب التجريبي ده</p>
              <p className="mt-2 text-xs text-[#99887f]">القسائم الحقيقية هتظهر بعد تسجيل الدخول الآمن.</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {member.vouchers.map(v => (
                <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#a48879]/25 bg-white/[.025] p-4">
                  <div><p className="text-sm font-semibold">{v.label}</p><p className="mt-1 text-xs text-[#b4a297]">DEMO · NOT VALID</p></div>
                  <span className="shrink-0 rounded-full bg-[#d8bc9d]/10 px-3 py-1 text-[11px] text-[#dec4ad]">{v.status === "active" ? "عينة نشطة" : "عينة مستخدمة"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={card} aria-labelledby="history-heading">
          <div className="flex items-center justify-between gap-3"><h3 id="history-heading" className="text-lg font-bold">حركة النقاط</h3><History className="h-5 w-5 text-[#d8bc9d]" /></div>
          {member.movements.length === 0 ? (
            <p className="mt-8 text-sm leading-7 text-[#bbaaa0]">لا توجد حركات في المثال ده. الحساب الحقيقي هيعرض السجل بعد التحقق.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {member.movements.map(tx => (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-4">
                  <div><p className="text-sm font-semibold">{tx.label}</p><p className="mt-1 text-xs text-[#a9968c]">{tx.detail}</p></div>
                  <span dir="ltr" className="font-semibold tabular-nums text-[#e8d0bd]">{tx.amount > 0 ? "+" : ""}{formatNum(tx.amount)} CC</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="mt-5"><Notice>الرصيد الحقيقي والقسائم والتاريخ مش هيظهروا لأي شخص غير صاحب الحساب بعد التحقق من الهوية. مفيش أي عمليات مالية من المعاينة.</Notice></div>
    </>
  );
}

function RewardsScreen({ member, selected, select }: {
  member: DemoMember; selected: string | null; select: (id: string | null) => void;
}) {
  const chosen = DEMO_REWARDS.find(r => r.id === selected) ?? null;
  return (
    <>
      <SectionTitle eyebrow="THE REWARD ROOM / 03" title="مكافآت على مقاس زيارتك"
        description="المتجر والصناديق دي تجربة تصميم تفاعلية. الأسعار المعروضة أمثلة وليست عروضًا معتمدة، والخصم والاستبدال متوقفان." />
      <Notice icon={Info}>كل الأزرار المالية مقفولة عمدًا. اختيار مكافأة بيعرض تفاصيل شكلية فقط، ومش بيخصم Coins.</Notice>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DEMO_REWARDS.map((reward, index) => (
          <article key={reward.id} className="group overflow-hidden rounded-[1.5rem] border border-[#b69b85]/25 bg-[#1d1115] transition hover:border-[#e2c3a7]/50">
            <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-[#612b37] via-[#351723] to-[#100e13]">
              <div aria-hidden="true" className="absolute -end-8 -bottom-14 h-36 w-36 rounded-full border-[18px] border-[#e8c4ac]/10" />
              {reward.icon === "box" ? <Gift className="h-14 w-14 text-[#e9c9ab]" /> :
                reward.icon === "scissors" ? <Scissors className="h-14 w-14 text-[#e9c9ab]" /> :
                reward.icon === "gift" ? <Award className="h-14 w-14 text-[#e9c9ab]" /> :
                <Sparkles className="h-14 w-14 text-[#e9c9ab]" />}
              <span className="absolute right-4 top-4 rounded-full border border-[#e8c4ac]/30 bg-black/25 px-3 py-1 text-[10px] text-[#efd2ba]">{reward.tag}</span>
              <span className="absolute bottom-3 left-4 font-editorial text-5xl text-[#ead0bd]/15">0{index + 1}</span>
            </div>
            <div className="p-5">
              <p className={label} dir="ltr">{reward.nameEn}</p>
              <h3 className="mt-2 text-lg font-bold">{reward.name}</h3>
              <p className="mt-2 text-sm text-[#ceb4a4]"><bdi>{formatNum(reward.coins)}</bdi> CC <span className="text-xs text-[#ad988f]">· سعر افتراضي</span></p>
              <button type="button" onClick={() => select(selected === reward.id ? null : reward.id)}
                aria-expanded={selected === reward.id}
                aria-controls="club-preview-reward-details"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e0c0a5]/30 px-4 text-sm font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e3bea0]">
                تفاصيل التجربة <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <section id="club-preview-reward-details" aria-live="polite" className={card + " mt-6"}>
        {chosen ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className={label} dir="ltr">REWARD PREVIEW · {chosen.nameEn}</p>
              <h3 className="mt-2 text-xl font-bold">{chosen.name}</h3>
              <p className="mt-3 text-sm leading-7 text-[#cbb7aa]">{chosen.description}</p>
              <p className="mt-3 text-xs text-[#dbc3b1]">الرصيد التجريبي الحالي: {formatNum(member.coins)} CC — غير قابل للاستخدام</p>
            </div>
            <div className="flex flex-col gap-2">
              <BrowseAction text={chosen.icon === "box" ? "فتح الصندوق غير متاح" : "الاستبدال غير متاح"} />
              <button onClick={() => select(null)} className="inline-flex min-h-10 items-center justify-center gap-1 text-sm text-[#cdb7a7] hover:text-white">
                <X className="h-4 w-4" aria-hidden="true" /> إغلاق التفاصيل
              </button>
            </div>
          </div>
        ) : <p className="text-sm text-[#b5a297]">اختار مكافأة من فوق علشان تتفرج على تفاصيل التجربة.</p>}
      </section>
    </>
  );
}

const partnerIcons: Record<MembershipProgram["id"], LucideIcon> = {
  standard: Crown, education: GraduationCap,
  medical: Stethoscope, corporate: BriefcaseBusiness,
};

function MembershipsScreen({ member }: { member: DemoMember }) {
  const tiers = [
    { name: "Guest", title: "بداية الرحلة", caption: "تعرف على البرنامج" },
    { name: "Silver", title: "خطوة أقرب", caption: "المستوى المتوسط" },
    { name: "Gold", title: "مكانة مميزة", caption: "المستوى المتقدم" },
  ];
  return (
    <>
      <SectionTitle eyebrow="YOUR STATUS / 04" title="العضوية بداية علاقة"
        description="مستويات مرنة، ومسارات توسع للطلاب والأطباء والشركات. ده تصور للتجربة مش شروط عضوية نهائية." />
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier, index) => (
          <div key={tier.name} className={card + (member.tier === tier.name ? " border-[#e2bea3]/70 bg-gradient-to-bl from-[#49202a] to-[#1d1015]" : "")}>
            <div className="flex justify-between gap-3"><Crown className="h-6 w-6 text-[#d8bc9d]" /><span className="text-xs text-[#ccb6a6]">0{index + 1}</span></div>
            <p dir="ltr" className="mt-8 font-brand text-2xl tracking-[.18em]">{tier.name.toUpperCase()}</p>
            <p className="mt-3 text-sm font-semibold">{tier.title}</p>
            <p className="mt-2 text-xs text-[#b8a69a]">{tier.caption}</p>
            <p className="mt-5 text-xs text-[#e1c5ae]">{member.tier === tier.name ? "المستوى التجريبي الحالي" : "متاح ضمن التصميم"}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <SectionTitle eyebrow="MEMBERSHIP ECOSYSTEM" title="مسارات للشراكات والعضويات"
          description="قابلة لإضافة جهات جديدة وفروع وشروط أهلية مختلفة بدون إعادة بناء نظام الولاء." />
        <div className="grid gap-4 md:grid-cols-2">
          {MEMBERSHIP_PROGRAMS.map(program => {
            const Icon = partnerIcons[program.id];
            return (
              <article key={program.id} className={card}>
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-7 w-7 text-[#e0bfa4]" aria-hidden="true" />
                  <span dir="ltr" className={label}>{program.eyebrow}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{program.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#cdbab0]">{program.summary}</p>
                <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-[#b09e92]">{program.note}</p>
                <div className="mt-5"><BrowseAction text="التسجيل ضمن التطوير" /></div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ChallengesScreen() {
  return (
    <>
      <SectionTitle eyebrow="STAY IN THE CLUB / 05" title="رحلتك تستمر"
        description="تحديات الزيارات والروتين والهدايا داخل الفرع — كلها محكومة بقواعد واضحة وبسجل زيارات مؤهل." />
      <div className="grid gap-4 md:grid-cols-3">
        {DEMO_CHALLENGES.map(challenge => (
          <article key={challenge.id} className={card}>
            <div className="flex items-start justify-between gap-3"><Target className="h-6 w-6 text-[#d8bc9d]" /><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-[#c7b1a4]">{challenge.status === "planned" ? "فكرة مستقبلية" : "تقدم تجريبي"}</span></div>
            <h3 className="mt-5 text-lg font-bold">{challenge.title}</h3>
            <p className="mt-2 min-h-14 text-xs leading-6 text-[#bba99e]">{challenge.description}</p>
            <div className="mt-5 flex items-center justify-between text-xs text-[#dac1ad]"><span>المراحل</span><span dir="ltr">{challenge.progress} / {challenge.target}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d8bc9d]" style={{ width: String((challenge.progress / challenge.target) * 100) + "%" }} /></div>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-[#e5c0a3]/25 bg-gradient-to-br from-[#4e1b28] to-[#150d14] p-7">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-[#e4c4a5]/35 bg-white/10"><Gift className="h-6 w-6 text-[#ead1b7]" /></div>
          <p className={label + " mt-6"} dir="ltr">IN-SALON EXPERIENCE</p>
          <h3 className="mt-2 text-2xl font-bold">لحظة الهدية جوه CUT</h3>
          <p className="mt-4 text-sm leading-7 text-[#dac6b5]">تصوّر كرة الهدايا داخل الصالون، بفُرص وشروط عادلة ومعتمدة قبل تشغيلها.</p>
          <BrowseAction text="التجربة لسه مش مفعّلة" />
        </div>
        <div className={card}>
          <HeartHandshake aria-hidden="true" className="h-7 w-7 text-[#d8bc9d]" />
          <h3 className="mt-4 text-xl font-bold">رأيك يساعدنا نتطور</h3>
          <p className="mt-3 text-sm leading-8 text-[#cbb9ae]">مشاركة تقييم أو متابعة الصفحات اختيارية تمامًا. أي هدايا داخل الفرع لا تكون مشروطة بكتابة تقييم أو بتقييم إيجابي، ونحافظ على مصداقية الآراء.</p>
          <Notice icon={MessageSquareText}>هدف CUT CLUB بناء علاقة حقيقية، مش شراء تقييمات أو متابعات.</Notice>
        </div>
      </div>
    </>
  );
}

function ReferralsScreen() {
  return (
    <>
      <SectionTitle eyebrow="BRING YOUR CIRCLE / 06" title="CUT أحلى مع أصحابك"
        description="نظام دعوات مستقبلية يتأكد إن الزيارة حصلت وإن المكافأة مستحقة قبل أي رصيد جديد." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="relative overflow-hidden rounded-[1.8rem] border border-[#e7c4a9]/30 bg-gradient-to-l from-[#4a1625] to-[#241016] p-7 sm:p-9">
          <Share2 className="h-8 w-8 text-[#e7c4a9]" aria-hidden="true" />
          <h3 className="mt-7 text-2xl font-bold">شارك التجربة. مش كود وهمي.</h3>
          <p className="mt-4 max-w-lg text-sm leading-8 text-[#dbc6b6]">الكود الحقيقي لا يتولد إلا بعد التحقق من حساب العضو واعتماد قواعد الإحالة. مفيش أكواد قابلة للاستخدام في المعاينة.</p>
          <div dir="ltr" className="mt-6 max-w-sm rounded-xl border border-dashed border-[#d8bc9d]/40 bg-black/20 px-5 py-4 text-center font-bold tracking-[.18em] text-[#e1c0a8]">DEMO · NO CODE</div>
          <div className="mt-5"><BrowseAction text="المشاركة الفعلية غير مفعّلة" /></div>
        </div>
        <div className={card}>
          <h3 className="text-lg font-bold">كيف هتشتغل الإحالات؟</h3>
          <ol className="mt-6 space-y-5">
            {[
              ["01", "العميل يتأكد من حسابه", "دخول برقم موثّق وجلسة آمنة."],
              ["02", "يدعو صديقًا", "رابط أو كود يصدر من النظام، مش من الجهاز."],
              ["03", "الزيارة تتأكد", "تسجيل زيارة مكتملة ومؤهلة."],
              ["04", "تُصرف المكافأة", "مرة واحدة وبسجل واضح وبدون تكرار."],
            ].map(([number, title, copy]) => (
              <li key={number} className="flex gap-4"><span dir="ltr" className="font-editorial text-xl text-[#dabda6]">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-6 text-[#bba99e]">{copy}</p></div></li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}

function ProfileScreen({ member }: { member: DemoMember }) {
  return (
    <>
      <SectionTitle eyebrow="YOU & CUT / 07" title="حسابك بإيدك"
        description="تصوّر للملف الشخصي وإعدادات الخصوصية والشراكات. مش فيه بيانات شخصية حقيقية." />
      <div className="grid gap-5 lg:grid-cols-[1fr_.9fr]">
        <div className={card}>
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d8bc9d]/15"><UserRound className="h-7 w-7 text-[#e8c7ab]" /></div>
            <div><p className="text-lg font-bold">{member.name}</p><p dir="ltr" className="mt-1 text-right text-xs text-[#b8a296]">{member.cutId}</p></div>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-[#b3a097]">مستوى العضوية</dt><dd className="mt-1 font-semibold">{member.tier}</dd></div>
            <div><dt className="text-xs text-[#b3a097]">الفرع</dt><dd className="mt-1 font-semibold">جليم / كامب شيزار</dd></div>
            <div><dt className="text-xs text-[#b3a097]">جهة العضوية</dt><dd className="mt-1 text-sm font-semibold">غير مرتبطة في المعاينة</dd></div>
            <div><dt className="text-xs text-[#b3a097]">رقم التليفون</dt><dd className="mt-1 text-sm font-semibold">غير معروض — بيانات تجريبية</dd></div>
          </dl>
          <div className="mt-8"><BrowseAction text="تعديل البيانات بعد التوثيق" /></div>
        </div>
        <div className="grid gap-4">
          <div className={card}>
            <ShieldCheck className="h-7 w-7 text-[#d8bc9d]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold">حماية بياناتك أولًا</h3>
            <p className="mt-3 text-sm leading-8 text-[#c8b5aa]">التجربة الحقيقية هتستخدم كود تحقق ومراجعة جلسات الدخول. عمرنا ما هنسمح باستخدام رقم حساب من رابط علشان يعرض رصيد شخص تاني.</p>
          </div>
          <div className={card}>
            <CircleHelp className="h-6 w-6 text-[#d8bc9d]" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold">تحتاج مساعدة؟</h3>
            <p className="mt-3 text-sm leading-7 text-[#c8b5aa]">فريق الاستقبال يقدر يراجع الخدمات والقسائم الحقيقية من الأنظمة المصرّح بها.</p>
            <a href="/book" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#e4c6ad] underline underline-offset-4">احجز زيارة <ArrowLeft className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CutClubExperiencePreview() {
  const [area, setArea] = useState<ClubArea>("home");
  const [persona, setPersona] = useState<PreviewPersona>("regular");
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);
  const member = DEMO_MEMBERS[persona];

  const navigate = (next: ClubArea) => {
    setArea(next);
    setSelectedReward(null);
    // Navigation stays in the synthetic client-side rehearsal only.
  };

  const section = area === "home" ? <HomeScreen member={member} navigate={navigate} /> :
    area === "wallet" ? <WalletScreen member={member} /> :
    area === "rewards" ? <RewardsScreen member={member} selected={selectedReward} select={setSelectedReward} /> :
    area === "memberships" ? <MembershipsScreen member={member} /> :
    area === "challenges" ? <ChallengesScreen /> :
    area === "referrals" ? <ReferralsScreen /> :
    <ProfileScreen member={member} />;

  return (
    <div dir="rtl" lang="ar" data-testid="club-experience-preview"
      data-preview-hydrated={isHydrated ? "true" : "false"}
      className="fixed inset-0 z-[9999] flex overflow-hidden bg-[#0a080a] text-[#fcf9ed] selection:bg-[#d6ae96]/40">
      <a href="#club-preview-content" className="sr-only focus:not-sr-only focus:absolute focus:right-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-black">انتقل إلى محتوى CUT CLUB</a>

      <aside aria-label="قائمة النادي" className="hidden w-[250px] shrink-0 flex-col border-l border-[#a48879]/20 bg-[#110c0f] px-5 py-7 md:flex lg:w-[274px]">
        <p dir="ltr" className="text-center text-2xl font-black tracking-[.25em] text-[#f9e5cf]">CUT<span className="font-light text-[#bda088]"> CLUB</span></p>
        <p className="mt-2 text-center text-[10px] tracking-[.22em] text-[#b9a198]">MEMBERS EXPERIENCE</p>
        <div className="mt-10 rounded-2xl border border-[#e3c4a7]/20 bg-gradient-to-br from-[#3d1621] to-[#211116] p-4">
          <p className="text-xs text-[#e6c9b4]">العضوية التجريبية</p>
          <p className="mt-2 font-bold">{member.name}</p>
          <span dir="ltr" className="mt-3 inline-flex rounded-lg border border-[#d8bc9d]/30 px-3 py-1 text-xs tracking-widest text-[#dec1a7]">{member.tier.toUpperCase()}</span>
        </div>
        <nav className="mt-8 flex-1 space-y-1.5" aria-label="أقسام CUT CLUB">
          {CLUB_NAVIGATION.map(tab => {
            const Icon = navIcons[tab.id];
            const active = area === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => navigate(tab.id)}
                aria-current={active ? "page" : undefined}
                className={"flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-right text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ecc5a5] " +
                  (active ? "bg-[#d8bc9d] text-[#251018]" : "text-[#c5b2aa] hover:bg-white/[.06] hover:text-white")}>
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="flex-1">{tab.label}</span>
                <span dir="ltr" className={"text-[10px] " + (active ? "text-[#55313b]" : "text-[#8d7771]")}>{tab.caption}</span>
              </button>
            );
          })}
        </nav>
        <p className="mt-4 text-center text-[10px] leading-5 text-[#987f77]">CUT SALON · ALEXANDRIA<br />UI PREVIEW — NO REAL DATA</p>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 border-b border-[#b99b88]/15 bg-[#100b0e]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1250px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span dir="ltr" className="text-lg font-black tracking-[.18em] text-[#e9d3bc] md:hidden">CUT CLUB</span>
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#d8bc9d]/20 md:flex"><Scissors className="h-4 w-4 text-[#d8bc9d]" aria-hidden="true" /></div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">تجربة العضو</p>
                <p className="text-[11px] text-[#ac988b]">تصميم تجريبي · ليس حساب عميل حقيقي</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d6bc9b]/40 bg-[#d6bc9b]/10 px-3 py-2 text-[11px] font-bold text-[#e4c9ad]">DEMO / بيانات افتراضية</span>
              <label className="sr-only" htmlFor="club-preview-persona">اختر حالة العميل التجريبية</label>
              <select id="club-preview-persona" value={persona}
                onChange={event => { setPersona(event.target.value as PreviewPersona); setSelectedReward(null); }}
                className="min-h-10 max-w-[170px] rounded-xl border border-[#a48879]/35 bg-[#291920] px-3 text-xs font-semibold text-[#fff8ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e0c09e]">
                <option value="new">عميل جديد</option>
                <option value="regular">عضو منتظم</option>
                <option value="vip">عضو مميز</option>
              </select>
            </div>
          </div>
        </header>

        <nav aria-label="تنقل الأقسام على الموبايل" className="sticky top-[65px] z-20 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#100b0e]/95 px-4 py-3 md:hidden">
          {CLUB_NAVIGATION.map(tab => (
            <button key={tab.id} type="button" onClick={() => navigate(tab.id)}
              aria-current={area === tab.id ? "page" : undefined}
              className={"min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold " +
                (area === tab.id ? "border-[#dfbea4] bg-[#ddc0a5] text-[#271118]" : "border-[#947b71]/30 text-[#d3bfb1]")}>{tab.label}</button>
          ))}
        </nav>

        <main id="club-preview-content" className="mx-auto w-full max-w-[1250px] px-4 pb-14 pt-7 sm:px-6 md:pt-10 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[11px] text-[#a99790]"><ShieldCheck className="h-4 w-4" /> البيانات لا تغادر المتصفح</div>
            <span className="text-[11px] text-[#a99790]">DESKTOP + MOBILE EXPERIENCE</span>
          </div>
          {section}
          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#a48879]/20 pt-6 text-xs leading-6 text-[#9b887c]">
            <span>CUT CLUB 2.0 — تجربة تصميم واختبار داخلية فقط</span>
            <span>لا توجد معاملات أو عضويات فعلية داخل هذه النسخة</span>
          </footer>
        </main>
      </div>

      <nav aria-label="التنقل الرئيسي للموبايل" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#bd9b86]/25 bg-[#100b0e]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {([
          ["home", "الرئيسية"], ["wallet", "محفظتي"], ["rewards", "المكافآت"], ["memberships", "العضوية"], ["profile", "حسابي"],
        ] as const).map(([id, name]) => {
          const Icon = navIcons[id];
          return (
            <button key={id} type="button" onClick={() => navigate(id)}
              aria-current={area === id ? "page" : undefined}
              className={"flex min-h-[62px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ecc2a4] " +
                (area === id ? "text-[#edcbb0]" : "text-[#8f7d72]")}>
              <Icon aria-hidden="true" className="h-5 w-5" />
              {name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
