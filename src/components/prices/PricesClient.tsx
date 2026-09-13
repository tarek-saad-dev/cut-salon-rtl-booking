"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ArrowUpLeft, Check, ChevronLeft, ListOrdered, Scissors, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/lib/i18n/types";
import { getServiceCatalog, type ServiceCatalogCategory } from "@/lib/serviceCatalogApi";
import { getPackages, type ApiPackage } from "@/lib/packagesApi";
import {
  normalizeServiceSteps,
  serviceCatalogHasSteps,
  type ServiceStep,
} from "@/lib/serviceStepsApi";
import GroomExperienceBuilder from "@/components/prices/GroomExperienceBuilder";
import ServiceStepsSheet, { type ServiceStepsTarget } from "@/components/prices/ServiceStepsSheet";

type Localized = Record<Language, string>;
type Service = {
  id: string;
  name: Localized;
  subtitle?: Localized;
  price: number;
  from?: boolean;
  durationMinutes?: number | null;
  hasSteps?: boolean;
  steps?: ServiceStep[];
};

/** Fallback until catalog exposes hasSteps / stepCount from the public API. */
const KNOWN_STEPPED_SERVICE_IDS = new Set(["11", "12", "1079"]);
type PriceSectionData = { id: string; title: Localized; label: Localized; watermark: Localized; description: Localized; theme: "light" | "dark"; services: Service[]; sortOrder?: number }; 
type Package = { name: Localized; description: Localized; price: number; items: Localized[] };
type GroomPackage = Package & { tag: Localized; featured?: boolean };
type Addon = { name: Localized; price: number };

const t = (value: Localized, language: Language) => value[language];
const localizedCatalogName = (category: ServiceCatalogCategory, language: Language) => category.name || (language === "ar" ? "الخدمات" : "Services");
const catalogTypeLabel = (category: ServiceCatalogCategory) => category.type?.toUpperCase() || "SERVICES";
const formatPrice = (price: number, language: Language, options?: { from?: boolean; prefix?: boolean }) => {
  const amount = new Intl.NumberFormat("en-US").format(price);
  const value = language === "ar" ? `${amount} ج.م` : `EGP ${amount}`;
  const prefixed = options?.prefix ? `+${value}` : value;
  return options?.from ? (language === "ar" ? `يبدأ من ${prefixed}` : `From ${prefixed}`) : prefixed;
};

