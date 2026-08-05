"use client";

import { useState, useMemo } from "react";
import {
  Scissors, Clock, Banknote, Check, Sparkles, Droplets, Plus, Paintbrush, HandHelping,
  type LucideIcon,
} from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { serviceNameAr, serviceNameEn } from "@/lib/booking-api";
import {
  isServiceVisible,
  resolveCoreServices,
  groupOtherServices,
  getRecommendedAddons,
  groupRecommendedAddons,
  OTHER_SERVICE_CATEGORIES,
  type OtherServiceCatKey,
} from "@/lib/bookingServiceGroups";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

interface BookingServiceSelectProps {
  services: BookingService[];
  selectedIds: number[];
  onCoreSelect: (id: number) => void;
  onToggleService: (id: number) => void;
  isLoading?: boolean;
  totalPrice?: number;
  totalDuration?: number;
  selectedCount?: number;
  onContinue?: () => void;
}

interface ServicePres {
  arabicTitle: string;
  description: string;
  salesText?: string;
  icon: LucideIcon;
  badge?: string;
}

const BADGE_I18N: Record<string, string> = {
  "الأكثر طلبًا": "service.badgeMostRequested",
  "باكدج مميز": "service.badgeFeaturedPackage",
  "ينصح بها": "service.badgeRecommended",
  "تكمل الخدمة": "service.badgeCompletesService",
  "تجربة مميزة": "service.badgePremiumExperience",
  "عناية قوية": "service.badgeStrongCare",
  "لمسة سريعة": "service.badgeQuickTouch",
  "لمسة راحة": "service.badgeComfortTouch",
};

const CAT_I18N: Record<OtherServiceCatKey, string> = {
  skincare: "service.catSkincare",
  masks: "service.catMasks",
  hair: "service.catHair",
  beard_face: "service.catBeardFace",
  comfort: "service.catComfort",
  other: "service.otherServices",
};

