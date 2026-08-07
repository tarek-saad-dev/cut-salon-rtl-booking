export type BookPhoneCountry = {
  iso: string;
  dial: string;
  flag: string;
  nameAr: string;
  nameEn: string;
  placeholder: string;
  /** Max national digits (without country code). */
  maxNational: number;
};

/** Common CUT client markets — Egypt first as default. */
export const BOOK_PHONE_COUNTRIES: BookPhoneCountry[] = [
  { iso: "EG", dial: "20", flag: "🇪🇬", nameAr: "مصر", nameEn: "Egypt", placeholder: "1xxxxxxxxx", maxNational: 10 },
  { iso: "SA", dial: "966", flag: "🇸🇦", nameAr: "السعودية", nameEn: "Saudi Arabia", placeholder: "5xxxxxxxx", maxNational: 9 },
  { iso: "AE", dial: "971", flag: "🇦🇪", nameAr: "الإمارات", nameEn: "UAE", placeholder: "5xxxxxxxx", maxNational: 9 },
  { iso: "LY", dial: "218", flag: "🇱🇾", nameAr: "ليبيا", nameEn: "Libya", placeholder: "9xxxxxxxx", maxNational: 9 },
  { iso: "KW", dial: "965", flag: "🇰🇼", nameAr: "الكويت", nameEn: "Kuwait", placeholder: "9xxxxxxx", maxNational: 8 },
  { iso: "QA", dial: "974", flag: "🇶🇦", nameAr: "قطر", nameEn: "Qatar", placeholder: "3xxxxxxx", maxNational: 8 },
  { iso: "BH", dial: "973", flag: "🇧🇭", nameAr: "البحرين", nameEn: "Bahrain", placeholder: "3xxxxxxx", maxNational: 8 },
  { iso: "OM", dial: "968", flag: "🇴🇲", nameAr: "عُمان", nameEn: "Oman", placeholder: "9xxxxxxx", maxNational: 8 },
  { iso: "JO", dial: "962", flag: "🇯🇴", nameAr: "الأردن", nameEn: "Jordan", placeholder: "7xxxxxxxx", maxNational: 9 },
  { iso: "DE", dial: "49", flag: "🇩🇪", nameAr: "ألمانيا", nameEn: "Germany", placeholder: "15xxxxxxxx", maxNational: 11 },
  { iso: "US", dial: "1", flag: "🇺🇸", nameAr: "أمريكا", nameEn: "United States", placeholder: "2015550123", maxNational: 10 },
  { iso: "CA", dial: "1", flag: "🇨🇦", nameAr: "كندا", nameEn: "Canada", placeholder: "4165550123", maxNational: 10 },
  { iso: "GB", dial: "44", flag: "🇬🇧", nameAr: "بريطانيا", nameEn: "United Kingdom", placeholder: "7xxxxxxxxx", maxNational: 10 },
  { iso: "FR", dial: "33", flag: "🇫🇷", nameAr: "فرنسا", nameEn: "France", placeholder: "6xxxxxxxx", maxNational: 9 },
  { iso: "IT", dial: "39", flag: "🇮🇹", nameAr: "إيطاليا", nameEn: "Italy", placeholder: "3xxxxxxxxx", maxNational: 10 },
  { iso: "TR", dial: "90", flag: "🇹🇷", nameAr: "تركيا", nameEn: "Turkey", placeholder: "5xxxxxxxxx", maxNational: 10 },
];

export function findPhoneCountry(iso: string): BookPhoneCountry {
  return BOOK_PHONE_COUNTRIES.find((c) => c.iso === iso) ?? BOOK_PHONE_COUNTRIES[0];
}

/** Infer country from a stored full digit string when possible. */
export function detectPhoneCountry(storedDigits: string): BookPhoneCountry {
  const d = storedDigits.replace(/\D/g, "");
  if (!d) return BOOK_PHONE_COUNTRIES[0];
  // Prefer longer dial codes first to avoid +1 swallowing others incorrectly — sort by dial length desc
  const sorted = [...BOOK_PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (d.startsWith(c.dial) && d.length > c.dial.length) return c;
  }
  // Legacy Egyptian local 01xxxxxxxxx
  if (d.startsWith("01") && d.length >= 11) return findPhoneCountry("EG");
  return BOOK_PHONE_COUNTRIES[0];
}

export function nationalFromStored(storedDigits: string, country: BookPhoneCountry): string {
  const d = storedDigits.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith(country.dial)) return d.slice(country.dial.length);
  // EG legacy local with leading 0
  if (country.iso === "EG" && d.startsWith("0")) return d.slice(1);
  return d;
}

/** Build E.164 digits without + for API / storage. */
export function toInternationalDigits(country: BookPhoneCountry, national: string): string {
  let n = national.replace(/\D/g, "");
  // Drop a single leading 0 if user typed trunk prefix
  if (n.startsWith("0")) n = n.slice(1);
  if (!n) return "";
  return `${country.dial}${n}`;
}

export function isInternationalPhoneReady(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 15;
}
