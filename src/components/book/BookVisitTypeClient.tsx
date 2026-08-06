"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBookingController } from "@/context/BookingController";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";

export default function BookVisitTypeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();
  const { openBooking } = useBookingController();
  const Chevron = ar ? ChevronLeft : ChevronRight;
  const branchFromQuery = normalizeBranchCode(searchParams.get("branch") ?? "");

  useEffect(() => {
    if (isLoadingBranches) return;
    if (selectedBranch) return;
    if (branchFromQuery) {
      const match = branches.find(
        (b) => normalizeBranchCode(b.branchCode) === branchFromQuery,
      );
      if (match) {
        selectBranch(match);
        return;
      }
    }
    router.replace("/book");
  }, [isLoadingBranches, selectedBranch, branchFromQuery, branches, selectBranch, router]);

  const startBooking = (kind: "individual" | "group") => {
    const branch = selectedBranch;
    if (!branch) {
      router.replace("/book");
      return;
    }
    openBooking({
      barber: {
        name: ar ? "أقرب حلاق متاح" : "Nearest available barber",
        image: null,
        role: ar ? "أول ميعاد مناسب" : "First suitable appointment",
        location: `CUT Salon · ${branch.shortName || branch.branchName}`,
      },
      entryMode: "branch_first",
      initialMode: "nearest",
      explicitEntryBranchCode: branch.branchCode,
      bookingNote:
        kind === "group"
          ? ar
            ? "حجز جماعي — يُرجى إضافة عدد الحضور في الملاحظات إن لزم"
            : "Group appointment — add party size in notes if needed"
          : undefined,
    });
  };

  const options = [
    {
      id: "individual" as const,
      title: ar ? "ميعاد فردي" : "Individual Appointment",
      subtitle: ar ? "احجز خدمات لنفسك." : "Schedule services for yourself.",
    },
    {
      id: "group" as const,
      title: ar ? "ميعاد جماعي" : "Group Appointments",
      subtitle: ar
        ? "احجز لنفسك ولأصدقائك أو عائلتك."
        : "Schedule services for yourself, friends and family.",
    },
  ];

  return (
    <BookFlowChrome
      backHref="/book"
      backLabel={ar ? "رجوع لاختيار الفرع" : "Back to locations"}
    >
      {/* Returning clients — CUT soft accent (not Boulevard blue) */}
      <div className="flex flex-col gap-3 border-b border-cut-bronze/25 bg-[linear-gradient(90deg,#f4ebdd,#efe4d2)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm leading-6 text-cut-burgundy">
          {ar
            ? "عملاء سابقون: سجّل دخولك لتجربة حجز مخصصة."
            : "Returning Clients: log in to your personalized booking experience."}
        </p>
        <Link
          href="/client"
          className="inline-flex min-h-10 shrink-0 items-center justify-center bg-cut-black px-5 text-sm font-bold text-cut-ivory transition hover:bg-cut-wine-black"
        >
          {ar ? "تسجيل الدخول" : "Log In"}
        </Link>
      </div>

      <section className="bg-cut-soft-ivory">
        <div className="border-b border-cut-black/10 px-5 py-5 sm:px-8">
          <h1 className="text-[13px] font-black uppercase tracking-[0.18em] text-cut-black">
            {ar ? "اختر خيارًا" : "Select an option"}
          </h1>
          {selectedBranch ? (
            <p className="mt-2 text-sm text-cut-black/55">
              {ar ? "الفرع:" : "Location:"}{" "}
              <span className="font-semibold text-cut-black">
                {selectedBranch.shortName || selectedBranch.branchName}
              </span>
            </p>
          ) : null}
        </div>

        <ul className="divide-y divide-cut-black/10">
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => startBooking(option.id)}
                className="flex w-full items-center gap-4 px-5 py-5 text-start transition hover:bg-cut-warm-paper/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-burgundy sm:px-8"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-cut-black">{option.title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-cut-black/55">{option.subtitle}</p>
                </div>
                <Chevron className="h-5 w-5 shrink-0 text-cut-black/35" strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </BookFlowChrome>
  );
}
