import type { LocalizedText } from "./types";

export const navigationLabels = {
  home: { ar: "الرئيسية", en: "Home" },
  services: { ar: "الخدمات", en: "Services" },
  prices: { ar: "الأسعار", en: "Prices" },
  barbers: { ar: "الحلاقين", en: "Barbers" },
  branches: { ar: "الفروع", en: "Branches" },
  account: { ar: "حسابي", en: "My Account" },
  loyalty: { ar: "CUT CLUB", en: "CUT CLUB" },
  booking: { ar: "احجز الآن", en: "Book Now" },
  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  closeMenu: { ar: "إغلاق القائمة", en: "Close menu" },
} satisfies Record<string, LocalizedText>;
