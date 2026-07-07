"use client";

import { useState, useMemo } from "react";
import { Scissors, Clock, Banknote, Check, Sparkles, Droplets, Plus, Paintbrush, HandHelping, type LucideIcon } from "lucide-react";
import type { BookingService } from "@/lib/publicBookingApi";

interface BookingServiceSelectProps {
  services: BookingService[];
  selectedIds: number[];
  onSelect: (id: number) => void;
  onToggleAddon?: (id: number) => void;
  isLoading?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESENTATION MAP — every known service gets Arabic title + description
   ═══════════════════════════════════════════════════════════════════════════ */

interface ServicePres {
  arabicTitle: string;
  description: string;
  salesText?: string;
  icon: LucideIcon;
  badge?: string;
}

const PRES: Record<string, ServicePres> = {
  // ── Main primary ──
  "Hair Cut": { arabicTitle: "Hair Cut", description: "تدريج وقص الشعر من الأعلى بشكل مرتب ومناسب لستايلك.", salesText: "مناسبة لمعظم العملاء اللي عاوزين نتيجة مرتبة وواضحة.", icon: Scissors, badge: "الأكثر طلبًا" },
  "Detailed Cut": { arabicTitle: "Hair Cut", description: "تدريج وقص الشعر من الأعلى بشكل مرتب ومناسب لستايلك.", salesText: "مناسبة لمعظم العملاء اللي عاوزين نتيجة مرتبة وواضحة.", icon: Scissors, badge: "الأكثر طلبًا" },
  "Beard Styling & Fade": { arabicTitle: "Beard Styling & Fade", description: "تظبيط وتدريج الدقن وتحديدها بشكل احترافي.", salesText: "اختيار مناسب لو محتاج تظبيط الدقن فقط بدون حلاقة شعر.", icon: Scissors },
  "Beard": { arabicTitle: "Beard Styling & Fade", description: "تظبيط وتدريج الدقن وتحديدها بشكل احترافي.", salesText: "اختيار مناسب لو محتاج تظبيط الدقن فقط بدون حلاقة شعر.", icon: Scissors },
  "Haircut & Beard": { arabicTitle: "Haircut & Beard", description: "باكدج كامل للشعر والدقن في زيارة واحدة لستايل متناسق.", salesText: "أفضل اختيار لو عاوز لوك كامل ومتناسق.", icon: Scissors, badge: "باكدج مميز" },
  "Hair & Beard": { arabicTitle: "Haircut & Beard", description: "باكدج كامل للشعر والدقن في زيارة واحدة لستايل متناسق.", salesText: "أفضل اختيار لو عاوز لوك كامل ومتناسق.", icon: Scissors, badge: "باكدج مميز" },
  // ── Main secondary ──
  "Advanced Cut": { arabicTitle: "Advanced Cut", description: "للشعر الطويل أو القصات التي تحتاج وقت وتفاصيل أكثر.", icon: Sparkles },
  "Fade Cut": { arabicTitle: "Fade Cut", description: "لتدريج الجوانب فقط مثل Taper Fade أو Fade بسيط.", icon: Scissors },
  "Basic Cut": { arabicTitle: "Basic Cut", description: "للقصات البسيطة والسريعة.", icon: Scissors },
  // ── عناية البشرة ──
  "Basic Skin Care": { arabicTitle: "تنظيف بشرة Basic", description: "تنظيف خفيف للبشرة مناسب كإضافة سريعة.", icon: Droplets },
  "Deep SkinCare": { arabicTitle: "تنظيف بشرة Deep", description: "عناية أعمق للبشرة لمن يريد نتيجة أوضح.", icon: Droplets, badge: "ينصح بها" },
  "Medical Skin Care": { arabicTitle: "عناية متقدمة بالبشرة", description: "جلسة عناية متقدمة للبشرة.", icon: Droplets },
  // ── ماسكات ──
  "Face Mask": { arabicTitle: "ماسك للبشرة", description: "ماسك سريع يمنح البشرة انتعاش ولمسة نهائية أفضل.", icon: Droplets, badge: "تكمل الخدمة" },
  "Gold Mask": { arabicTitle: "ماسك ذهبي", description: "اختيار مميز لمن يريد تجربة أفخم وعناية إضافية.", icon: Sparkles, badge: "تجربة مميزة" },
  "Coffee Mask": { arabicTitle: "ماسك قهوة", description: "ينعش البشرة ويساعد على مظهر أكثر حيوية.", icon: Droplets, badge: "ينصح بها" },
  "peel-off Mask": { arabicTitle: "Peel-off Mask", description: "ماسك يساعد على تنظيف البشرة وإحساس أنضف بعد الخدمة.", icon: Droplets },
  "Hair Mask": { arabicTitle: "ماسك شعر", description: "عناية ملطفة للشعر بعد الحلاقة.", icon: Droplets },
  // ── شعر ──
  "Basic Hair Color": { arabicTitle: "صبغة شعر بسيطة", description: "تغيير لون بسيط للشعر.", icon: Paintbrush },
  "Dry-Hair": { arabicTitle: "تجفيف شعر", description: "تجفيف وترتيب الشعر.", icon: Scissors },
  "Hair & Beard Color": { arabicTitle: "صبغة شعر ودقن", description: "صبغة متكاملة للشعر والدقن.", icon: Paintbrush },
  "Hair Botox": { arabicTitle: "بوتكس شعر", description: "عناية قوية للشعر لمن يريد مظهر أنعم وأكثر ترتيبًا.", icon: Sparkles, badge: "عناية قوية" },
  "Hair Design": { arabicTitle: "تصميم على الشعر", description: "إضافة شكل أو رسمة بسيطة مع القصة.", icon: Paintbrush },
  "Hair Oil Treatment": { arabicTitle: "حمام زيت", description: "تغذية ولمعة للشعر بعد الحلاقة.", icon: Droplets, badge: "ينصح بها" },
  "Hair Straightening": { arabicTitle: "فرد شعر", description: "فرد وتنعيم للشعر.", icon: Scissors },
  "Hair Styling": { arabicTitle: "تسريح", description: "لمسة نهائية مرتبة بعد الخدمة.", icon: Scissors },
  "Long Hair Protein": { arabicTitle: "بروتين شعر طويل", description: "عناية مكثفة للشعر الطويل.", icon: Sparkles },
  "Short Hair Protein": { arabicTitle: "بروتين شعر قصير", description: "عناية مكثفة للشعر القصير.", icon: Sparkles },
  "Silver Highlights": { arabicTitle: "هايلايتس فضي", description: "لمسة لون فضية مميزة.", icon: Paintbrush },
  "Smoothing Cream": { arabicTitle: "كريم فرد", description: "فرد وتنعيم خفيف للشعر.", icon: Droplets },
  "Toppik Hair Spray": { arabicTitle: "رش توبيك", description: "لمسة تغطية وتحسين لمظهر الشعر.", icon: Scissors, badge: "لمسة سريعة" },
  "Wavy Styling": { arabicTitle: "تمويج شعر", description: "تصفيف بأمواج طبيعية.", icon: Scissors },
  "بلوب كيرلي": { arabicTitle: "بلوب كيرلي", description: "تمويج كيرلي للشعر.", icon: Scissors },
  "معالج الشعر": { arabicTitle: "معالج الشعر", description: "علاج وتغذية للشعر.", icon: Droplets },
  "بلسم": { arabicTitle: "بلسم", description: "بلسم مغذي للشعر.", icon: Droplets },
  "ثيرم": { arabicTitle: "ثيرم", description: "حماية حرارية للشعر.", icon: Scissors },
  "حمام كريم": { arabicTitle: "حمام كريم", description: "عناية مكثفة بحمام كريم للشعر.", icon: Droplets },
  "شامبو": { arabicTitle: "شامبو", description: "غسيل شعر بشامبو مناسب.", icon: Droplets },
  // ── دقن ووجه ──
  "Zero Beard Shave": { arabicTitle: "دقن زيرو", description: "حلاقة دقن زيرو أو موس حسب اختيارك.", icon: Scissors },
  "Beard Bleaching": { arabicTitle: "تشقير دقن", description: "تفتيح بسيط لشعر الدقن لإطلالة أنعم.", icon: Paintbrush },
  "Face Threading": { arabicTitle: "فتلة وجه", description: "إزالة شعر الوجه بالخيط للحصول على مظهر أنضف.", icon: Scissors },
  "Threading": { arabicTitle: "فتلة", description: "إزالة شعر بالخيط.", icon: Scissors },
  "Full Wax": { arabicTitle: "واكس كامل", description: "إزالة شعر الوجه بشكل كامل.", icon: Scissors },
  "Partial Wax": { arabicTitle: "واكس جزئي", description: "إزالة شعر منطقة محددة مثل الأنف.", icon: Scissors },
  // ── راحة ولمسة نهائية ──
  "Hot / Cold Towel": { arabicTitle: "فوطة سخنة / ساقعة", description: "إضافة بسيطة تعزز الراحة وتكمل التجربة.", icon: HandHelping, badge: "لمسة راحة" },
  "Hot Towel": { arabicTitle: "فوطة سخنة", description: "إضافة بسيطة تعزز الراحة وتكمل التجربة.", icon: HandHelping },
  "Cold Towel": { arabicTitle: "فوطة ساقعة", description: "إضافة بسيطة تعزز الراحة وتكمل التجربة.", icon: HandHelping },
  "باديكير قدم": { arabicTitle: "باديكير قدم", description: "عناية إضافية لمظهر أكثر اكتمالًا.", icon: HandHelping },
  "باديكير يد": { arabicTitle: "باديكير يد", description: "لمسة عناية إضافية لليدين.", icon: HandHelping },
  "برفيوم SF": { arabicTitle: "برفيوم SF", description: "لمسة عطر نهائية بعد الخدمة.", icon: Sparkles },
};

/* ═══════════════════════════════════════════════════════════════════════════
   FLEXIBLE NAME MATCHING UTILITIES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Normalize a service name for flexible comparison */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")     // collapse whitespace/dashes/underscores
    .replace(/[&+]/g, " and ")     // normalize & and + to 'and'
    .replace(/\s+/g, " ")          // collapse again
    .trim();
}