const priceSections: PriceSectionData[] = [
  { id: "haircut", title: { ar: "قص شعر", en: "Haircuts" }, label: { ar: "THE CUT", en: "THE CUT" }, watermark: { ar: "قص شعر", en: "HAIRCUTS" }, description: { ar: "تفاصيل دقيقة وقصة مصممة على ملامحك وروتينك.", en: "Precision cuts tailored to your features, routine, and personal style." }, theme: "light", services: [
    { id: "classic-cut", name: { ar: "قص شعر كلاسيك", en: "Classic Haircut" }, subtitle: { ar: "استشارة، غسيل وتصفيف", en: "Consultation, wash, and styling" }, price: 350 },
    { id: "cut-wash", name: { ar: "قص شعر + غسيل", en: "Haircut + Wash" }, subtitle: { ar: "قص متقن مع عناية كاملة", en: "A precise cut with complete care" }, price: 400 },
    { id: "kids-cut", name: { ar: "قص شعر للأطفال", en: "Kids' Haircut" }, subtitle: { ar: "حتى 12 سنة", en: "For guests up to 12 years old" }, price: 250 },
    { id: "edge-up", name: { ar: "تحديد الجوانب", en: "Edge Up" }, subtitle: { ar: "تنظيف سريع بين المواعيد", en: "A quick clean-up between appointments" }, price: 150 },
  ] },
  { id: "beard", title: { ar: "ذقن", en: "Beard" }, label: { ar: "THE BEARD", en: "THE BEARD" }, watermark: { ar: "ذقن", en: "BEARD" }, description: { ar: "تحديد نظيف يحافظ على شكل الذقن ويكمل اللوك.", en: "Clean definition that preserves your beard shape and completes the look." }, theme: "dark", services: [
    { id: "beard-shape", name: { ar: "تحديد ذقن", en: "Beard Shape" }, subtitle: { ar: "ماكينة وشفرة للحواف الدقيقة", en: "Clipper and razor for precise lines" }, price: 250 },
    { id: "full-shave", name: { ar: "حلاقة ذقن كاملة", en: "Full Beard Shave" }, subtitle: { ar: "منشفة ساخنة وشفرة", en: "Hot towel and razor finish" }, price: 300 },
    { id: "cut-beard", name: { ar: "قص شعر + تحديد ذقن", en: "Haircut + Beard Shape" }, subtitle: { ar: "الاختيار اليومي المتكامل", en: "The complete everyday choice" }, price: 550 },
    { id: "beard-care", name: { ar: "ماسك وعناية للذقن", en: "Beard Care Mask" }, subtitle: { ar: "ترطيب وتهدئة للبشرة", en: "Hydration and skin soothing" }, price: 180 },
  ] },
  { id: "hair-care", title: { ar: "عناية بالشعر", en: "Hair Care" }, label: { ar: "HAIR CARE", en: "HAIR CARE" }, watermark: { ar: "عناية", en: "CARE" }, description: { ar: "خطوات بسيطة تترك الشعر أنظف، أقوى وأسهل في التصفيف.", en: "Focused care that leaves hair cleaner, stronger, and easier to style." }, theme: "light", services: [
    { id: "wash-style", name: { ar: "غسيل وتصفيف", en: "Wash + Style" }, subtitle: { ar: "منتجات مختارة لنوع شعرك", en: "Products selected for your hair type" }, price: 200 },
    { id: "cream-bath", name: { ar: "حمام كريم", en: "Cream Treatment" }, subtitle: { ar: "ترطيب عميق ولمعة طبيعية", en: "Deep hydration with a natural shine" }, price: 300 },
    { id: "scalp-cleanse", name: { ar: "تنظيف فروة الرأس", en: "Scalp Cleanse" }, subtitle: { ar: "تقشير خفيف وانتعاش", en: "Gentle exfoliation and refreshment" }, price: 350 },
    { id: "loss-care", name: { ar: "علاج تساقط داعم", en: "Hair Loss Care" }, subtitle: { ar: "جلسة عناية مركزة", en: "A focused care session" }, price: 450 },
  ] },
  { id: "treatments", title: { ar: "تنعيم / علاجات", en: "Smoothing + Treatments" }, label: { ar: "TREATMENTS", en: "TREATMENTS" }, watermark: { ar: "علاجات", en: "TREATMENTS" }, description: { ar: "علاجات احترافية موجهة للحالة الفعلية لشعرك.", en: "Professional treatments guided by your hair's actual condition." }, theme: "dark", services: [
    { id: "keratin", name: { ar: "جلسة كيراتين", en: "Keratin Session" }, subtitle: { ar: "السعر حسب طول وكثافة الشعر", en: "Pricing depends on hair length and density" }, price: 1200, from: true },
    { id: "protein", name: { ar: "جلسة بروتين", en: "Protein Session" }, subtitle: { ar: "نتيجة ناعمة ومظهر طبيعي", en: "A smooth result with a natural finish" }, price: 1000, from: true },
    { id: "botox", name: { ar: "بوتوكس الشعر", en: "Hair Botox" }, subtitle: { ar: "ترميم ولمعان مكثف", en: "Intensive repair and shine" }, price: 1300, from: true },
    { id: "repair", name: { ar: "علاج ترميم مركز", en: "Intensive Repair" }, subtitle: { ar: "للشعر المجهد والمتضرر", en: "For stressed and damaged hair" }, price: 650 },
  ] },
  { id: "color", title: { ar: "ألوان الشعر", en: "Hair Color" }, label: { ar: "HAIR COLOR", en: "HAIR COLOR" }, watermark: { ar: "ألوان", en: "COLOR" }, description: { ar: "لون محسوب بعناية، من الهايلايت الهادئ إلى التحولات الجريئة.", en: "Considered color, from soft highlights to a bolder transformation." }, theme: "light", services: [
    { id: "grey-cover", name: { ar: "تغطية الشيب", en: "Grey Coverage" }, subtitle: { ar: "لون طبيعي ومتجانس", en: "Natural, even color" }, price: 500 },
    { id: "highlights", name: { ar: "هايلايت خفيف", en: "Soft Highlights" }, subtitle: { ar: "تفاصيل لونية تمنح بعدًا للوك", en: "Dimension-building color details" }, price: 900, from: true },
    { id: "lightening", name: { ar: "تفتيح كامل", en: "Full Lightening" }, subtitle: { ar: "يشمل الاستشارة وخطة العناية", en: "Includes a consultation and care plan" }, price: 1500, from: true },
    { id: "beard-color", name: { ar: "تفصيل لون اللحية", en: "Beard Color Detail" }, subtitle: { ar: "تعديل بسيط بدقة", en: "A precise, subtle adjustment" }, price: 150 },
  ] },
  { id: "skincare", title: { ar: "عناية بالبشرة", en: "Skin Care" }, label: { ar: "SKIN CARE", en: "SKIN CARE" }, watermark: { ar: "بشرة", en: "SKIN" }, description: { ar: "استراحة هادئة لبشرة أكثر صفاءً ومظهر أكثر حيوية.", en: "A quiet reset for clearer, more energized-looking skin." }, theme: "dark", services: [
    { id: "quick-cleanse", name: { ar: "تنظيف بشرة سريع", en: "Quick Skin Cleanse" }, subtitle: { ar: "تنقية وترطيب أساسي", en: "Essential cleansing and hydration" }, price: 350 },
    { id: "deep-facial", name: { ar: "فاشيال عميق", en: "Deep Facial" }, subtitle: { ar: "تنظيف، بخار وماسك مناسب", en: "Cleanse, steam, and tailored mask" }, price: 600 },
    { id: "charcoal-mask", name: { ar: "ماسك الفحم", en: "Charcoal Mask" }, subtitle: { ar: "للمسام والمظهر المرهق", en: "For pores and tired-looking skin" }, price: 250 },
    { id: "luxury-care", name: { ar: "جلسة عناية فاخرة", en: "Luxury Skin Session" }, subtitle: { ar: "فاشيال كامل مع مساج وجه", en: "Complete facial with face massage" }, price: 850 },
  ] },
  { id: "wax", title: { ar: "واكس", en: "Wax" }, label: { ar: "WAXING", en: "WAXING" }, watermark: { ar: "واكس", en: "WAX" }, description: { ar: "تنظيف دقيق للمناطق الصغيرة بلمسة احترافية.", en: "Precise grooming for the small details, handled professionally." }, theme: "light", services: [
    { id: "nose-wax", name: { ar: "واكس أنف", en: "Nose Wax" }, price: 100 },
    { id: "ear-wax", name: { ar: "واكس أذن", en: "Ear Wax" }, price: 100 },
    { id: "nose-ear", name: { ar: "واكس أنف وأذن", en: "Nose + Ear Wax" }, subtitle: { ar: "تنظيف كامل وسريع", en: "A quick, complete clean-up" }, price: 180 },
    { id: "face-wax", name: { ar: "واكس وجه", en: "Face Wax" }, subtitle: { ar: "للمناطق المحددة", en: "For selected areas" }, price: 250 },
  ] },
  { id: "extras", title: { ar: "إضافات", en: "Extras" }, label: { ar: "THE DETAILS", en: "THE DETAILS" }, watermark: { ar: "تفاصيل", en: "DETAILS" }, description: { ar: "اللمسات الأخيرة التي تجعل النتيجة مكتملة.", en: "The finishing details that make the result feel complete." }, theme: "dark", services: [
    { id: "extra-style", name: { ar: "تصفيف إضافي", en: "Extra Styling" }, subtitle: { ar: "ستايل خاص للمناسبة", en: "A special style for the occasion" }, price: 200 },
    { id: "wash-only", name: { ar: "غسيل فقط", en: "Wash Only" }, subtitle: { ar: "غسيل احترافي ومنتجات مناسبة", en: "Professional wash with fitting products" }, price: 150 },
    { id: "look-consultation", name: { ar: "استشارة تغيير لوك", en: "Look Change Consultation" }, subtitle: { ar: "خطة واضحة قبل التغيير", en: "A clear plan before the change" }, price: 150 },
    { id: "hot-towels", name: { ar: "مناشف ساخنة", en: "Hot Towels" }, subtitle: { ar: "إضافة مريحة لأي خدمة", en: "A comfortable addition to any service" }, price: 100 },
  ] },
];