const PRES: Record<string, ServicePres> = {
  "Hair Cut": { arabicTitle: "Hair Cut", description: "تدريج وقص الشعر من الأعلى بشكل مرتب ومناسب لستايلك.", salesText: "مناسبة لمعظم العملاء اللي عاوزين نتيجة مرتبة وواضحة.", icon: Scissors, badge: "الأكثر طلبًا" },
  "Detailed Cut": { arabicTitle: "Hair Cut", description: "تدريج وقص الشعر من الأعلى بشكل مرتب ومناسب لستايلك.", salesText: "مناسبة لمعظم العملاء اللي عاوزين نتيجة مرتبة وواضحة.", icon: Scissors, badge: "الأكثر طلبًا" },
  "Beard Styling & Fade": { arabicTitle: "Beard Styling & Fade", description: "تظبيط وتدريج الدقن وتحديدها بشكل احترافي.", salesText: "اختيار مناسب لو محتاج تظبيط الدقن فقط بدون حلاقة شعر.", icon: Scissors },
  "Beard": { arabicTitle: "Beard Styling & Fade", description: "تظبيط وتدريج الدقن وتحديدها بشكل احترافي.", salesText: "اختيار مناسب لو محتاج تظبيط الدقن فقط بدون حلاقة شعر.", icon: Scissors },
  "Haircut & Beard": { arabicTitle: "Haircut & Beard", description: "باكدج كامل للشعر والدقن في زيارة واحدة لستايل متناسق.", salesText: "أفضل اختيار لو عاوز لوك كامل ومتناسق.", icon: Scissors, badge: "باكدج مميز" },
  "Hair & Beard": { arabicTitle: "Haircut & Beard", description: "باكدج كامل للشعر والدقن في زيارة واحدة لستايل متناسق.", salesText: "أفضل اختيار لو عاوز لوك كامل ومتناسق.", icon: Scissors, badge: "باكدج مميز" },
  "Advanced Cut": { arabicTitle: "Advanced Cut", description: "للشعر الطويل أو القصات التي تحتاج وقت وتفاصيل أكثر.", icon: Sparkles },
  "Fade Cut": { arabicTitle: "Fade Cut", description: "لتدريج الجوانب فقط مثل Taper Fade أو Fade بسيط.", icon: Scissors },
  "Basic Cut": { arabicTitle: "Basic Cut", description: "للقصات البسيطة والسريعة.", icon: Scissors },
  "Basic Skin Care": { arabicTitle: "تنظيف بشرة Basic", description: "تنظيف خفيف للبشرة مناسب كإضافة سريعة.", icon: Droplets },
  "Deep SkinCare": { arabicTitle: "تنظيف بشرة Deep", description: "عناية أعمق للبشرة لمن يريد نتيجة أوضح.", icon: Droplets, badge: "ينصح بها" },
  "Medical Skin Care": { arabicTitle: "عناية متقدمة بالبشرة", description: "جلسة عناية متقدمة للبشرة.", icon: Droplets },
  "Face Mask": { arabicTitle: "ماسك للبشرة", description: "ماسك سريع يمنح البشرة انتعاش ولمسة نهائية أفضل.", icon: Droplets, badge: "تكمل الخدمة" },
  "Gold Mask": { arabicTitle: "ماسك ذهبي", description: "اختيار مميز لمن يريد تجربة أفخم وعناية إضافية.", icon: Sparkles, badge: "تجربة مميزة" },
  "Coffee Mask": { arabicTitle: "ماسك قهوة", description: "ينعش البشرة ويساعد على مظهر أكثر حيوية.", icon: Droplets, badge: "ينصح بها" },
  "peel-off Mask": { arabicTitle: "Peel-off Mask", description: "ماسك يساعد على تنظيف البشرة وإحساس أنضف بعد الخدمة.", icon: Droplets },
  "Hair Mask": { arabicTitle: "ماسك شعر", description: "عناية ملطفة للشعر بعد الحلاقة.", icon: Droplets },
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
  "Zero Beard Shave": { arabicTitle: "دقن زيرو", description: "حلاقة دقن زيرو أو موس حسب اختيارك.", icon: Scissors },
  "Beard Bleaching": { arabicTitle: "تشقير دقن", description: "تفتيح بسيط لشعر الدقن لإطلالة أنعم.", icon: Paintbrush },
  "Face Threading": { arabicTitle: "فتلة وجه", description: "إزالة شعر الوجه بالخيط للحصول على مظهر أنضف.", icon: Scissors },
  "Threading": { arabicTitle: "فتلة", description: "إزالة شعر بالخيط.", icon: Scissors },
  "Full Wax": { arabicTitle: "واكس كامل", description: "إزالة شعر الوجه بشكل كامل.", icon: Scissors },
  "Partial Wax": { arabicTitle: "واكس جزئي", description: "إزالة شعر منطقة محددة مثل الأنف.", icon: Scissors },
  "Hot / Cold Towel": { arabicTitle: "فوطة سخنة / ساقعة", description: "إضافة بسيطة تعزز الراحة وتكمل التجربة.", icon: HandHelping, badge: "لمسة راحة" },
  "Hot Towel": { arabicTitle: "فوطة سخنة", description: "إضافة بسيطة تعزز الراحة وتكمل التجربة.", icon: HandHelping },
  "Cold Towel": { arabicTitle: "فوطة ساقعة", description: "إضافة بسيطة تعزز الراحة وتكمل التجربة.", icon: HandHelping },
  "باديكير قدم": { arabicTitle: "باديكير قدم", description: "عناية إضافية لمظهر أكثر اكتمالًا.", icon: HandHelping },
  "باديكير يد": { arabicTitle: "باديكير يد", description: "لمسة عناية إضافية لليدين.", icon: HandHelping },
  "برفيوم SF": { arabicTitle: "برفيوم SF", description: "لمسة عطر نهائية بعد الخدمة.", icon: Sparkles },
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_-]+/g, " ").replace(/[&+]/g, " and ").replace(/\s+/g, " ").trim();
}

const PRES_NORMALIZED = new Map(Object.keys(PRES).map(k => [normalizeName(k), k]));

function getPres(name: string): ServicePres | null {
  if (PRES[name.trim()]) return PRES[name.trim()];
  const match = PRES_NORMALIZED.get(normalizeName(name));
  if (match) return PRES[match];
  for (const [nk, origKey] of PRES_NORMALIZED) {
    if (nk.includes(normalizeName(name)) || normalizeName(name).includes(nk)) return PRES[origKey];
  }
  return null;
}

function getPresForService(service: BookingService): ServicePres | null {
  return (
    getPres(service.nameEn || "") ||
    getPres(service.name) ||
    getPres(service.nameAr || "")
  );
}

