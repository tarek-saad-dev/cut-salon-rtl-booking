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
}

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
}: BookingInfoPanelProps) => {
  const { t, format, dir } = useBookingTranslations();
  const displayName = mode === "nearest" ? t("header.nearestBarber") : barber.name;
  const duration = serviceDuration ?? 30;
  const branchAccent = getBranchAccent(branchCode, branchName);

  return (
    <div
      className="bg-[var(--booking-sidebar-bg)] text-[var(--booking-sidebar-text)] p-6 h-full flex flex-col"
      dir={dir}
    >
      <div className="flex items-start gap-4 mb-6">
        {mode === "nearest" ? (
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-[var(--booking-accent)]/40 bg-[var(--booking-accent)]/15 flex-shrink-0">
            <Zap className="w-7 h-7 text-[var(--booking-accent)]" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--booking-accent)]/40 flex-shrink-0">
            <BarberPhoto
              src={barber.image}
              name={barber.name}
              imgClassName="w-full h-full object-cover object-top"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-xl text-[var(--booking-sidebar-text)] mb-1">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 text-[var(--booking-sidebar-muted)] text-sm mb-1">
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
              <span className="text-[var(--booking-accent)] font-bold text-sm">{barber.rating}</span>
              {barber.reviewCount ? (
                <span className="text-[var(--booking-sidebar-muted)] text-[13px]">{barber.reviewCount}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="h-px bg-white/15 mb-5" />

      <div className="flex-1">
        <p className="text-[var(--booking-sidebar-muted)] text-[13px] font-bold uppercase tracking-widest mb-4">
          {t("infoPanel.detailsHeading")}
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${branchAccent.softBg}`}
            >
              <MapPin className={`w-4 h-4 ${branchAccent.icon}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("branch.label")}</p>
              {branchName ? (
                <p
                  className={`inline-flex items-center gap-1.5 font-medium text-sm px-2 py-0.5 rounded-md border ${branchAccent.chip} ${branchAccent.chipText}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${branchAccent.dot}`} aria-hidden />
                  {branchName}
                </p>
              ) : (
                <p className="font-medium text-sm text-[var(--booking-sidebar-muted)]">
                  {t("infoPanel.notSetYet")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-[var(--booking-accent)]" />
            </div>
            <div>
              <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("mode.methodLabel")}</p>
              <p className="font-medium text-sm text-[var(--booking-sidebar-text)]">
                {mode === "nearest" ? t("header.nearestBarber") : t("mode.chooseBarberShort")}
              </p>
            </div>
          </div>

          {service ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-4 h-4 text-[var(--booking-accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("infoPanel.service")}</p>
                <div className="font-medium text-sm text-[var(--booking-sidebar-text)]">{service}</div>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-[var(--booking-accent)]" />
            </div>
            <div>
              <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("infoPanel.date")}</p>
              <p className="font-medium text-sm text-[var(--booking-sidebar-text)]">
                {selectedDate ? format.date(selectedDate) : t("infoPanel.notSetYet")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[var(--booking-accent)]" />
            </div>
            <div>
              <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("infoPanel.time")}</p>
              <p className="font-medium text-sm text-[var(--booking-sidebar-text)]">
                {selectedTime ? format.time(selectedTime) : t("infoPanel.notSetYet")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[var(--booking-accent)]" />
            </div>
            <div>
              <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("infoPanel.duration")}</p>
              <p className="font-medium text-sm text-[var(--booking-sidebar-text)]">
                {format.duration(duration)}
              </p>
            </div>
          </div>

          {servicePrice != null && servicePrice > 0 ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-4 h-4 text-[var(--booking-accent)]" />
              </div>
              <div>
                <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("infoPanel.price")}</p>
                <p className="font-medium text-sm text-[var(--booking-sidebar-text)]">
                  {format.price(servicePrice)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[var(--booking-accent)]" />
            </div>
            <div>
              <p className="text-[var(--booking-sidebar-muted)] text-[13px] mb-0.5">{t("infoPanel.location")}</p>
              <p className="font-medium text-sm text-[var(--booking-sidebar-text)]">
                {barber.location || t("infoPanel.brandFooter")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/15 flex items-center gap-2">
        <img src="/cutsalon.png" alt="Cut Salon" className="w-5 h-5 rounded object-cover opacity-80" />
        <span className="text-[var(--booking-sidebar-muted)] text-[13px]">{t("infoPanel.brandFooter")}</span>
      </div>
    </div>
  );
};

export default BookingInfoPanel;
