"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";

export default function BookVisitTypeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();
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

  const goToServices = (kind: "individual" | "group") => {
    const branch = selectedBranch;
    if (!branch) {
      router.replace("/book");
      return;
    }
    const code = encodeURIComponent(branch.branchCode);
    router.push(`/book/services?branch=${code}&visit=${kind}`);
  };

  const options = [
    {
      id: "individual" as const,
      title: ar ? "ميعاد فردي" : "Individual Appointment",
      subtitle: ar ? "احجز خدمات لنفسك." : "Schedule services for yourself.",
      disabled: false,
      soonLabel: null as string | null,
    },
    {
      id: "group" as const,
      title: ar ? "ميعاد جماعي" : "Group Appointments",
      subtitle: ar
        ? "احجز لنفسك ولأصدقائك أو عائلتك."
        : "Schedule services for yourself, friends and family.",
      disabled: true,
      soonLabel: ar ? "سيتم تفعيله قريبًا" : "Coming soon",
    },
  ];

  return (
    <BookFlowChrome
      backHref="/book"
      backLabel={ar ? "رجوع لاختيار الفرع" : "Back to locations"}
    >
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
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  goToServices(option.id);
                }}
                aria-disabled={option.disabled}
                className={`flex w-full items-center gap-4 px-5 py-5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-burgundy sm:px-8 ${
                  option.disabled
                    ? "cursor-not-allowed opacity-55"
                    : "hover:bg-cut-warm-paper/70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p
                      className={`text-[15px] font-bold ${
                        option.disabled ? "text-cut-black/45" : "text-cut-black"
                      }`}
                    >
                      {option.title}
                    </p>
                    {option.soonLabel ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cut-burgundy/80">
                        <span
                          aria-hidden
                          className="h-px w-3 bg-cut-burgundy/45"
                        />
                        {option.soonLabel}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={`mt-1 text-[13px] leading-5 ${
                      option.disabled ? "text-cut-black/35" : "text-cut-black/55"
                    }`}
                  >
                    {option.subtitle}
                  </p>
                </div>
                {!option.disabled ? (
                  <Chevron
                    className="h-5 w-5 shrink-0 text-cut-black/35"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                ) : (
                  <span
                    aria-hidden
                    className="h-px w-6 shrink-0 bg-gradient-to-l from-transparent via-cut-black/25 to-transparent"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </BookFlowChrome>
  );
}
