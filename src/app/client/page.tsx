import type { Metadata } from "next";
import Link from "next/link";

/**
 * CUT CLUB 2.0 — retirement of unverified phone-only login (#52).
 *
 * This static route does not accept login, edit profile, phone lookup,
 * query redirects, localStorage or browser client identity. The replacement
 * /club must wait for verified OTP, revocable sessions and Casher authorization.
 * Existing staff POS, bookings and stored customer data are untouched.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حسابي | CUT SALON",
  description: "تسجيل الدخول الجديد إلى CUT CLUB تحت التجهيز لحماية بيانات العملاء.",
  robots: { index: false, follow: false },
};

export default function LegacyClientLoginRetirementPage() {
  return (
    <main dir="rtl" className="relative flex min-h-[80vh] items-center justify-center bg-cut-black px-4 py-16 text-cut-ivory sm:px-6">
      <section aria-labelledby="client-migration-title" className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-10 text-center sm:px-12 sm:py-14">
        <span className="inline-flex rounded-full border border-cut-gold/25 bg-cut-gold/10 px-4 py-2 text-xs font-bold tracking-wide text-cut-gold">
          CUT CLUB 2.0
        </span>
        <h1 id="client-migration-title" className="mt-7 text-3xl font-black leading-snug sm:text-4xl">
          بنجهّز تسجيل دخول أكثر أمانًا
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-8 text-cut-ivory/75">
          الدخول لحسابك بالطريقة القديمة وتعديل البيانات متوقفين مؤقتًا.
          بنجهّز التحقق من رقم التليفون قبل عرض بيانات العضوية والمكافآت.
        </p>
        <div role="status" className="mx-auto mt-7 max-w-md rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm leading-7 text-cut-ivory/70">
          الصفحة دي مش هتطلب منك رقم تليفون أو أي بيانات شخصية.
          تقدر تكمل الحجز بشكل طبيعي، ولو محتاج تراجع بياناتك تواصل مع فريق الاستقبال.
        </div>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/book" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-cut-gold px-7 py-3 text-sm font-black text-cut-black hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold">
            احجز زيارتك
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-7 py-3 text-sm font-bold text-cut-ivory hover:border-cut-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold">
            الصفحة الرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
