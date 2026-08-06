"use client";

import type { ReactNode } from "react";
import { Clock, Scissors, MapPin, Star, CalendarDays, Banknote, Zap } from "lucide-react";
import BarberPhoto from "./BarberPhoto";
import { getBranchAccent } from "@/lib/branchTheme";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

interface BarberInfo {
  name: string;
  image: string | null;
  role?: string;
  specialty?: string;
  experience?: string;
  rating?: number;
  reviewCount?: string;
  location?: string;
}

interface BookingInfoPanelProps {
  barber: BarberInfo;
  selectedDate?: Date;
  selectedTime?: string;
  /** Plain string or bilingual React node. */
  service?: ReactNode;
  servicePrice?: number;
  serviceDuration?: number;
  mode?: "specific" | "nearest";
  branchName?: string;
  branchCode?: string;
  /**
   * identity — barber only (review/success; main card owns details)
   * compact — live summary during booking steps
   * full — default desktop sidebar
   */
  density?: "full" | "compact" | "identity";
}

const IconShell = ({ children }: { children: ReactNode }) => (
  <div className="w-8 h-8 rounded-lg border border-[var(--booking-border-subtle)] bg-[var(--booking-surface)] flex items-center justify-center flex-shrink-0">
    {children}
  </div>
);

const BookingInfoPanel = ({
  barber,
  selectedDate,
  selectedTime,
  service,
  servicePrice,
  serviceDuration,
  mode = "specific",
  branchName,
  branchCode,
  density = "full",
}: BookingInfoPanelProps) => {
  const { t, format, dir } = useBookingTranslations();
  const displayName = mode === "nearest" ? t("header.nearestBarber") : barber.name;
  const duration = serviceDuration ?? 30;
  const branchAccent = getBranchAccent(branchCode, branchName);
  const identityOnly = density === "identity";

  return (
    <div
      className="bg-[var(--booking-sidebar-bg)] text-[var(--booking-sidebar-text)] p-5 md:p-6 h-full flex flex-col"
      dir={dir}
      data-booking-surface="sidebar"
      data-density={density}
    >
      <div className="flex items-start gap-4 mb-5">
        {mode === "nearest" ? (
          <div className="w-14 h-14 rounded-full flex items-center justify-center border border-[var(--booking-border)] bg-[var(--booking-accent-soft)] flex-shrink-0">
            <Zap className="w-6 h-6 text-[var(--booking-accent)]" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full overflow-hidden border border-[var(--booking-border)] flex-shrink-0">
            <BarberPhoto
              src={barber.image}
              name={barber.name}
              imgClassName="w-full h-full object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg text-[var(--booking-text)] mb-1">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 text-[var(--booking-text-secondary)] text-sm mb-1">
            {mode === "nearest" ? (
              <>
                <Zap className="w-3.5 h-3.5 text-[var(--booking-accent)]" />
                <span>{t("header.nearestBarber")}</span>
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5 text-[var(--booking-accent)]" />
                <span>{barber.specialty || barber.role || t("header.professionalBarber")}</span>
              </>
            )}
          </div>
          {mode !== "nearest" && barber.rating ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[var(--booking-accent)] text-[var(--booking-accent)]" />
              <span className="text-[var(--booking-text)] font-bold text-sm">{barber.rating}</span>
              {barber.reviewCount ? (
                <span className="text-[var(--booking-text-muted)] text-[13px]">
                  {barber.reviewCount}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {identityOnly ? (
        <div className="mt-auto pt-4 border-t border-[var(--booking-border-subtle)] flex items-center gap-2">
          <img
            src="/cutsalon.png"
            alt="Cut Salon"
            className="w-5 h-5 rounded object-cover opacity-80"
          />
          <span className="text-[var(--booking-text-muted)] text-[13px]">
            {t("infoPanel.brandFooter")}
          </span>
        </div>
      ) : (
        <>
          <div className="h-px bg-[var(--booking-border-subtle)] mb-4" />

          <div className="flex-1 min-h-0">
            <p className="text-[var(--booking-text-muted)] text-[12px] font-bold uppercase tracking-widest mb-3">
              {t("infoPanel.detailsHeading")}
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-[var(--booking-border-subtle)] ${branchAccent.softBg}`}
                >
                  <MapPin className={`w-4 h-4 ${branchAccent.icon}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                    {t("branch.label")}
                  </p>
                  {branchName ? (
                    <p
                      className={`inline-flex items-center gap-1.5 font-medium text-sm px-2 py-0.5 rounded-md border ${branchAccent.chip} ${branchAccent.chipText}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${branchAccent.dot}`} aria-hidden />
                      {branchName}
                    </p>
                  ) : (
                    <p className="font-medium text-sm text-[var(--booking-text-muted)]">
                      {t("infoPanel.notSetYet")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconShell>
                  <Zap className="w-4 h-4 text-[var(--booking-accent)]" />
                </IconShell>
                <div>
                  <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                    {t("mode.methodLabel")}
                  </p>
                  <p className="font-medium text-sm text-[var(--booking-text)]">
                    {mode === "nearest"
                      ? t("header.nearestBarber")
                      : t("mode.chooseBarberShort")}
                  </p>
                </div>
              </div>

              {service ? (
                <div className="flex items-start gap-3">
                  <IconShell>
                    <Scissors className="w-4 h-4 text-[var(--booking-accent)]" />
                  </IconShell>
                  <div className="min-w-0">
                    <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                      {t("infoPanel.service")}
                    </p>
                    <div className="font-medium text-sm text-[var(--booking-text)]">{service}</div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <IconShell>
                  <CalendarDays className="w-4 h-4 text-[var(--booking-accent)]" />
                </IconShell>
                <div>
                  <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                    {t("infoPanel.date")}
                  </p>
                  <p className="font-medium text-sm text-[var(--booking-text)]">
                    {selectedDate ? format.date(selectedDate) : t("infoPanel.notSetYet")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconShell>
                  <Clock className="w-4 h-4 text-[var(--booking-accent)]" />
                </IconShell>
                <div>
                  <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                    {t("infoPanel.time")}
                  </p>
                  <p className="font-medium text-sm text-[var(--booking-text)]">
                    {selectedTime ? format.time(selectedTime) : t("infoPanel.notSetYet")}
                  </p>
                </div>
              </div>

              {density === "full" ? (
                <>
                  <div className="flex items-start gap-3">
                    <IconShell>
                      <Clock className="w-4 h-4 text-[var(--booking-accent)]" />
                    </IconShell>
                    <div>
                      <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                        {t("infoPanel.duration")}
                      </p>
                      <p className="font-medium text-sm text-[var(--booking-text)]">
                        {format.duration(duration)}
                      </p>
                    </div>
                  </div>

                  {servicePrice != null && servicePrice > 0 ? (
                    <div className="flex items-start gap-3">
                      <IconShell>
                        <Banknote className="w-4 h-4 text-[var(--booking-accent)]" />
                      </IconShell>
                      <div>
                        <p className="text-[var(--booking-text-secondary)] text-[13px] mb-0.5">
                          {t("infoPanel.price")}
                        </p>
                        <p className="font-medium text-sm text-[var(--booking-text)]">
                          {format.price(servicePrice)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-[var(--booking-border-subtle)] flex items-center gap-2">
            <img
              src="/cutsalon.png"
              alt="Cut Salon"
              className="w-5 h-5 rounded object-cover opacity-80"
            />
            <span className="text-[var(--booking-text-muted)] text-[13px]">
              {t("infoPanel.brandFooter")}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingInfoPanel;
