import type { Metadata } from "next";
import Link from "next/link";

/**
 * CUT CLUB 2.0 migration — anonymous legacy member page retirement (#50).
 *
 * Never read query clientId, localStorage, phone identifiers, balances or
 * inventory here. A verified member session will later live under /club,
 * gated by Casher customer identity and tenant-safe APIs (#243/#269).
 *
 * This page has no purchase, reward redemption or Mystery Box handlers.
 * Staff/POS ledger and booking endpoints are untouched.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CUT CLUB | بنأمّن حسابك",
  description: "تحديث أمان حسابات CUT CLUB. الحجز متاح، وعمليات المكافآت متوقفة مؤقتًا لحماية حسابات العملاء.",
  robots: { index: false, follow: false },
};

export default function LegacyCutClubMaintenancePage() {
  return (
    <main dir="rtl" className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden bg-cut-black px-4 py-16 text-cut-ivory sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-cut-gold/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-cut-bronze/10 blur-3xl" />
      <section aria-labelledby="cut-club-maintenance-title" className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-10 text-center shadow-2xl sm:px-12 sm:py-14">
        <span className="inline-flex items-center rounded-full border border-cut-gold/25 bg-cut-gold/[0.08] px-4 py-2 text-xs font-semibold tracking-wide text-cut-gold">
          CUT CLUB 2.0
        </span>
        <h1 id="cut-club-maintenance-title" className="mt-7 text-3xl font-black leading-tight sm:text-5xl">
          بنجهّز تجربة CUT CLUB الجديدة
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-cut-ivory/75 sm:text-lg">
          لوحة العضوية القديمة وشراء واستبدال المكافآت وفتح صناديق الجوائز متوقفين مؤقتًا،
          لحد ما نكمّل تسجيل الدخول الآمن وحماية حسابات العملاء.
        </p>
        <div role="status" className="mx-auto mt-7 max-w-lg rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm leading-7 text-cut-ivory/75">
          إيقاف الصفحة دي مش بيخصم نقاط من رصيدك أو بيمسح سجلات مكافآتك.
          لو عندك قسيمة أو مكافأة سابقة، راجع فريق الاستقبال للتحقق من حالتها.
        </div>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/book"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cut-gold px-7 py-3 text-sm font-black text-cut-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold"
          >
            احجز زيارتك
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-7 py-3 text-sm font-bold text-cut-ivory transition hover:border-cut-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold"
          >
            الصفحة الرئيسية
          </Link>
        </div>
        <p className="mt-8 text-xs leading-6 text-cut-ivory/45">
          مش محتاج تدخل رقم تليفونك أو بيانات حسابك في الصفحة القديمة.
        </p>
      </section>
    </main>
  );
}