const packageName = (item: ApiPackage, language: Language) => (language === "ar" ? item.nameAr ?? item.nameEn : item.nameEn ?? item.nameAr) ?? "";
const includeName = (item: ApiPackage["includes"][number], language: Language) => (language === "ar" ? item.nameAr ?? item.name ?? item.nameEn : item.nameEn ?? item.name ?? item.nameAr) ?? "";

const groomPackages: GroomPackage[] = [
  { name: { ar: "Essential", en: "Essential" }, description: { ar: "الأساسيات", en: "Essentials" }, tag: { ar: "الأساسيات", en: "Essentials" }, price: 1250, items: [{ ar: "قص شعر", en: "Haircut" }, { ar: "تحديد ذقن", en: "Beard shape" }, { ar: "غسيل وتصفيف", en: "Wash and style" }] },
  { name: { ar: "Signature", en: "Signature" }, description: { ar: "الاختيار الأمثل ليومك الكبير.", en: "The defining choice for your big day." }, tag: { ar: "الأكثر طلبًا", en: "Most Popular" }, price: 1650, featured: true, items: [{ ar: "قص شعر", en: "Haircut" }, { ar: "تحديد ذقن", en: "Beard shape" }, { ar: "فاشيال عميق", en: "Deep facial" }, { ar: "عناية للشعر", en: "Hair care" }, { ar: "تصفيف نهائي", en: "Final styling" }] },
  { name: { ar: "Complete", en: "Complete" }, description: { ar: "التجربة الكاملة", en: "Complete Experience" }, tag: { ar: "التجربة الكاملة", en: "Complete Experience" }, price: 2100, items: [{ ar: "كل مزايا Signature", en: "Everything in Signature" }, { ar: "باديكير", en: "Pedicure" }, { ar: "ماسك للذقن", en: "Beard mask" }, { ar: "لمسات لون خفيفة", en: "Light color detail" }] },
];

const addOns: Addon[] = [
  { name: { ar: "تفاصيل لون للشعر", en: "Hair Detail Color" }, price: 150 },
  { name: { ar: "جلسة استرخاء", en: "Relax Session" }, price: 200 },
  { name: { ar: "باديكير", en: "Pedicure" }, price: 400 },
  { name: { ar: "علاج بروتين", en: "Protein Treatment" }, price: 1000 },
];

