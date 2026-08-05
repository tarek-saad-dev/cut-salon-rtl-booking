"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  translateBooking,
  type BookingI18nKey,
  type BookingTParams,
} from "@/lib/i18n/booking";
import type { Language } from "@/lib/i18n/types";
import {
  formatBookingDate,
  formatBookingDuration,
  formatBookingMonthDay,
  formatBookingMonthYear,
  formatBookingNumber,
  formatBookingPrice,
  formatBookingShortDate,
  formatBookingTime,
  formatBookingWeekday,
  bookingWeekdayShortLabels,
} from "@/lib/i18n/booking-format";

export function useBookingTranslations() {
  const { lang, dir, isArabic } = useLanguage();

  const t = useCallback(
    (key: BookingI18nKey | string, params?: BookingTParams) =>
      translateBooking(lang, key, params),
    [lang],
  );

  const format = useMemo(
    () => ({
      date: (d: Date | string) => formatBookingDate(d, lang),
      weekday: (d: Date | string) => formatBookingWeekday(d, lang),
      monthDay: (d: Date | string) => formatBookingMonthDay(d, lang),
      shortDate: (d: Date | string) => formatBookingShortDate(d, lang),
      monthYear: (d: Date) => formatBookingMonthYear(d, lang),
      time: (time: string) => formatBookingTime(time, lang),
      price: (n: number) => formatBookingPrice(n, lang),
      duration: (n: number) => formatBookingDuration(n, lang),
      number: (n: number) => formatBookingNumber(n, lang),
      weekdayShort: () => bookingWeekdayShortLabels(lang),
    }),
    [lang],
  );

  return {
    lang: lang as Language,
    dir: dir as "rtl" | "ltr",
    isArabic,
    t,
    format,
  };
}
