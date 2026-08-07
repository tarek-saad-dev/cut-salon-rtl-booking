"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Search, Sparkles } from "lucide-react";
import BookingLookupPanel from "@/components/booking-management/BookingLookupPanel";
import CustomerUpcomingBookings from "@/components/CustomerUpcomingBookings";
import { useLanguage } from "@/context/LanguageContext";
import { normalizeBookingCode } from "@/lib/booking-management/display";

function BookingPageInner() {
  const searchParams = useSearchParams();
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  const rawCode = searchParams.get("code") ?? "";
  const initialCode = rawCode ? normalizeBookingCode(rawCode) : "";
  // Never read token from URL — only bookingCode is allowed in query.
  const [tab, setTab] = useState<"lookup" | "upcoming">(
    initialCode ? "lookup" : "lookup",
  );

  return (
    <main
      dir={dir}
      lang={lang}
      className="relative min-h-[100svh] overflow-hidden bg-cut-soft-ivory text-cut-black"
    >
      {/* Atmosphere: beige + soft burgundy glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(74,0,15,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(164,136,121,0.18),_transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -start-16 top-24 h-56 w-56 rounded-full bg-cut-burgundy/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-10 top-48 h-44 w-44 rounded-full bg-cut-warm-beige/50 blur-3xl"
      />

      <header className="sticky top-0 z-30 border-b border-cut-bronze/20 bg-cut-black text-cut-ivory">
        <div className="relative mx-auto flex h-14 max-w-lg items-center justify-center px-4">
          <Link
            href="/"
            className={`absolute top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 text-xs font-semibold text-cut-ivory/75 transition hover:text-cut-warm-beige ${
              ar ? "right-3" : "left-3"
            }`}
          >
            <BackIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {ar ? "الرئيسية" : "Home"}
          </Link>

          <Link
            href="/"
            className="group flex select-none items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
            aria-label={ar ? "CUT Salon - الرئيسية" : "CUT Salon - Home"}
          >
            <span className="text-base font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
              —
            </span>
            <div className="mx-0.5 text-center">
              <span className="font-brand text-xl font-black leading-none tracking-[0.22em] text-cut-ivory">
                CUT
              </span>
              <div className="-mt-0.5 text-[8px] font-semibold tracking-[0.45em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
                SALON
              </div>
            </div>
            <span className="text-base font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
              —
            </span>
          </Link>

          <Link
            href="/book"
            className={`absolute top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-cut-ivory/10 px-3 py-1.5 text-[11px] font-bold text-cut-warm-beige transition hover:bg-cut-ivory/15 ${
              ar ? "left-3" : "right-3"
            }`}
          >
            {ar ? "احجز" : "Book"}
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-lg px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
        <div className="mb-7">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cut-burgundy/75">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            {ar ? "إدارة المواعيد" : "Appointments"}
          </p>
          <h1 className="font-heading text-3xl font-black tracking-tight text-cut-burgundy sm:text-4xl">
            {ar ? "حجوزاتي" : "My bookings"}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-cut-black/60">
            {ar
              ? "ابحث بكود الحجز أو اعرض مواعيدك القادمة برقم الموبايل."
              : "Look up a booking code or view upcoming appointments by mobile number."}
          </p>
        </div>

        <div
          className="mb-5 flex gap-1 rounded-2xl border border-cut-burgundy/10 bg-cut-ivory/80 p-1 shadow-[0_8px_30px_rgba(74,0,15,0.06)] backdrop-blur-sm"
          role="tablist"
          aria-label={ar ? "طريقة البحث" : "Lookup method"}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "lookup"}
            onClick={() => setTab("lookup")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
              tab === "lookup"
                ? "bg-cut-burgundy text-cut-ivory shadow-sm"
                : "text-cut-black/55 hover:bg-cut-warm-paper/70 hover:text-cut-black"
            }`}
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2.25} />
            {ar ? "البحث بالكود" : "By code"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
              tab === "upcoming"
                ? "bg-cut-burgundy text-cut-ivory shadow-sm"
                : "text-cut-black/55 hover:bg-cut-warm-paper/70 hover:text-cut-black"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.25} />
            {ar ? "الحجوزات القادمة" : "Upcoming"}
          </button>
        </div>

        <div className="rounded-3xl border border-cut-burgundy/10 bg-cut-ivory/90 p-4 shadow-[0_16px_48px_rgba(74,0,15,0.08)] ring-1 ring-cut-burgundy/5 backdrop-blur-sm sm:p-5">
          {tab === "lookup" ? (
            <BookingLookupPanel initialCode={initialCode || undefined} surface="brand" />
          ) : (
            <CustomerUpcomingBookings variant="form" surface="brand" />
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-cut-burgundy/20 bg-cut-burgundy/[0.04] px-4 py-4 text-center">
          <p className="mb-3 text-sm text-cut-black/60">
            {ar ? "محتاج ميعاد جديد؟" : "Need a new appointment?"}
          </p>
          <Link
            href="/book"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cut-burgundy px-6 text-sm font-bold text-cut-ivory transition hover:bg-cut-burgundy-dark"
          >
            {ar ? "احجز الآن" : "Book now"}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100svh] items-center justify-center bg-cut-soft-ivory text-cut-black/55">
          جاري التحميل...
        </main>
      }
    >
      <BookingPageInner />
    </Suspense>
  );
}