function ServiceRow({
  service,
  language,
  dark,
  onOpenSteps,
}: {
  service: Service;
  language: Language;
  dark: boolean;
  onOpenSteps?: (service: Service) => void;
}) {
  const ar = language === "ar";
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b py-5 last:border-b-0 md:gap-8 md:py-6 ${
        dark ? "border-cut-warm-beige/20" : "border-cut-bronze/30"
      }`}
    >
      <div className="min-w-0 text-start">
        <h3 className="text-[1.05rem] font-bold tracking-tight md:text-xl">{t(service.name, language)}</h3>
        {service.subtitle && (
          <p className={`mt-1.5 text-sm leading-6 ${dark ? "text-cut-ivory/65" : "text-cut-black/65"}`}>
            {t(service.subtitle, language)}
          </p>
        )}
        {service.hasSteps && onOpenSteps ? (
          <button
            type="button"
            onClick={() => onOpenSteps(service)}
            className={`mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition ${
              dark
                ? "border-cut-bronze/40 bg-cut-bronze/10 text-cut-warm-beige hover:bg-cut-bronze/20"
                : "border-cut-burgundy/25 bg-cut-burgundy/[0.06] text-cut-burgundy hover:bg-cut-burgundy/10"
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            {ar ? "المراحل والتفاصيل" : "Stages & details"}
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3 md:gap-5">
        <span
          aria-hidden="true"
          className={`hidden h-px w-8 bg-gradient-to-l md:block ${dark ? "from-cut-bronze/70 to-transparent" : "from-cut-bronze/80 to-transparent"}`}
        />
        <p
          className={`whitespace-nowrap rounded-md border px-3 py-2 text-base font-black tabular-nums md:px-4 md:text-lg ${
            dark
              ? "border-cut-bronze/35 bg-cut-bronze/10 text-cut-warm-beige"
              : "border-cut-bronze/45 bg-cut-warm-paper text-cut-burgundy"
          }`}
        >
          {formatPrice(service.price, language, { from: service.from })}
        </p>
      </div>
    </div>
  );
}

function PriceSection({
  section,
  language,
  onOpenSteps,
}: {
  section: PriceSectionData;
  language: Language;
  onOpenSteps?: (service: Service) => void;
}) {
  const dark = section.theme === "dark";
  return (
    <section
      id={section.id}
      data-sort={section.sortOrder}
      className={`relative isolate scroll-mt-32 overflow-hidden ${
        dark
          ? "bg-[linear-gradient(135deg,#050505_0%,#170406_100%)] text-cut-ivory"
          : "bg-cut-soft-ivory text-cut-black"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-px ${dark ? "bg-cut-warm-beige/20" : "bg-cut-bronze/35"}`} />
      <p
        aria-hidden
        className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(5rem,17vw,14rem)] font-black leading-none tracking-tight ${
          dark ? "text-cut-ivory/[0.025]" : "text-cut-burgundy/[0.035]"
        }`}
      >
        {t(section.watermark, language)}
      </p>
      <div className="container relative z-10 px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-24">
          <div className="lg:pt-2">
            <div className="flex items-center gap-3">
              <span className={`h-px w-10 ${dark ? "bg-cut-bronze" : "bg-cut-burgundy"}`} />
              <p className={`font-display text-xs tracking-[0.3em] ${dark ? "text-cut-bronze" : "text-cut-burgundy"}`}>
                {t(section.label, language)}
              </p>
            </div>
            <h2
              className={`mt-4 text-4xl font-black tracking-tight md:text-6xl ${
                language === "en" ? "font-editorial font-semibold" : ""
              }`}
            >
              {t(section.title, language)}
            </h2>
            <p className={`mt-5 max-w-sm text-base leading-8 ${dark ? "text-cut-ivory/70" : "text-cut-black/70"}`}>
              {t(section.description, language)}
            </p>
          </div>
          <div className={`self-end border-t ${dark ? "border-cut-warm-beige/20" : "border-cut-bronze/30"}`}>
            {section.services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                language={language}
                dark={dark}
                onOpenSteps={onOpenSteps}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StickyCategoryNav({ language, sections }: { language: Language; sections: PriceSectionData[] }) {
  const nav = sections.map((section) => ({ id: section.id, label: section.title })).concat([{ id: "packages", label: { ar: "الباقات", en: "Packages" } }, { id: "groom", label: { ar: "العريس", en: "Groom" } }]);
  return <nav aria-label={language === "ar" ? "تنقل سريع في قائمة الأسعار" : "Price list quick navigation"} className="sticky top-0 z-40 border-y border-cut-bronze/20 bg-cut-black/95 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl"><div className="scrollbar-hide mx-auto flex max-w-[1200px] divide-x divide-x-reverse divide-cut-bronze/20 overflow-x-auto px-4 md:px-6">{nav.map((item) => <a key={item.id} href={`#${item.id}`} className="shrink-0 px-3 py-2 text-xs font-bold text-cut-ivory/70 transition hover:bg-cut-burgundy/35 hover:text-cut-warm-beige focus:bg-cut-burgundy/35 focus:text-cut-warm-beige focus:outline-none md:px-5">{t(item.label, language)}</a>)}</div></nav>;
}

