import type { Language } from "@/lib/i18n/types";

/**
 * Display name for a public barber by UI locale.
 * EN → nameEn || nameAr || name
 * AR → nameAr || name || nameEn
 */
export function resolveBarberDisplayName(
  barber: {
    name?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
  } | null | undefined,
  locale: Language | "ar" | "en" = "ar",
): string {
  if (!barber) return "";
  const nameAr = barber.nameAr?.trim() || "";
  const nameEn = barber.nameEn?.trim() || "";
  const name = barber.name?.trim() || "";
  if (locale === "en") {
    return nameEn || nameAr || name;
  }
  return nameAr || name || nameEn;
}