/** Build a lookup map once: normalized key → original PRES key */
const PRES_NORMALIZED: Map<string, string> = new Map(
  Object.keys(PRES).map(k => [normalizeName(k), k])
);

function getPres(name: string): ServicePres | null {
  // Exact match first
  if (PRES[name.trim()]) return PRES[name.trim()];
  // Normalized match
  const normalKey = normalizeName(name);
  const match = PRES_NORMALIZED.get(normalKey);
  if (match) return PRES[match];
  // Partial/fuzzy: check if a normalized PRES key contains the normalized name or vice versa
  for (const [nk, origKey] of PRES_NORMALIZED) {
    if (nk.includes(normalKey) || normalKey.includes(nk)) return PRES[origKey];
  }
  return null;
}

/** Check if a service name flexibly matches any name in a list */
function flexMatch(serviceName: string, targetNames: string[]): boolean {
  const norm = normalizeName(serviceName);
  return targetNames.some(t => {
    const nt = normalizeName(t);
    return norm === nt || norm.includes(nt) || nt.includes(norm);
  });
}

/**
 * Determine if a service should be visible in the UI.
 * IMPORTANT: Do NOT require isBookableOnline === true.
 * Many real services currently come from API with isBookableOnline=false
 * (legacy/default value). This field should not hide services until
 * backend data is fixed.
 */
