"use client";

import type { ReactNode } from "react";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import { BookingNavFooter } from "./BookingNavFooter";

export type ReviewRowId =
  | "branch"
  | "barber"
  | "service"
  | "appointment"
  | "customer";

interface ReviewRowProps {
  id: ReviewRowId;
  label: string;
  onEdit?: () => void;
  children: ReactNode;
}

function ReviewRow({ id, label, onEdit, children }: ReviewRowProps) {
  const { t } = useBookingTranslations();
  return (
    <div className="py-3.5" data-review-row={id}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-[13px] font-medium text-[var(--booking-text-secondary)]">{label}</p>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-[13px] font-bold text-[var(--booking-text)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] rounded"
          >
            {t("actions.edit")}
          </button>
        ) : null}
      </div>
      <div className="text-[var(--booking-text)] font-medium text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export interface BookingReviewStepProps {
  branchName: string;
  branchBadge?: ReactNode;
  barberName: string;
  serviceLines: Array<{ name: string; durationLabel?: string }>;
  appointmentDateLabel: string;
  appointmentTimeLabel: string;
  customerName: string;
  customerPhone: string;
  totalDurationLabel: string;
  totalPriceLabel: ReactNode;
  mutationBanner?: ReactNode;
  onEditBranch?: () => void;
  onEditBarber?: () => void;
  onEditService?: () => void;
  onEditAppointment?: () => void;
  onEditCustomer?: () => void;
  onBack?: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}

export default function BookingReviewStep({
  branchName,
  branchBadge,
  barberName,
  serviceLines,
  appointmentDateLabel,
  appointmentTimeLabel,
  customerName,
  customerPhone,
  totalDurationLabel,
  totalPriceLabel,
  mutationBanner,
  onEditBranch,
  onEditBarber,
  onEditService,
  onEditAppointment,
  onEditCustomer,
  onBack,
  onConfirm,
  confirmDisabled,
  confirmLoading,
}: BookingReviewStepProps) {
  const { t, dir } = useBookingTranslations();

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-[var(--booking-bg)]" dir={dir} data-booking-surface="review">
      <div className="p-5 md:p-6 flex-1">
        <h3 className="text-xl font-heading font-bold text-[var(--booking-text)] mb-1">
          {t("review.title")}
        </h3>
        <p className="text-[var(--booking-text-secondary)] text-xs mb-4">{t("review.subtitle")}</p>
        {mutationBanner}

        <div className="rounded-2xl border border-[var(--booking-border)] bg-[var(--booking-bg)] px-4 md:px-5 divide-y divide-[var(--booking-border-subtle)]">
          <ReviewRow id="branch" label={t("branch.label")} onEdit={onEditBranch}>
            {branchBadge ?? branchName}
          </ReviewRow>

          <ReviewRow id="barber" label={t("review.barber")} onEdit={onEditBarber}>
            {barberName}
          </ReviewRow>

          <ReviewRow id="service" label={t("review.service")} onEdit={onEditService}>
            <ul className="space-y-1">
              {serviceLines.map((line) => (
                <li key={line.name}>
                  <span className="font-semibold text-[var(--booking-text)]">{line.name}</span>
                  {line.durationLabel ? (
                    <span className="block text-[13px] font-normal text-[var(--booking-text-secondary)]">
                      {line.durationLabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </ReviewRow>

          <ReviewRow id="appointment" label={t("review.appointment")} onEdit={onEditAppointment}>
            <p className="font-semibold">{appointmentDateLabel}</p>
            <p className="text-[15px] tabular-nums mt-0.5">{appointmentTimeLabel}</p>
          </ReviewRow>

          <ReviewRow id="customer" label={t("review.customerDetails")} onEdit={onEditCustomer}>
            <p>{customerName}</p>
            <p className="tabular-nums mt-0.5" dir="ltr">
              {customerPhone}
            </p>
          </ReviewRow>

          <div className="py-3.5 space-y-2">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--booking-text-secondary)]">{t("review.durationFinal")}</span>
              <span className="font-semibold text-[var(--booking-text)]">{totalDurationLabel}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--booking-text-secondary)]">{t("review.totalFinal")}</span>
              <span className="font-bold text-[var(--booking-text)]">{totalPriceLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <BookingNavFooter
        onBack={onBack}
        backLabel={t("actions.editSelections")}
        onContinue={onConfirm}
        continueLabel={t("actions.confirmBooking")}
        continueDisabled={confirmDisabled}
        continueLoading={confirmLoading}
      />
    </div>
  );
}