function SoonNotice({ language, label }: { language: Language; label?: string }) {
  const ar = language === "ar";
  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-cut-bronze/35 bg-cut-black/30 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cut-bronze/45 bg-cut-burgundy/25">
        <Sparkles className="h-5 w-5 text-cut-bronze" />
      </span>
      <p className="font-editorial text-2xl font-semibold text-cut-warm-beige">{ar ? "قريبًا" : "Soon"}</p>
      <p className="max-w-sm text-sm leading-7 text-cut-ivory/60">{label ?? (ar ? "هنضيف الباقات هنا قريبًا." : "Packages will be added here soon.")}</p>
    </div>
  );
}

function PackageCard({ item, language }: { item: ApiPackage; language: Language }) {
  return <article className="group relative flex h-full flex-col overflow-hidden bg-cut-soft-black p-6 text-cut-ivory transition hover:bg-cut-wine-black md:p-8"><span aria-hidden className="absolute left-0 top-0 h-16 w-px bg-cut-bronze/80" /><div className="flex items-start justify-between gap-4"><div><p className="font-display text-[11px] tracking-[0.28em] text-cut-bronze">CUT EDIT</p><h3 className={`mt-4 text-2xl font-black ${language === "en" ? "font-editorial font-semibold" : ""}`}>{packageName(item, language)}</h3></div><p className="flex flex-col items-end whitespace-nowrap"><span className="rounded-md border border-cut-bronze/35 bg-cut-bronze/10 px-3 py-2 text-base font-black text-cut-warm-beige">{formatPrice(item.price, language)}</span>{!!item.originalPrice && item.originalPrice > item.price && <span className="mt-1 text-xs text-cut-ivory/45 line-through">{formatPrice(item.originalPrice, language)}</span>}</p></div><p className="mt-4 min-h-12 text-sm leading-7 text-cut-ivory/65">{item.durationMinutes ? (language === "ar" ? `${item.durationMinutes} دقيقة` : `${item.durationMinutes} min`) : ""}</p><ul className="mt-6 space-y-2.5 border-t border-cut-ivory/10 pt-5 text-sm text-cut-ivory/80">{item.includes.map((service) => <li key={service.serviceId} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cut-bronze" />{includeName(service, language)}</li>)}</ul><a href="/#barbers" className="mt-8 inline-flex items-center gap-1 self-start text-sm font-bold text-cut-warm-beige transition hover:text-cut-ivory">{language === "ar" ? "احجز الباكدج" : "Book package"}{language === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</a></article>;
}

function GroomPackageCard({ item, language }: { item: GroomPackage; language: Language }) {
  return <article className={`relative flex h-full flex-col overflow-hidden border p-6 transition duration-300 md:p-8 ${item.featured ? "z-10 border-cut-bronze bg-[linear-gradient(155deg,#4A000F_0%,#170406_55%,#050505_100%)] text-cut-ivory shadow-cut-glow-strong lg:-my-3 lg:scale-[1.035]" : "border-cut-bronze/35 bg-cut-warm-paper text-cut-black hover:border-cut-bronze/70"}`}>{item.featured && <><div className="absolute inset-x-0 top-0 h-px bg-cut-warm-beige/80" /><span className="absolute left-5 top-5 rounded-full border border-cut-black/10 bg-cut-bronze px-3 py-1 text-xs font-black text-cut-black">{t(item.tag, language)}</span></>}<p className={`font-display text-xs tracking-[0.27em] ${item.featured ? "text-cut-warm-beige" : "text-cut-burgundy"}`}>GROOM PACKAGE</p><h3 className="mt-4 font-editorial text-4xl font-semibold">{t(item.name, language)}</h3><p className={`mt-2 text-sm font-bold ${item.featured ? "text-cut-ivory/75" : "text-cut-black/65"}`}>{t(item.tag, language)}</p><p className={`mt-7 text-3xl font-black tabular-nums ${item.featured ? "text-cut-warm-beige" : "text-cut-burgundy"}`}>{formatPrice(item.price, language)}</p><ul className={`mt-7 flex-1 space-y-3 border-t pt-5 text-sm ${item.featured ? "border-cut-ivory/15 text-cut-ivory/80" : "border-cut-bronze/30 text-cut-black/75"}`}>{item.items.map((benefit) => <li key={t(benefit, language)} className="flex items-center gap-2"><Check className={`h-4 w-4 ${item.featured ? "text-cut-bronze" : "text-cut-burgundy"}`} />{t(benefit, language)}</li>)}</ul><a href="/#barbers" className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition ${item.featured ? "bg-cut-ivory text-cut-black hover:bg-cut-soft-ivory" : "bg-cut-black text-cut-ivory hover:bg-cut-burgundy"}`}>{language === "ar" ? "احجز الباكدج" : "Book package"}{language === "ar" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</a></article>;
}

function AddonCard({ item, language }: { item: Addon; language: Language }) {
  return <article className="group border border-cut-bronze/30 bg-cut-soft-black p-5 text-cut-ivory transition hover:border-cut-bronze/60 hover:bg-cut-wine-black"><div className="flex items-start justify-between gap-3"><p className="font-display text-xs tracking-[0.12em] text-cut-bronze">{language === "ar" ? item.name.en : item.name.ar}</p><span className="h-2 w-2 rounded-full bg-cut-bronze/70" /></div><div className="mt-6 flex items-end justify-between gap-3 border-t border-cut-ivory/10 pt-4"><h3 className="text-sm font-bold">{t(item.name, language)}</h3><p className="whitespace-nowrap text-base font-black text-cut-warm-beige">{formatPrice(item.price, language, { prefix: true })}</p></div></article>;
}

export default function PricesClient() {
  const { lang: language } = useLanguage();
  const [stepsTarget, setStepsTarget] = useState<ServiceStepsTarget | null>(null);
  const { data: categories = [], isPending, isError } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: getServiceCatalog,
    staleTime: 60_000,
  });
  const { data: regularPackages = [], isPending: isPackagesPending, isError: isPackagesError } = useQuery({
    queryKey: ["packages", "regular"],
    queryFn: () => getPackages("regular"),
    staleTime: 60_000,
  });
  const catalogSections: PriceSectionData[] = categories.map((category, index) => ({
    id: `category-${category.id}`,
    title: { ar: localizedCatalogName(category, "ar"), en: localizedCatalogName(category, "en") },
    label: { ar: catalogTypeLabel(category), en: catalogTypeLabel(category) },
    watermark: { ar: localizedCatalogName(category, "ar"), en: localizedCatalogName(category, "en").toUpperCase() },
    description: { ar: "خدمات مختارة بعناية لتكمل تجربتك في CUT Salon.", en: "Carefully selected services to complete your CUT Salon experience." },
    theme: index % 2 === 0 ? "light" : "dark",
    sortOrder: category.sortOrder,
    services: category.services.map((service) => {
      const steps = Array.isArray(service.steps) ? normalizeServiceSteps(service.steps) : undefined;
      const hasSteps =
        serviceCatalogHasSteps(service) || KNOWN_STEPPED_SERVICE_IDS.has(String(service.id));
      return {
        id: String(service.id),
        name: { ar: service.nameAr || service.nameEn || "خدمة", en: service.nameEn || service.nameAr || "Service" },
        price: service.price,
        durationMinutes: service.durationMinutes,
        hasSteps,
        steps: steps?.length ? steps : undefined,
      };
    }),
  }));
  const ar = language === "ar";
  const sideBorder = ar ? "border-r pr-5 md:pr-8" : "border-l pl-5 md:pl-8";
  const arrow = ar ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />;
  const openServiceSteps = (service: Service) => {
    setStepsTarget({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
      steps: service.steps,
    });
  };
  return <main className={`overflow-x-clip bg-cut-black ${ar ? "font-body" : "font-body"}`} dir={ar ? "rtl" : "ltr"}>
    <section className="hero-gradient cut-grain relative isolate min-h-[640px] overflow-hidden bg-[radial-gradient(circle_at_78%_26%,rgba(117,8,31,0.82),transparent_23%),radial-gradient(circle_at_26%_92%,rgba(74,0,15,0.78),transparent_33%)] max-lg:-mt-[var(--cut-mobile-nav-total)] max-lg:pt-[calc(var(--cut-mobile-nav-total)+1rem)] pt-32 text-cut-ivory md:min-h-[760px] md:pt-44" data-mobile-nav-overlay><div className="absolute -right-24 top-14 h-[29rem] w-[29rem] rounded-full border border-cut-bronze/25 bg-cut-burgundy/35 blur-3xl" /><div className="absolute right-[12%] top-[18%] h-40 w-40 rotate-45 border border-cut-warm-beige/20" /><div className="absolute inset-y-0 right-[18%] hidden w-px bg-gradient-to-b from-transparent via-cut-bronze/65 to-transparent md:block" /><div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,5,0.78)_0%,rgba(23,4,6,0.48)_48%,rgba(74,0,15,0.16)_100%)]" /><div className="absolute inset-0 cut-vignette" /><div className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-cut-bronze/20 md:h-[30rem] md:w-[30rem]" /><p aria-hidden className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[clamp(4.5rem,17vw,14rem)] font-bold leading-none text-cut-ivory/[0.035]">PRICE LIST</p><div className="container relative z-10 px-5 pb-16 md:px-8"><div className={`max-w-3xl border-cut-bronze/45 ${sideBorder}`}><div className="mb-7 flex items-center gap-3 text-cut-warm-beige"><span className="h-2 w-2 rounded-full bg-cut-bronze shadow-[0_0_18px_rgba(229,188,134,0.8)]" /><span className="h-px w-10 bg-current" /><span className="font-display text-xs tracking-[0.35em]">CUT SALON / 2026</span></div><h1 className={`text-5xl font-black leading-[1.05] tracking-tight drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] sm:text-6xl md:text-8xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "قائمة الأسعار" : "Price List"}</h1><p className="mt-7 max-w-xl text-lg leading-9 text-cut-ivory/80 md:text-xl">{ar ? "خدمات CUT Salon — الأسعار، الباقات، وتجهيز العريس" : "CUT Salon services — prices, packages, and groom preparation"}</p><div className="mt-10 flex flex-col gap-3 sm:flex-row"><a href="/#barbers" className="inline-flex min-h-12 items-center justify-center gap-2 bg-cut-ivory px-6 py-3.5 font-bold text-cut-black transition hover:bg-cut-soft-ivory">{ar ? "احجز الآن" : "Book Now"}{arrow}</a><a href="#groom" className="inline-flex min-h-12 items-center justify-center gap-2 border border-cut-bronze/50 px-6 py-3.5 font-bold text-cut-ivory transition hover:border-cut-warm-beige hover:bg-cut-burgundy/40">{ar ? "شوف باكدجات العريس" : "View Groom Packages"}<ChevronLeft className={`h-4 w-4 ${ar ? "" : "rotate-180"}`} /></a></div></div></div></section>
    <StickyCategoryNav language={language} sections={catalogSections} />
    {isPending && <section className="bg-cut-soft-ivory px-5 py-24 text-center text-cut-black"><p className="font-display text-sm tracking-[0.2em] text-cut-burgundy">{ar ? "جارٍ تحميل الخدمات" : "LOADING SERVICES"}</p></section>}
    {isError && <section className="bg-cut-soft-ivory px-5 py-24 text-center text-cut-black"><p className="text-lg font-bold">{ar ? "تعذّر تحميل قائمة الخدمات حاليًا." : "The service list is unavailable right now."}</p></section>}
    {catalogSections.map((section) => (
      <PriceSection
        key={section.id}
        section={section}
        language={language}
        onOpenSteps={openServiceSteps}
      />
    ))}
    <ServiceStepsSheet
      open={Boolean(stepsTarget)}
      onClose={() => setStepsTarget(null)}
      service={stepsTarget}
      language={language}
    />
    <section id="packages" className="relative isolate scroll-mt-32 overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(74,0,15,0.48),transparent_34%),#170406] py-20 text-cut-ivory md:py-28"><div className="absolute inset-x-0 top-0 h-px bg-cut-bronze/35" /><p aria-hidden className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(5rem,18vw,14rem)] font-black text-cut-ivory/[0.03]">{ar ? "الباقات" : "PACKAGES"}</p><div className="container relative z-10 px-5 md:px-8"><div className={`flex flex-col gap-6 border-cut-bronze/35 md:flex-row md:items-end md:justify-between ${sideBorder}`}><div className="max-w-2xl"><p className="cut-editorial-label">CURATED EXPERIENCES</p><h2 className={`mt-3 text-4xl font-black md:text-5xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "الباقات" : "Packages"}</h2><p className="mt-4 text-base leading-8 text-cut-ivory/70">{ar ? "اختيارات مختصرة تجمع أكثر الخدمات طلبًا في تجربة واحدة متوازنة." : "Considered combinations that bring our most-requested services into one balanced experience."}</p></div><p className="font-display text-sm tracking-[0.28em] text-cut-bronze">THREE WAYS TO RESET</p></div>{isPackagesPending && <p className="mt-10 text-sm text-cut-ivory/60">{ar ? "جارٍ تحميل الباقات..." : "Loading packages..."}</p>}{isPackagesError && <p className="mt-10 text-sm text-cut-ivory/60">{ar ? "تعذّر تحميل الباقات حاليًا." : "Unable to load packages right now."}</p>}{!isPackagesPending && !isPackagesError && regularPackages.length === 0 && <SoonNotice language={language} />}{!isPackagesPending && !isPackagesError && regularPackages.length > 0 && <div className="mt-10 grid gap-px border border-cut-bronze/25 bg-cut-bronze/25 md:grid-cols-3">{regularPackages.map((item) => <PackageCard key={item.packageId} item={item} language={language} />)}</div>}</div></section>
    <GroomExperienceBuilder language={language} />
    <section id="groom-legacy" className="hidden relative isolate scroll-mt-32 overflow-hidden bg-cut-black py-20 text-cut-ivory md:py-28"><div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_45%,rgba(74,0,15,0.72),transparent_38%)]" /><div className="absolute inset-5 border border-cut-bronze/15 md:inset-8" /><p aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(6rem,22vw,18rem)] font-black leading-none text-cut-ivory/[0.03]">{ar ? "العريس" : "GROOM"}</p><div className="container relative z-10 px-5 md:px-8"><div className="grid items-end gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-20"><div><p className="cut-editorial-label">THE GROOM EDIT</p><h2 className={`mt-3 text-5xl font-black md:text-7xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "باكدج العريس" : "Groom Package"}</h2><p className="mt-5 text-xl text-cut-warm-beige">{ar ? "تجهيز متكامل ليوم يليق بك" : "A complete preparation for your big day"}</p><p className="mt-6 max-w-xl leading-8 text-cut-ivory/70">{ar ? "كل التفاصيل محسوبة، من قصة الشعر وحتى الفينيش الأخير، لتدخل يومك الكبير بأفضل نسخة منك." : "Every detail considered, from the cut to the final finish, so you arrive as your best self."}</p></div><div className={`border-cut-bronze/45 ${sideBorder}`}><p className="font-display text-sm tracking-[0.25em] text-cut-bronze">GROOM SIGNATURE</p><p className="mt-5 text-4xl font-black text-cut-warm-beige">{formatPrice(1650, language)}</p><p className="mt-4 leading-7 text-cut-ivory/75">{ar ? "قصة، ذقن، فاشيال، عناية للشعر وتصفيف نهائي في جلسة مصممة لك." : "Haircut, beard shape, facial, hair care, and final styling in one tailored session."}</p><a href="/#barbers" className="mt-7 inline-flex min-h-12 items-center gap-2 bg-cut-bronze px-5 py-3 text-sm font-bold text-cut-black transition hover:bg-cut-warm-beige">{ar ? "احجز الباكدج" : "Book package"}{arrow}</a></div></div><div className="mt-14 grid gap-4 lg:grid-cols-3">{groomPackages.map((item) => <GroomPackageCard key={t(item.name, language)} item={item} language={language} />)}</div></div></section>
    <section className="hidden relative overflow-hidden bg-cut-ivory py-20 text-cut-black md:py-28"><div className="absolute inset-x-0 top-0 h-px bg-cut-bronze/30" /><div className="container relative px-5 md:px-8"><div className={`flex flex-col justify-between gap-5 border-cut-bronze/55 sm:flex-row sm:items-end ${sideBorder}`}><div><p className="font-display text-xs tracking-[0.3em] text-cut-burgundy">FINISHING TOUCHES</p><h2 className={`mt-3 text-4xl font-black md:text-5xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "إضافات العريس" : "Groom Add-ons"}</h2><p className="mt-3 text-cut-black/65">{ar ? "لمسات تكمّل اللوك" : "Finishing touches for your look"}</p></div><Scissors className="h-10 w-10 text-cut-bronze" strokeWidth={1} /></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{addOns.map((item) => <AddonCard key={t(item.name, language)} item={item} language={language} />)}</div></div></section>
    <section className="hidden relative overflow-hidden bg-cut-soft-black py-20 text-cut-ivory md:py-28"><div className="container px-5 md:px-8"><div className="grid overflow-hidden border border-cut-bronze/35 lg:grid-cols-2"><div className="relative min-h-[330px] overflow-hidden bg-gradient-to-bl from-cut-burgundy via-cut-wine-black to-cut-black p-8 md:p-12"><div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-cut-bronze/30" /><div className="absolute left-12 top-12 h-24 w-24 border border-cut-warm-beige/30" /><div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_49.7%,rgba(164,136,121,0.2)_50%,transparent_50.3%)]" /><div className="relative z-10 flex h-full flex-col justify-end"><Sparkles className="mb-5 h-8 w-8 text-cut-bronze" strokeWidth={1} /><p className="font-display text-5xl tracking-[0.12em] text-cut-ivory/90">ON LOCATION</p><p className="mt-2 text-sm text-cut-ivory/60">Private finishing service</p></div></div><div className="bg-cut-wine-black p-8 md:p-12"><p className="font-display text-xs tracking-[0.28em] text-cut-bronze">WEDDING LOCATION VISIT</p><h2 className={`mt-4 text-3xl font-black leading-tight md:text-4xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "تجهيز العريس في المنزل أو القاعة" : "Wedding Location Visit"}</h2><p className="mt-5 leading-8 text-cut-ivory/70">{ar ? "خدمة خاصة للفينيش الأخير قبل الفرح" : "A private finishing service before the wedding"}</p><ul className="mt-7 space-y-3 text-sm text-cut-ivory/85">{(ar ? ["تصفيف الشعر", "مراجعة الدقن", "لمسات نهائية للتصوير"] : ["Hair styling", "Beard review", "Final touches for photography"]).map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-cut-bronze" />{item}</li>)}</ul><div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-cut-ivory/10 pt-6"><div><p className="text-xl font-black text-cut-warm-beige">{ar ? "يبدأ من 1,500 ج.م" : "Starts from EGP 1,500"}</p><p className="mt-1 text-xs text-cut-ivory/55">{ar ? "حسب الموقع: 1,500 / 1,750 / 2,000" : "Depending on location: 1,500 / 1,750 / 2,000"}</p></div><a href="/#barbers" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-cut-warm-beige transition hover:text-cut-ivory">{ar ? "احجز الزيارة" : "Book the Visit"}{arrow}</a></div></div></div></div></section>
    <section className="relative overflow-hidden bg-cut-burgundy px-5 py-20 text-center text-cut-ivory md:py-28"><p aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[clamp(5rem,19vw,15rem)] font-bold text-cut-ivory/[0.05]">CUT</p><div className="relative z-10 mx-auto max-w-2xl"><p className="font-display text-xs tracking-[0.32em] text-cut-warm-beige">YOUR NEXT LOOK</p><h2 className={`mt-4 text-4xl font-black md:text-6xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "جاهز تختار تجربتك؟" : "Ready to choose your experience?"}</h2><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><a href="/#barbers" className="inline-flex min-h-12 items-center justify-center gap-2 bg-cut-ivory px-6 py-3.5 font-bold text-cut-black transition hover:bg-cut-soft-ivory">{ar ? "احجز الآن" : "Book Now"}{arrow}</a><a href="https://wa.me/201012126899" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-cut-ivory/45 px-6 py-3.5 font-bold transition hover:bg-cut-black/20">{ar ? "تواصل معنا" : "Contact Us"}<ArrowUpLeft className="h-4 w-4" /></a></div></div></section>
  </main>;
}