/** Locale-aware primary + secondary language lines — brand fonts. */
function ServiceBilingualTitle({
  service,
  selected,
  compact = false,
}: {
  service: BookingService;
  selected?: boolean;
  compact?: boolean;
}) {
  const { lang } = useBookingTranslations();
  const ar = serviceNameAr(service);
  const en = serviceNameEn(service);
  const primary = lang === "en" ? en || ar : ar;
  const secondary = lang === "en" ? (ar && ar !== primary ? ar : null) : en && en !== ar ? en : null;
  const primaryLang = lang === "en" && en ? "en" : "ar";
  const secondaryLang = primaryLang === "en" ? "ar" : "en";
  const tone = selected ? "text-gray-900" : "text-gray-800";
  const enTone = selected
    ? "text-[var(--booking-text-secondary)]"
    : "text-[var(--booking-text-secondary)]";

  return (
    <div className="min-w-0">
      <p
        className={`font-heading font-bold leading-tight ${tone} ${
          compact ? "text-sm" : "text-base md:text-[17px]"
        }`}
        lang={primaryLang}
        dir={primaryLang === "ar" ? "rtl" : "ltr"}
      >
        {primary}
      </p>
      {secondary ? (
        <p
          className={`font-editorial font-medium leading-snug tracking-wide ${enTone} ${
            compact ? "mt-0.5 text-[11px]" : "mt-1 text-xs md:text-[13px]"
          }`}
          lang={secondaryLang}
          dir={secondaryLang === "ar" ? "rtl" : "ltr"}
        >
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

function localizeBadge(badge: string | undefined, t: (key: string) => string): string | null {
  if (!badge) return null;
  const key = BADGE_I18N[badge];
  return key ? t(key) : badge;
}

const TAB_ICONS: Record<OtherServiceCatKey, LucideIcon> = {
  skincare: Droplets,
  masks: Sparkles,
  hair: Paintbrush,
  beard_face: Scissors,
  comfort: HandHelping,
  other: Plus,
};

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

const PrimaryCard = ({
  service, isSelected, onSelect,
}: { service: BookingService; isSelected: boolean; onSelect: () => void }) => {
  const { t, format } = useBookingTranslations();
  const p = getPresForService(service);
  const Icon = p?.icon ?? Scissors;
  const desc = p?.description ?? "";
  const sales = p?.salesText ?? "";
  const badge = localizeBadge(p?.badge, t);

  return (
    <button type="button" onClick={onSelect} className={`
      w-full rounded-2xl border text-start transition-all duration-200 overflow-hidden group cursor-pointer
      ${isSelected
        ? "border-cut-gold bg-cut-gold/[0.06] shadow-[0_0_24px_rgba(212,175,55,0.15)] ring-1 ring-cut-gold/20"
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
            ${isSelected ? "bg-cut-gold shadow-[0_4px_16px_rgba(212,175,55,0.3)]" : "bg-gray-50 group-hover:bg-cut-gold/10"}
          `}>
            <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isSelected ? "text-black" : "text-gray-400 group-hover:text-cut-gold"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <ServiceBilingualTitle service={service} selected={isSelected} />
                {desc && <p className="text-gray-500 text-xs leading-relaxed mt-1.5">{desc}</p>}
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
                <Banknote className="w-3.5 h-3.5" />{format.price(service.price)}
              </span>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5" />{format.duration(service.durationMinutes)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const SecondaryCard = ({
  service, isSelected, onSelect,
}: { service: BookingService; isSelected: boolean; onSelect: () => void }) => {
  const { format } = useBookingTranslations();
  const p = getPresForService(service);
  const Icon = p?.icon ?? Scissors;
  const desc = p?.description ?? "";

  return (
    <button type="button" onClick={onSelect} className={`
      w-full rounded-xl border p-3.5 text-start transition-all duration-150 group cursor-pointer
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
          <ServiceBilingualTitle service={service} selected={isSelected} compact />
          {desc && <p className="text-gray-400 text-[11px] mt-1 leading-snug">{desc}</p>}
          <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-cut-gold font-bold"><Banknote className="w-3 h-3" />{format.price(service.price)}</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{format.duration(service.durationMinutes)}</span>
          </p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-cut-gold bg-cut-gold" : "border-gray-200"}`}>
          {isSelected && <Check className="w-3 h-3 text-black" />}
        </div>
      </div>
    </button>
  );
};

const OtherServiceCard = ({
  service, isSelected, onToggle,
}: { service: BookingService; isSelected: boolean; onToggle: () => void }) => {
  const { t, format } = useBookingTranslations();
  const p = getPresForService(service);
  const Icon = p?.icon ?? Plus;
  const desc = p?.description ?? "";
  const badge = localizeBadge(p?.badge, t);

  return (
    <button type="button" onClick={onToggle} className={`
      w-full rounded-xl border p-3.5 text-start transition-all duration-150 group cursor-pointer
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
          <div className="flex items-start gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <ServiceBilingualTitle service={service} selected={isSelected} compact />
            </div>
            {badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cut-gold/10 text-cut-gold border border-cut-gold/15 whitespace-nowrap">{badge}</span>
            )}
          </div>
          {desc && <p className="text-gray-400 text-[11px] mt-1 leading-snug">{desc}</p>}
          <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-cut-gold font-bold"><Banknote className="w-3 h-3" />{format.price(service.price)}</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{format.duration(service.durationMinutes)}</span>
          </p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-cut-gold bg-cut-gold" : "border-gray-200"}`}>
          {isSelected && <Check className="w-3 h-3 text-black" />}
        </div>
      </div>
    </button>
  );
};

const UpsellCard = ({
  service, isSelected, onToggle,
}: { service: BookingService; isSelected: boolean; onToggle: () => void }) => {
  const { t, format } = useBookingTranslations();
  const p = getPresForService(service);
  const Icon = p?.icon ?? Plus;
  const desc = p?.description ?? "";
  const badge = localizeBadge(p?.badge, t);

  return (
    <button type="button" onClick={onToggle} className={`
      w-full rounded-xl border p-3.5 text-start transition-all duration-150 group cursor-pointer
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
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <ServiceBilingualTitle service={service} selected={isSelected} compact />
            </div>
            {badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cut-gold/10 text-cut-gold border border-cut-gold/15 whitespace-nowrap">{badge}</span>
            )}
          </div>
          {desc && <p className="text-gray-400 text-[11px] mt-1 leading-snug">{desc}</p>}
        </div>
        <div className="text-end flex-shrink-0">
          <p className="text-cut-gold font-bold text-xs">+{format.price(service.price)}</p>
          <p className="text-gray-400 text-[10px]">{format.duration(service.durationMinutes)}</p>
        </div>
      </div>
    </button>
  );
};

const BookingServiceSelect = ({
  services,
  selectedIds,
  onCoreSelect,
  onToggleService,
  isLoading = false,
  totalPrice = 0,
  totalDuration = 0,
  selectedCount = 0,
  onContinue,
}: BookingServiceSelectProps) => {
  const { t, dir, format } = useBookingTranslations();
  const [activeOtherTab, setActiveOtherTab] = useState<OtherServiceCatKey>("skincare");
  const [activeAddonTab, setActiveAddonTab] = useState<OtherServiceCatKey>("skincare");

  const { primary: mainPrimary, secondary: mainSecondary } = useMemo(
    () => resolveCoreServices(services),
    [services],
  );

  const otherGrouped = useMemo(() => groupOtherServices(services), [services]);

  const otherTabs = useMemo(() => {
    const tabs = OTHER_SERVICE_CATEGORIES.filter(c => otherGrouped[c.key].length > 0).map((c) => ({
      ...c,
      labelKey: CAT_I18N[c.key],
    }));
    if (otherGrouped.other.length > 0) {
      tabs.push({
        key: "other",
        label: "خدمات أخرى",
        labelKey: "service.otherServices",
        serviceNames: [],
      });
    }
    return tabs;
  }, [otherGrouped]);

  const recommendedAddons = useMemo(
    () => getRecommendedAddons(services, selectedIds),
    [services, selectedIds],
  );

  const addonGrouped = useMemo(
    () => groupRecommendedAddons(recommendedAddons),
    [recommendedAddons],
  );

  const addonTabs = useMemo(() => {
    const tabs = OTHER_SERVICE_CATEGORIES.filter(c => addonGrouped[c.key].length > 0).map((c) => ({
      ...c,
      labelKey: CAT_I18N[c.key],
    }));
    if (addonGrouped.other.length > 0) {
      tabs.push({
        key: "other",
        label: "إضافات أخرى",
        labelKey: "service.otherAddons",
        serviceNames: [],
      });
    }
    return tabs;
  }, [addonGrouped]);

  const effectiveOtherTab = otherTabs.find(tab => tab.key === activeOtherTab)
    ? activeOtherTab
    : (otherTabs[0]?.key ?? "skincare");

  const effectiveAddonTab = addonTabs.find(tab => tab.key === activeAddonTab)
    ? activeAddonTab
    : (addonTabs[0]?.key ?? "skincare");

  const hasSelection = selectedIds.length > 0;
  const totalMain = mainPrimary.length + mainSecondary.length;
  const visibleServices = services.filter(isServiceVisible);
  const showFallbackList = totalMain === 0 && visibleServices.length > 0;

  if (isLoading) {
    return (
      <div className="p-5 md:p-6" dir={dir}>
        <h3 className="text-lg font-heading font-bold text-gray-900 mb-5">{t("service.title")}</h3>
        <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="p-6 text-center" dir={dir}>
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 text-sm">{t("service.empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1" dir={dir}>
      <div className="flex-1 overflow-y-auto p-5 md:p-6 pb-4">
        {/* Core services */}
        <div className="mb-2">
          <h3 className="text-lg font-heading font-bold text-gray-900 mb-0.5">{t("service.title")}</h3>
          <p className="text-gray-400 text-xs">{t("service.subtitle")}</p>
        </div>

        {showFallbackList && (
          <div className="space-y-3 mt-4">
            {visibleServices.map(s => (
              <PrimaryCard
                key={`fallback-${s.id}`}
                service={s}
                isSelected={selectedIds.includes(s.id)}
                onSelect={() => onToggleService(s.id)}
              />
            ))}
          </div>
        )}

        {!showFallbackList && mainPrimary.length > 0 && (
          <div className="space-y-3 mt-4">
            {mainPrimary.map(s => (
              <PrimaryCard
                key={`primary-${s.id}`}
                service={s}
                isSelected={selectedIds.includes(s.id)}
                onSelect={() => onCoreSelect(s.id)}
              />
            ))}
          </div>
        )}

        {!showFallbackList && mainSecondary.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-gray-400 text-[10px] font-bold whitespace-nowrap">{t("service.otherChoices")}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="space-y-2.5">
              {mainSecondary.map(s => (
                <SecondaryCard
                  key={`secondary-${s.id}`}
                  service={s}
                  isSelected={selectedIds.includes(s.id)}
                  onSelect={() => onCoreSelect(s.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other services — always visible, bookable standalone */}
        {otherTabs.length > 0 && (
          <div className="mt-7 pt-6 border-t border-gray-100">
            <div className="mb-1">
              <h4 className="font-heading font-bold text-sm text-gray-800">{t("service.otherServices")}</h4>
              <p className="text-gray-400 text-[11px] mt-0.5">
                {t("service.otherServicesHint")}
              </p>
            </div>

            <div className="flex gap-1.5 mb-4 mt-4 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {otherTabs.map(tab => {
                const isActive = effectiveOtherTab === tab.key;
                const TabIcon = TAB_ICONS[tab.key];
                const count = otherGrouped[tab.key].length;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveOtherTab(tab.key)}
                    className={`
                      flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer min-h-[36px]
                      ${isActive
                        ? "bg-cut-gold text-black shadow-sm shadow-cut-gold/20"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }
                    `}
                  >
                    <TabIcon className="w-3 h-3" />
                    {t(tab.labelKey)}
                    {!isActive && count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[9px] leading-4 text-center inline-block">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {(otherGrouped[effectiveOtherTab] ?? []).map(s => (
                <OtherServiceCard
                  key={`other-${s.id}`}
                  service={s}
                  isSelected={selectedIds.includes(s.id)}
                  onToggle={() => onToggleService(s.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended add-ons */}
        {hasSelection && addonTabs.length > 0 && (
          <div className="mt-7 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-cut-gold/10 flex items-center justify-center">
                <Plus className="w-3 h-3 text-cut-gold" />
              </div>
              <h4 className="font-heading font-bold text-sm text-gray-800">{t("service.addonsTitle")}</h4>
            </div>
            <p className="text-gray-400 text-[11px] mb-4 ms-8">{t("service.addonsHint")}</p>

            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {addonTabs.map(tab => {
                const isActive = effectiveAddonTab === tab.key;
                const TabIcon = TAB_ICONS[tab.key];
                const count = addonGrouped[tab.key].length;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveAddonTab(tab.key)}
                    className={`
                      flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer min-h-[36px]
                      ${isActive
                        ? "bg-cut-gold text-black shadow-sm shadow-cut-gold/20"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }
                    `}
                  >
                    <TabIcon className="w-3 h-3" />
                    {t(tab.labelKey)}
                    {!isActive && count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[9px] leading-4 text-center inline-block">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {(addonGrouped[effectiveAddonTab] ?? []).map(s => (
                <UpsellCard
                  key={`addon-${s.id}`}
                  service={s}
                  isSelected={selectedIds.includes(s.id)}
                  onToggle={() => onToggleService(s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom summary */}
      {onContinue && (
        <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-100 bg-cut-ivory/95 backdrop-blur-sm px-5 md:px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          {selectedCount > 0 && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-gray-500 text-xs">
                {selectedCount}{" "}
                {selectedCount === 1 ? t("service.countOne") : t("service.countMany")}
                {" · "}
                {format.duration(totalDuration)}
              </span>
              <span className="text-cut-gold font-bold text-sm">{format.price(totalPrice)}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onContinue}
            disabled={selectedCount === 0}
            className="w-full py-3.5 rounded-xl bg-cut-gold text-black font-bold hover:bg-[#C4A030] transition-colors shadow-md shadow-cut-gold/20 disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
          >
            {t("actions.continue")}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingServiceSelect;