function isServiceVisible(s: BookingService): boolean {
  const name = s.name?.trim();
  const price = s.price;
  return Boolean(name) && Number(price) > 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN / SECONDARY CLASSIFICATION
   ═══════════════════════════════════════════════════════════════════════════ */

// Primary: order matters (Detail Cut → Beard → Hair & Beard)
// Each slot has an array of name variations, first found wins
const PRIMARY_SLOTS: { names: string[] }[] = [
  { names: ["Hair Cut", "Haircut", "Detailed Cut", "Detail Cut", "DetailedCut"] },
  { names: ["Beard Styling & Fade", "Beard Styling", "Beard"] },
  { names: ["Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair cut + Beard", "Hair and Beard"] },
];
const SECONDARY_NAMES = ["Advanced Cut", "Fade Cut"];

// Collect all possible main names for exclusion
const ALL_MAIN_VARIATIONS = PRIMARY_SLOTS.flatMap(s => s.names).concat(SECONDARY_NAMES);

/* ═══════════════════════════════════════════════════════════════════════════
   ADD-ON CATEGORY TABS
   ═══════════════════════════════════════════════════════════════════════════ */

type AddonCatKey = "skincare" | "masks" | "hair" | "beard_face" | "comfort" | "other";

interface AddonCat {
  key: AddonCatKey;
  label: string;
  icon: LucideIcon;
  serviceNames: string[];
}

const ADDON_CATEGORIES: AddonCat[] = [
  {
    key: "skincare",
    label: "عناية البشرة",
    icon: Droplets,
    serviceNames: ["Basic Skin Care", "Deep SkinCare", "Medical Skin Care"],
  },
  {
    key: "masks",
    label: "ماسكات",
    icon: Sparkles,
    serviceNames: ["Face Mask", "Gold Mask", "Coffee Mask", "peel-off Mask", "Hair Mask"],
  },
  {
    key: "hair",
    label: "شعر",
    icon: Paintbrush,
    serviceNames: [
      "Basic Hair Color", "Dry-Hair", "Hair & Beard Color", "Hair Botox", "Hair Design",
      "Hair Oil Treatment", "Hair Straightening", "Hair Styling", "Long Hair Protein",
      "Short Hair Protein", "Silver Highlights", "Smoothing Cream", "Toppik Hair Spray",
      "Wavy Styling", "بلوب كيرلي", "معالج الشعر", "بلسم", "ثيرم", "حمام كريم", "شامبو",
    ],
  },
  {
    key: "beard_face",
    label: "دقن ووجه",
    icon: Scissors,
    serviceNames: [
      "Zero Beard Shave", "Beard Bleaching", "Face Threading", "Threading",
      "Full Wax", "Partial Wax",
    ],
  },
  {
    key: "comfort",
    label: "راحة ولمسة نهائية",
    icon: HandHelping,
    serviceNames: [
      "Hot / Cold Towel", "Hot Towel", "Cold Towel",
      "باديكير قدم", "باديكير يد", "برفيوم SF",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-3">
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-100 rounded w-3/5" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
      </div>
    </div>
    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
    <div className="h-3 bg-gray-100 rounded w-4/5" />
  </div>
);

/* ─── Primary Large Card ──────────────────────────────────────────────── */
const PrimaryCard = ({
  service, isSelected, onSelect,
}: { service: BookingService; isSelected: boolean; onSelect: () => void }) => {
  const p = getPres(service.name);
  const Icon = p?.icon ?? Scissors;
  const title = p?.arabicTitle ?? service.name;
  const desc = p?.description ?? "";
  const sales = p?.salesText ?? "";
  const badge = p?.badge;

  return (
    <button onClick={onSelect} className={`
      w-full rounded-2xl border text-right transition-all duration-200 overflow-hidden group cursor-pointer
      ${isSelected
        ? "border-cut-gold bg-cut-gold/[0.06] shadow-[0_0_24px_rgba(164,136,121,0.15)] ring-1 ring-cut-gold/20"
        : "border-gray-150 bg-white hover:border-cut-gold/40 hover:shadow-sm"
      }
    `}>
      <div className={`h-1 w-full transition-colors ${isSelected ? "bg-cut-gold" : "bg-gradient-to-l from-cut-gold/15 to-transparent"}`} />
      <div className="p-4 md:p-5">
        {badge && (
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cut-gold/10 text-cut-gold border border-cut-gold/20">
              <Sparkles className="w-2.5 h-2.5" />
              {badge}
            </span>
          </div>
        )}
        <div className="flex items-start gap-3.5">
          <div className={`
            w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
            ${isSelected ? "bg-cut-gold shadow-[0_4px_16px_rgba(164,136,121,0.3)]" : "bg-gray-50 group-hover:bg-cut-gold/10"}
          `}>
            <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isSelected ? "text-black" : "text-gray-400 group-hover:text-cut-gold"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className={`font-heading font-bold text-base md:text-[17px] leading-tight mb-0.5 ${isSelected ? "text-gray-900" : "text-gray-800"}`}>{title}</h4>
                {desc && <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>}
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isSelected ? "border-cut-gold bg-cut-gold" : "border-gray-200"}`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
              </div>
            </div>
            {sales && (
              <p className="text-gray-400 text-[11px] leading-relaxed mt-2 bg-gray-50/80 rounded-lg px-3 py-1.5 border border-gray-100">{sales}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-cut-gold font-bold text-sm">
                <Banknote className="w-3.5 h-3.5" />{service.price} جنيه
              </span>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5" />{service.durationMinutes} دقيقة
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

/* ─── Secondary Smaller Card ──────────────────────────────────────────── */
const SecondaryCard = ({
  service, isSelected, onSelect,
}: { service: BookingService; isSelected: boolean; onSelect: () => void }) => {
  const p = getPres(service.name);
  const Icon = p?.icon ?? Scissors;
  const title = p?.arabicTitle ?? service.name;
  const desc = p?.description ?? "";

  return (
    <button onClick={onSelect} className={`
      w-full rounded-xl border p-3.5 text-right transition-all duration-150 group cursor-pointer
      ${isSelected
        ? "border-cut-gold bg-cut-gold/[0.06] shadow-sm shadow-cut-gold/10 ring-1 ring-cut-gold/20"
        : "border-gray-150 bg-white hover:border-cut-gold/40"
      }
    `}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-cut-gold" : "bg-gray-50 group-hover:bg-cut-gold/10"}`}>
          <Icon className={`w-4 h-4 transition-colors ${isSelected ? "text-black" : "text-gray-400 group-hover:text-cut-gold"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm leading-tight ${isSelected ? "text-gray-900" : "text-gray-800"}`}>{title}</p>
          {desc && <p className="text-gray-400 text-[11px] mt-0.5 leading-snug">{desc}</p>}
          <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-cut-gold font-bold"><Banknote className="w-3 h-3" />{service.price} جنيه</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{service.durationMinutes} د</span>
          </p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-cut-gold bg-cut-gold" : "border-gray-200"}`}>
          {isSelected && <Check className="w-3 h-3 text-black" />}
        </div>
      </div>
    </button>
  );
};

/* ─── Upsell Add-on Card ──────────────────────────────────────────────── */
const UpsellCard = ({
  service, isSelected, onToggle,
}: { service: BookingService; isSelected: boolean; onToggle: () => void }) => {
  const p = getPres(service.name);
  const Icon = p?.icon ?? Plus;
  const title = p?.arabicTitle ?? service.name;
  const desc = p?.description ?? "";
  const badge = p?.badge;

  return (
    <button onClick={onToggle} className={`
      w-full rounded-xl border p-3.5 text-right transition-all duration-150 group cursor-pointer
      ${isSelected
        ? "border-cut-gold bg-cut-gold/[0.04] shadow-sm shadow-cut-gold/10"
        : "border-gray-100 bg-gray-50/50 hover:border-cut-gold/30 hover:bg-white"
      }
    `}>
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-cut-gold bg-cut-gold" : "border-gray-250 group-hover:border-cut-gold/50"}`}>
          {isSelected && <Check className="w-3 h-3 text-black" />}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-cut-gold/15" : "bg-white"}`}>
          <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-cut-gold" : "text-gray-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-sm leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{title}</p>
            {badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cut-gold/10 text-cut-gold border border-cut-gold/15 whitespace-nowrap">{badge}</span>
            )}
          </div>
          {desc && <p className="text-gray-400 text-[11px] mt-0.5 leading-snug">{desc}</p>}
        </div>
        <div className="text-left flex-shrink-0">
          <p className="text-cut-gold font-bold text-xs">+{service.price} ج</p>
          <p className="text-gray-400 text-[10px]">{service.durationMinutes} د</p>
        </div>
      </div>
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const BookingServiceSelect = ({
  services,
  selectedIds,
  onSelect,
  onToggleAddon,
  isLoading = false,
}: BookingServiceSelectProps) => {
  const [activeAddonTab, setActiveAddonTab] = useState<AddonCatKey>("skincare");

  // ── DEV LOGGING (comprehensive) ──
  useMemo(() => {
    if (process.env.NODE_ENV !== "development" || services.length === 0) return;
    console.group("[booking] BookingServiceSelect Debug");

    // 1. Raw services
    console.log("[booking] raw services count:", services.length);
    console.log("[booking] first service raw keys:", Object.keys(services[0]));
    console.log("[booking] first service raw:", JSON.parse(JSON.stringify(services[0])));
    console.table(services.map(s => {
      const raw = s as unknown as Record<string, unknown>;
      return {
        id: raw.id ?? raw.proId ?? raw.ProID ?? raw.ProductID,
        name: raw.name ?? raw.proName ?? raw.ProName ?? raw.productName ?? raw.ProductName ?? raw.title,
        category: raw.category ?? raw.categoryName ?? raw.CatName ?? raw.catName,
        price: raw.price ?? raw.Price ?? raw.salePrice ?? raw.SalePrice,
        duration: raw.duration ?? raw.Duration ?? raw.durationMinutes ?? raw.DurationMinutes,
        active: raw.active ?? raw.isActive ?? raw.IsActive,
        isBookableOnline: s.isBookableOnline,
      };
    }));

    // 2. Categories
    console.log("[booking] unique categories:", [...new Set(services.map(s => s.categoryName))]);

    // 3. Visibility filter
    const visible = services.filter(isServiceVisible);
    const hidden = services.filter(s => !isServiceVisible(s));
    console.log("[booking] visible services (name + price>0):", visible.length);
    if (hidden.length > 0) {
      console.log("[booking] hidden services:", hidden.map(s => ({ name: s.name, price: s.price, reason: !s.name?.trim() ? "no name" : "price<=0" })));
    }
    const notBookable = services.filter(s => !s.isBookableOnline);
    if (notBookable.length > 0) {
      console.log("[booking] note: isBookableOnline=false (IGNORED, not used for filtering):", notBookable.length, "services");
    }

    console.groupEnd();
  }, [services]);

  // Helper: find first visible service matching any of the given names (flexible)
  const findByNames = (names: string[]): BookingService | null => {
    // Exact match first (fast path)
    for (const n of names) {
      const s = services.find(sv => sv.name.trim() === n && isServiceVisible(sv));
      if (s) return s;
    }
    // Flexible match (normalized)
    for (const n of names) {
      const s = services.find(sv => flexMatch(sv.name, [n]) && isServiceVisible(sv));
      if (s) return s;
    }
    return null;
  };

  /* ── Resolve primary services (exact 3, in order) ── */
  const mainPrimary = useMemo(() => {
    const result: BookingService[] = [];
    for (const slot of PRIMARY_SLOTS) {
      const s = findByNames(slot.names);
      if (s) result.push(s);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  /* ── Secondary services ── */
  const mainSecondary = useMemo(() => {
    return SECONDARY_NAMES
      .map(n => {
        // Exact first
        const exact = services.find(s => s.name.trim() === n && isServiceVisible(s));
        if (exact) return exact;
        // Flexible fallback
        return services.find(s => flexMatch(s.name, [n]) && isServiceVisible(s)) ?? null;
      })
      .filter((s): s is BookingService => s != null);
  }, [services]);

  /* ── All main IDs for exclusion ── */
  const allMainIds = useMemo(() => {
    const ids = new Set<number>();
    // All services whose names match any main variation (flexible)
    services.forEach(s => {
      if (flexMatch(s.name, ALL_MAIN_VARIATIONS)) ids.add(s.id);
    });
    // Also the resolved primary/secondary
    mainPrimary.forEach(s => ids.add(s.id));
    mainSecondary.forEach(s => ids.add(s.id));

    if (process.env.NODE_ENV === "development" && services.length > 0) {
      console.group("[booking] Main service resolution");
      console.log("[booking] primary resolved:", mainPrimary.length, mainPrimary.map(s => s.name));
      PRIMARY_SLOTS.forEach(slot => {
        const found = findByNames(slot.names);
        console.log(`[booking]   slot [${slot.names[0]}]:`, found ? `✓ matched "${found.name}"` : `✗ NOT FOUND (tried: ${slot.names.join(", ")})`);
      });
      console.log("[booking] secondary resolved:", mainSecondary.length, mainSecondary.map(s => s.name));
      console.log("[booking] total main IDs excluded:", ids.size, [...ids]);
      // Show services excluded as main with reasons
      services.forEach(s => {
        if (ids.has(s.id)) {
          console.log(`  [booking] excluded as main: "${s.name}" (id=${s.id})`);
        }
      });
      console.groupEnd();
    }

    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, mainPrimary, mainSecondary]);

  /* ── Add-on services: everything visible that's NOT a main service ── */
  const addonServices = useMemo(() => {
    return services.filter(s =>
      isServiceVisible(s) && !allMainIds.has(s.id)
    );
  }, [services, allMainIds]);

  /* ── Group add-ons by category ── */
  const addonGrouped = useMemo(() => {
    const map: Record<AddonCatKey, BookingService[]> = {
      skincare: [], masks: [], hair: [], beard_face: [], comfort: [], other: [],
    };
    const placed = new Set<number>();

    // First pass: place by flexible name match
    for (const cat of ADDON_CATEGORIES) {
      for (const s of addonServices) {
        if (placed.has(s.id)) continue;
        if (flexMatch(s.name, cat.serviceNames)) {
          map[cat.key].push(s);
          placed.add(s.id);
        }
      }
    }

    // Second pass: unplaced services go to best-guess category or "other"
    for (const s of addonServices) {
      if (placed.has(s.id)) continue;
      const lower = s.name.toLowerCase();
      if (lower.includes("mask") || lower.includes("ماسك")) {
        map.masks.push(s);
      } else if (lower.includes("skin") || lower.includes("بشرة") || lower.includes("skincare")) {
        map.skincare.push(s);
      } else if (lower.includes("beard") || lower.includes("دقن") || lower.includes("wax") || lower.includes("thread") || lower.includes("فتلة")) {
        map.beard_face.push(s);
      } else if (lower.includes("towel") || lower.includes("فوطة") || lower.includes("باديكير") || lower.includes("برفيوم")) {
        map.comfort.push(s);
      } else {
        map.other.push(s);
      }
    }

    if (process.env.NODE_ENV === "development" && addonServices.length > 0) {
      console.group("[booking] Add-on grouping");
      console.log("[booking] add-on services total:", addonServices.length);
      console.log("[booking] skincare tab:", map.skincare.length, map.skincare.map(s => s.name));
      console.log("[booking] masks tab:", map.masks.length, map.masks.map(s => s.name));
      console.log("[booking] hair tab:", map.hair.length, map.hair.map(s => s.name));
      console.log("[booking] beard_face tab:", map.beard_face.length, map.beard_face.map(s => s.name));
      console.log("[booking] comfort tab:", map.comfort.length, map.comfort.map(s => s.name));
      console.log("[booking] other (unmatched addons):", map.other.length, map.other.map(s => s.name));
      if (map.other.length > 0) {
        map.other.forEach(s => {
          console.log(`  [booking] unmatched addon: "${s.name}" category="${s.categoryName}" → placed in 'other'`);
        });
      }
      console.groupEnd();
    }

    return map;
  }, [addonServices]);

  /* ── Tabs with counts (only show tabs that have services) ── */
  const visibleTabs = useMemo(() => {
    const tabs = ADDON_CATEGORIES.filter(c => addonGrouped[c.key].length > 0);
    // Add "other" tab if there are unclassified services
    if (addonGrouped.other.length > 0) {
      tabs.push({
        key: "other",
        label: "إضافات أخرى",
        icon: Plus,
        serviceNames: [],
      });
    }
    return tabs;
  }, [addonGrouped]);

  /* ── Selected main ID ── */
  const selectedMainId = useMemo(() => {
    return selectedIds.find(id => allMainIds.has(id)) ?? null;
  }, [selectedIds, allMainIds]);

  const hasMainSelection = selectedMainId !== null;

  /* ── Auto-select first non-empty addon tab ── */
  const effectiveTab = visibleTabs.find(t => t.key === activeAddonTab) ? activeAddonTab : (visibleTabs[0]?.key ?? "skincare");

  /* Handlers */
  const handleMainSelect = (id: number) => onSelect(id);
  const handleAddonToggle = (id: number) => {
    if (onToggleAddon) onToggleAddon(id);
    else onSelect(id);
  };

  const totalMain = mainPrimary.length + mainSecondary.length;

  /* Loading */
  if (isLoading) {
    return (
      <div className="p-5 md:p-6" dir="rtl">
        <h3 className="text-lg font-heading font-bold text-gray-900 mb-5">اختر الخدمة الأساسية</h3>
        <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  /* Empty — only if API returned 0 services total */
  if (services.length === 0) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 text-sm">لا توجد خدمات متاحة للحجز الآن</p>
      </div>
    );
  }

  /* If we have services from API but no main resolved, show all visible as fallback */
  const visibleServices = services.filter(isServiceVisible);
  const showFallbackList = totalMain === 0 && visibleServices.length > 0;

  return (
    <div className="p-5 md:p-6" dir="rtl">
      {/* ═══════════════════════════════════════════
         LEVEL 1: MAIN SERVICES
         ═══════════════════════════════════════════ */}
      <div className="mb-2">
        <h3 className="text-lg font-heading font-bold text-gray-900 mb-0.5">اختر الخدمة الأساسية</h3>
        <p className="text-gray-400 text-xs">ابدأ بالخدمة الرئيسية المناسبة لك</p>
      </div>

      {/* Fallback: if no main resolved but API has bookable services, show them all */}
      {showFallbackList && (
        <div className="space-y-3 mt-4">
          {visibleServices.map(s => (
            <PrimaryCard key={s.id} service={s} isSelected={selectedIds.includes(s.id)} onSelect={() => handleMainSelect(s.id)} />
          ))}
        </div>
      )}

      {/* Primary — 3 large cards */}
      {!showFallbackList && mainPrimary.length > 0 && (
        <div className="space-y-3 mt-4">
          {mainPrimary.map(s => (
            <PrimaryCard key={s.id} service={s} isSelected={selectedIds.includes(s.id)} onSelect={() => handleMainSelect(s.id)} />
          ))}
        </div>
      )}

      {/* Secondary — smaller cards under divider */}
      {!showFallbackList && mainSecondary.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-gray-400 text-[10px] font-bold whitespace-nowrap">اختيارات أخرى</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="space-y-2.5">
            {mainSecondary.map(s => (
              <SecondaryCard key={s.id} service={s} isSelected={selectedIds.includes(s.id)} onSelect={() => handleMainSelect(s.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
         LEVEL 2: CATEGORIZED UPSELL ADD-ONS
         ═══════════════════════════════════════════ */}
      {hasMainSelection && visibleTabs.length > 0 && (
        <div className="mt-7 pt-6 border-t border-gray-100">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-md bg-cut-gold/10 flex items-center justify-center">
              <Plus className="w-3 h-3 text-cut-gold" />
            </div>
            <h4 className="font-heading font-bold text-sm text-gray-800">إضافات ممكن تعجبك</h4>
          </div>
          <p className="text-gray-400 text-[11px] mb-4 mr-8">اختيارات إضافية لتحسين النتيجة وتجربة أفضل</p>

          {/* Category tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {visibleTabs.map(tab => {
              const isActive = effectiveTab === tab.key;
              const TabIcon = tab.icon;
              const count = addonGrouped[tab.key].length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveAddonTab(tab.key)}
                  className={`
                    flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer
                    ${isActive
                      ? "bg-cut-gold text-black shadow-sm shadow-cut-gold/20"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }
                  `}
                >
                  <TabIcon className="w-3 h-3" />
                  {tab.label}
                  {!isActive && (
                    <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[9px] leading-4 text-center inline-block">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active category cards */}
          <div className="space-y-2">
            {(addonGrouped[effectiveTab] ?? []).map(s => (
              <UpsellCard key={s.id} service={s} isSelected={selectedIds.includes(s.id)} onToggle={() => handleAddonToggle(s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingServiceSelect;
