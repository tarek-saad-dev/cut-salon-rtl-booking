import type { Language } from "./types";

const localeTag = (lang: Language) => (lang === "ar" ? "ar-EG" : "en-EG");

function parseYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Full date e.g. الأربعاء، ٥ أغسطس ٢٠٢٦ / Wednesday, August 5, 2026 */
export function formatBookingDate(date: Date | string, lang: Language): string {
  const d = typeof date === "string" ? parseYmd(date) ?? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === "string" ? date : "";
  return new Intl.DateTimeFormat(localeTag(lang), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatBookingWeekday(date: Date | string, lang: Language): string {
  const d = typeof date === "string" ? parseYmd(date) ?? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag(lang), { weekday: "long" }).format(d);
}

export function formatBookingMonthDay(date: Date | string, lang: Language): string {
  const d = typeof date === "string" ? parseYmd(date) ?? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatBookingShortDate(date: Date | string, lang: Language): string {
  const d = typeof date === "string" ? parseYmd(date) ?? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag(lang), {
    month: "short",
    day: "numeric",
  }).format(d);
}

/** 10:30 PM / ١٠:٣٠ مساءً */
export function formatBookingTime(time: string, lang: Language): string {
  const [hStr, mStr = "00"] = time.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time;
  const date = new Date();
  date.setHours(h, parseInt(mStr, 10) || 0, 0, 0);
  if (lang === "en") {
    return new Intl.DateTimeFormat("en-EG", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
  const suffix =
    h >= 5 && h < 12 ? "صباحًا" : h >= 12 && h < 17 ? "مساءً" : h >= 17 && h < 21 ? "مساءً" : "ليلاً";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const num = new Intl.NumberFormat("ar-EG").format(h12);
  const min = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 }).format(parseInt(mStr, 10) || 0);
  return `${num}:${min} ${suffix}`;
}

export function formatBookingPrice(amount: number, lang: Language): string {
  if (lang === "en") {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  const n = new Intl.NumberFormat("ar-EG").format(amount);
  return `${n} جنيه`;
}

export function formatBookingDuration(minutes: number, lang: Language): string {
  const n = new Intl.NumberFormat(localeTag(lang)).format(minutes);
  return lang === "ar" ? `${n} دقيقة` : `${n} minutes`;
}

export function formatBookingNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(localeTag(lang)).format(value);
}

export function formatBookingMonthYear(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(localeTag(lang), {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function bookingWeekdayShortLabels(lang: Language): string[] {
  const base = new Date(2024, 0, 7); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return new Intl.DateTimeFormat(localeTag(lang), { weekday: "short" }).format(d);
  });
}
