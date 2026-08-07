"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import type { PublicBranch } from "@/lib/booking-api";

function branchTitle(branch: PublicBranch) {
  return (branch.shortName || branch.branchName || branch.branchCode).trim();
}

function addressLines(address: string | null): string[] {
  if (!address?.trim()) return [];
  const parts = address
    .split(/[,\n|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(", ")];
  return [address.trim()];
}

export default function BookBranchesClient() {
  const router = useRouter();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, isLoadingBranches, branchesError, selectBranch, refetchBranches } = useBranch();
  const Chevron = ar ? ChevronLeft : ChevronRight;

  const onSelect = (branch: PublicBranch) => {
    selectBranch(branch);
    router.push(
      `/book/services?branch=${encodeURIComponent(branch.branchCode)}&visit=individual`,
    );
  };

  return (
    <BookFlowChrome>
      <section className="relative bg-cut-soft-ivory">
        <BookDelayedWaitingOverlay
          busy={isLoadingBranches}
          delayMs={800}
          lang={lang}
          label={ar ? "جاري تحميل الفروع…" : "Loading locations…"}
        />
        <div className="border-b border-cut-black/10 px-5 py-5 sm:px-8">
          <h1 className="text-[13px] font-black uppercase tracking-[0.18em] text-cut-black">
            {ar ? "اختر فرع الخدمة" : "Select service location"}
          </h1>
        </div>

        {isLoadingBranches && (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-cut-black/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ar ? "جاري تحميل الفروع…" : "Loading locations…"}
          </div>
        )}

        {!isLoadingBranches && branchesError && (
          <div className="px-5 py-12 text-center sm:px-8">
            <p className="text-sm text-cut-black/65">
              {ar ? "تعذر تحميل الفروع. حاول مرة أخرى." : "Couldn't load locations. Please try again."}
            </p>
            <button
              type="button"
              onClick={refetchBranches}
              className="mt-4 inline-flex min-h-11 items-center bg-cut-black px-5 text-sm font-bold text-cut-ivory"
            >
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        )}

        {!isLoadingBranches && !branchesError && branches.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-cut-black/55 sm:px-8">
            {ar ? "لا توجد فروع متاحة حاليًا." : "No locations available right now."}
          </p>
        )}

        {!isLoadingBranches && !branchesError && branches.length > 0 && (
          <ul className="divide-y divide-cut-black/10">
            {branches.map((branch) => {
              const lines = addressLines(branch.address);
              return (
                <li key={branch.branchCode}>
                  <button
                    type="button"
                    onClick={() => onSelect(branch)}
                    className="flex w-full items-center gap-4 px-5 py-5 text-start transition hover:bg-cut-warm-paper/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-burgundy sm:px-8"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-cut-bronze/30 bg-cut-ivory">
                      <span className="font-brand text-[11px] font-black tracking-[0.14em] text-cut-black">
                        CUT
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-cut-black">
                        {branchTitle(branch)}
                      </p>
                      {lines.length > 0 ? (
                        <div className="mt-1 space-y-0.5 text-[13px] leading-5 text-cut-black/55">
                          {lines.map((line) => (
                            <p key={line} className="truncate">
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-[13px] text-cut-black/45">
                          {ar ? "الإسكندرية، مصر" : "Alexandria, Egypt"}
                        </p>
                      )}
                    </div>
                    <Chevron
                      className="h-5 w-5 shrink-0 text-cut-black/35"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </BookFlowChrome>
  );
}
