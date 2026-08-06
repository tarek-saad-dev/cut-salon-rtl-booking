import type { LocalizedText } from "./types";

export const navigationLabels = {
  home: { ar: "الرئيسية", en: "Home" },
  services: { ar: "الخدمات", en: "Services" },
  prices: { ar: "الأسعار", en: "Prices" },
  barbers: { ar: "الحلاقين", en: "Barbers" },
  branches: { ar: "الفروع", en: "Branches" },
  account: { ar: "حسابي", en: "My Account" },
  loyalty: { ar: "CUT CLUB", en: "CUT CLUB" },
  loyaltyCta: { ar: "CUT CLUB — انضم دلوقتي", en: "CUT CLUB — Join Now" },
  booking: { ar: "احجز الآن", en: "Book Now" },
  bookMenu: { ar: "احجز", en: "Book" },
  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  closeMenu: { ar: "إغلاق القائمة", en: "Close menu" },
  language: { ar: "English", en: "العربية" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
} satisfies Record<string, LocalizedText>;
