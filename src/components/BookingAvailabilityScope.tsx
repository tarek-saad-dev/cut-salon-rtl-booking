"use client";

import { Check } from "lucide-react";
import type { BarberAvailabilityScope } from "@/lib/booking-api";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import { BookingNavFooter } from "./BookingNavFooter";

interface BookingAvailabilityScopeProps {
  barberName: string;
  value: BarberAvailabilityScope | null;
  onChange: (scope: BarberAvailabilityScope) => void;
  onContinue: () => void;
  onBack?: () => void;
  continueDisabled?: boolean;
}

export default function BookingAvailabilityScopeStep({
  barberName,
  value,
  onChange,
  onContinue,
  onBack,
  continueDisabled,
}: BookingAvailabilityScopeProps) {
  const { t, dir } = useBookingTranslations();

  const cards: {
    id: BarberAvailabilityScope;
    title: string;
    description: string;
  }[] = [
    {
      id: "all_branches",
      title: t("scope.allBranchesTitle", { name: barberName }),
      description: t("scope.allBranchesDesc"),
    },
    {
      id: "specific_branch",
      title: t("scope.specificBranchTitle", { name: barberName }),
      description: t("scope.specificBranchDesc"),
    },
  ];

  return (
    <div className="flex flex-col min-h-0 flex-1" dir={dir}>
      <div className="p-5 md:p-6 flex-1 overflow-y-auto">
        <div className="mb-5">
          <h3 className="text-lg font-heading font-bold text-cut-black mb-1">
            {t("scope.title")}
          </h3>
          <p className="text-cut-black/50 text-xs">{t("scope.subtitle")}</p>
        </div>
        <div className="space-y-3" role="listbox" aria-label={t("scope.title")}>
          {cards.map((card) => {
            const selected = value === card.id;
            return (
              <button
                key={card.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange(card.id)}
                className={`w-full rounded-2xl border bg-white p-5 text-start transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2 ${
                  selected
                    ? "border-cut-black shadow-md ring-2 ring-cut-black"
                    : "border-[var(--booking-border)] hover:border-cut-black/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-cut-black bg-cut-black text-white"
                        : "border-cut-black/25 bg-white"
                    }`}
                    aria-hidden
                  >
                    {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-base text-cut-black mb-1">
                      {card.title}
                    </h4>
                    <p className="text-cut-black/60 text-xs leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <BookingNavFooter
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={continueDisabled || !value}
      />
    </div>
  );
}
