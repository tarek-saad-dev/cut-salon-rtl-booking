"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookingLookupPanel from "@/components/booking-management/BookingLookupPanel";
import CustomerUpcomingBookings from "@/components/CustomerUpcomingBookings";
import { normalizeBookingCode } from "@/lib/booking-management/display";

function BookingPageInner() {
  const searchParams = useSearchParams();
  const rawCode = searchParams.get("code") ?? "";
  const initialCode = rawCode ? normalizeBookingCode(rawCode) : "";
  // Never read token from URL — only bookingCode is allowed in query.
  const [tab, setTab] = useState<"lookup" | "upcoming">(
    initialCode ? "lookup" : "lookup",
  );

  return (
    <main className="min-h-screen bg-cut-black text-cut-ivory" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mb-6">
          <Link
            href="/"
            className="text-cut-ivory/40 text-xs hover:text-cut-gold transition-colors"
          >
            العودة للرئيسية
          </Link>
          <h1 className="text-2xl font-heading font-bold text-cut-gold mt-3 mb-1">
            حجوزاتي
          </h1>
          <p className="text-cut-ivory/50 text-sm">
            ابحث بكود الحجز أو اعرض الحجوزات القادمة برقم الهاتف
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            type="button"
            onClick={() => setTab("lookup")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              tab === "lookup"
                ? "bg-cut-gold text-black"
                : "text-cut-ivory/60 hover:text-cut-ivory"
            }`}
          >
            البحث بالكود
          </button>
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              tab === "upcoming"
                ? "bg-cut-gold text-black"
                : "text-cut-ivory/60 hover:text-cut-ivory"
            }`}
          >
            الحجوزات القادمة
          </button>
        </div>

        {tab === "lookup" ? (
          <BookingLookupPanel initialCode={initialCode || undefined} />
        ) : (
          <div className="-mx-6">
            <CustomerUpcomingBookings variant="form" />
          </div>
        )}
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cut-black text-cut-ivory flex items-center justify-center" dir="rtl">
          جاري التحميل...
        </main>
      }
    >
      <BookingPageInner />
    </Suspense>
  );
}
