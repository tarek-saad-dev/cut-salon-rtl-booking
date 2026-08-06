import type { Metadata } from "next";
import { ArrowLeft, ArrowUpLeft, Check, ChevronLeft, Scissors, Sparkles } from "lucide-react";
import FooterSection from "@/components/FooterSection";
import PricesClient from "@/components/prices/PricesClient";

export const metadata: Metadata = {
  title: "قائمة الأسعار | Cut Salon",
  description: "أسعار خدمات Cut Salon، الباقات، وتجهيز العريس.",
};

type Service = {
  name: string;
  price: string;
  description?: string;
};

type PriceCategory = {
  id: string;
  title: string;
  label: string;
  watermark: string;
  description: string;
  theme: "light" | "dark";
  services: Service[];
};

type Package = {
  name: string;
  description: string;
  price: string;
  items: string[];
};

type GroomPackage = Package & {
  tag: string;
  featured?: boolean;
};

type Addon = {
  name: string;
  arabicName: string;
  price: string;
};

const priceCategories: PriceCategory[] = [
  {
    id: "haircut",
    title: "قص شعر",
    label: "THE CUT",
    watermark: "قص شعر",
    description: "تفاصيل دقيقة وقصة مصممة على ملامحك وروتينك.",
    theme: "light",
    services: [
      { name: "قص شعر كلاسيك", description: "استشارة، غسيل وتصفيف", price: "350 ج.م" },
      { name: "قص شعر + غسيل", description: "قص متقن مع عناية كاملة", price: "400 ج.م" },
      { name: "قص شعر للأطفال", description: "حتى 12 سنة", price: "250 ج.م" },
      { name: "تحديد الجوانب", description: "تنظيف سريع بين المواعيد", price: "150 ج.م" },
    ],
  },
  {
    id: "beard",
    title: "ذقن",
    label: "THE BEARD",
    watermark: "ذقن",
    description: "تحديد نظيف يحافظ على شكل الذقن ويكمل اللوك.",
    theme: "dark",
    services: [
      { name: "تحديد ذقن", description: "ماكينة وشفرة للحواف الدقيقة", price: "250 ج.م" },
      { name: "حلاقة ذقن كاملة", description: "منشفة ساخنة وشفرة", price: "300 ج.م" },
      { name: "قص شعر + تحديد ذقن", description: "الاختيار اليومي المتكامل", price: "550 ج.م" },
      { name: "ماسك وعناية للذقن", description: "ترطيب وتهدئة للبشرة", price: "180 ج.م" },
    ],
  },
  {
    id: "hair-care",
    title: "عناية بالشعر",
    label: "HAIR CARE",
    watermark: "عناية",
    description: "خطوات بسيطة تترك الشعر أنظف، أقوى وأسهل في التصفيف.",
    theme: "light",
    services: [
      { name: "غسيل وتصفيف", description: "منتجات مختارة لنوع شعرك", price: "200 ج.م" },
      { name: "حمام كريم", description: "ترطيب عميق ولمعة طبيعية", price: "300 ج.م" },
      { name: "تنظيف فروة الرأس", description: "تقشير خفيف وانتعاش", price: "350 ج.م" },
      { name: "علاج تساقط داعم", description: "جلسة عناية مركزة", price: "450 ج.م" },
    ],
  },
  {
    id: "treatments",
    title: "تنعيم / علاجات",
    label: "TREATMENTS",
    watermark: "علاجات",
    description: "علاجات احترافية موجهة للحالة الفعلية لشعرك.",
    theme: "dark",
    services: [
      { name: "جلسة كيراتين", description: "تقييم السعر حسب طول وكثافة الشعر", price: "من 1,200 ج.م" },
      { name: "جلسة بروتين", description: "نتيجة ناعمة ومظهر طبيعي", price: "من 1,000 ج.م" },
      { name: "بوتوكس الشعر", description: "ترميم ولمعان مكثف", price: "من 1,300 ج.م" },
      { name: "علاج ترميم مركز", description: "للشعر المجهد والمتضرر", price: "650 ج.م" },
    ],
  },
  {
    id: "color",
    title: "ألوان الشعر",
    label: "HAIR COLOR",
    watermark: "ألوان",
    description: "لون محسوب بعناية، من الهايلايت الهادئ إلى التحولات الجريئة.",
    theme: "light",
    services: [
      { name: "تغطية الشيب", description: "لون طبيعي ومتجانس", price: "500 ج.م" },
      { name: "هايلايت خفيف", description: "تفاصيل لونية تمنح بعدًا للوك", price: "من 900 ج.م" },
      { name: "تفتيح كامل", description: "يشمل الاستشارة وخطة العناية", price: "من 1,500 ج.م" },
      { name: "تفصيل لون اللحية", description: "تعديل بسيط بدقة", price: "150 ج.م" },
    ],
  },
  {
    id: "skincare",
    title: "عناية بالبشرة",
    label: "SKIN CARE",
    watermark: "بشرة",
    description: "استراحة هادئة لبشرة أكثر صفاءً ومظهر أكثر حيوية.",
    theme: "dark",
    services: [
      { name: "تنظيف بشرة سريع", description: "تنقية وترطيب أساسي", price: "350 ج.م" },
      { name: "فاشيال عميق", description: "تنظيف، بخار وماسك مناسب", price: "600 ج.م" },
      { name: "ماسك الفحم", description: "للمسام والمظهر المرهق", price: "250 ج.م" },
      { name: "جلسة عناية فاخرة", description: "فاشيال كامل مع مساج وجه", price: "850 ج.م" },
    ],
  },
  {
    id: "wax",
    title: "واكس",
    label: "WAXING",
    watermark: "واكس",
    description: "تنظيف دقيق للمناطق الصغيرة بلمسة احترافية.",
    theme: "light",
    services: [
      { name: "واكس أنف", price: "100 ج.م" },
      { name: "واكس أذن", price: "100 ج.م" },
      { name: "واكس أنف وأذن", description: "تنظيف كامل وسريع", price: "180 ج.م" },
      { name: "واكس وجه", description: "للمناطق المحددة", price: "250 ج.م" },
    ],
  },
  {
    id: "extras",
    title: "إضافات",
    label: "THE DETAILS",
    watermark: "تفاصيل",
    description: "اللمسات الأخيرة التي تجعل النتيجة مكتملة.",
    theme: "dark",
    services: [
      { name: "تصفيف إضافي", description: "ستايل خاص للمناسبة", price: "200 ج.م" },
      { name: "غسيل فقط", description: "غسيل احترافي ومنتجات مناسبة", price: "150 ج.م" },
      { name: "استشارة تغيير لوك", description: "خطة واضحة قبل التغيير", price: "150 ج.م" },
      { name: "مناشف ساخنة", description: "إضافة مريحة لأي خدمة", price: "100 ج.م" },
    ],
  },
];

const regularPackages: Package[] = [
  {
    name: "باكدج الأسبوع",
    description: "ترتيب ثابت يحافظ على أفضل نسخة منك.",
    price: "750 ج.م",
    items: ["قص شعر", "تحديد ذقن", "غسيل وتصفيف"],
  },
  {
    name: "باكدج العناية",
    description: "جلسة متوازنة للشعر والبشرة في زيارة واحدة.",
    price: "1,050 ج.م",
    items: ["قص شعر", "فاشيال عميق", "عناية للذقن"],
  },
  {
    name: "باكدج المناسبة",
    description: "تجهيز أنيق للظهور الواثق في أي موعد مهم.",
    price: "1,250 ج.م",
    items: ["قص وتصفيف", "تحديد ذقن", "تنظيف بشرة", "واكس أنف وأذن"],
  },
];

const groomPackages: GroomPackage[] = [
  {
    name: "Essential",
    description: "الأساسيات",
    price: "1,250 ج.م",
    tag: "الأساسيات",
    items: ["قص شعر", "تحديد ذقن", "غسيل وتصفيف"],
  },
  {
    name: "Signature",
    description: "الاختيار الأمثل ليومك الكبير.",
    price: "1,650 ج.م",
    tag: "الأكثر طلبًا",
    featured: true,
    items: ["قص شعر", "تحديد ذقن", "فاشيال عميق", "عناية للشعر", "تصفيف نهائي"],
  },
  {
    name: "Complete",
    description: "التجربة الكاملة",
    price: "2,100 ج.م",
    tag: "التجربة الكاملة",
    items: ["كل مزايا Signature", "باديكير", "ماسك للذقن", "لمسات لون خفيفة"],
  },
];

const groomAddons: Addon[] = [
  { name: "Hair Detail Color", arabicName: "تفاصيل لون للشعر", price: "+150 ج.م" },
  { name: "Relax Session", arabicName: "جلسة استرخاء", price: "+200 ج.م" },
  { name: "Pedicure", arabicName: "باديكير", price: "+400 ج.م" },
  { name: "Protein Treatment", arabicName: "علاج بروتين", price: "+1000 ج.م" },
];

const quickLinks = [
  { label: "قص شعر", href: "#haircut" },
  { label: "ذقن", href: "#beard" },
  { label: "عناية بالشعر", href: "#hair-care" },
  { label: "ألوان", href: "#color" },
  { label: "عناية بالبشرة", href: "#skincare" },
  { label: "واكس", href: "#wax" },
  { label: "الباقات", href: "#packages" },
  { label: "العريس", href: "#groom" },
];

function ServiceRow({ service, isDark }: { service: Service; isDark: boolean }) {
  return (
    <div className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b py-5 last:border-b-0 md:gap-8 md:py-6 ${isDark ? "border-cut-warm-beige/20" : "border-cut-black/[0.12]"}`}>
      <div className="min-w-0">
        <h3 className="text-[1.05rem] font-bold tracking-tight md:text-xl">{service.name}</h3>
        {service.description && <p className={`mt-1.5 text-sm leading-6 ${isDark ? "text-cut-ivory/60" : "text-cut-black/60"}`}>{service.description}</p>}
      </div>
      <div className="flex items-center gap-3 md:gap-5">
        <span aria-hidden="true" className={`hidden h-px w-8 bg-gradient-to-l md:block ${isDark ? "from-cut-bronze/70 to-transparent" : "from-cut-bronze/80 to-transparent"}`} />
        <p className={`rounded-md border px-3 py-2 text-base font-black tabular-nums md:px-4 md:text-lg ${isDark ? "border-cut-bronze/35 bg-cut-bronze/10 text-cut-warm-beige" : "border-cut-bronze/35 bg-cut-burgundy/[0.04] text-cut-burgundy"}`}>{service.price}</p>
      </div>
    </div>
  );
}

function PriceSection({ category }: { category: PriceCategory }) {
  const isDark = category.theme === "dark";
  return (
    <section id={category.id} className={`relative isolate scroll-mt-32 overflow-hidden ${isDark ? "bg-[linear-gradient(135deg,#050505_0%,#170406_100%)] text-cut-ivory" : "bg-cut-ivory text-cut-black"}`}>
      <div className={`absolute inset-x-0 top-0 h-px ${isDark ? "bg-cut-warm-beige/20" : "bg-cut-black/[0.12]"}`} />
      <div className={`absolute inset-y-0 right-[8%] w-px ${isDark ? "bg-cut-bronze/[0.08]" : "bg-cut-bronze/[0.13]"}`} />
      <p aria-hidden="true" className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(5rem,17vw,14rem)] font-black leading-none tracking-tight ${isDark ? "text-cut-ivory/[0.025]" : "text-cut-black/[0.035]"}`}>{category.watermark}</p>
      <div className="container relative z-10 px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-24">
          <div className="lg:pt-2">
            <div className="flex items-center gap-3"><span className={`h-px w-10 ${isDark ? "bg-cut-bronze" : "bg-cut-burgundy"}`} /><p className={`font-display text-xs tracking-[0.3em] ${isDark ? "text-cut-bronze" : "text-cut-burgundy"}`} dir="ltr">{category.label}</p></div>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{category.title}</h2>
            <p className={`mt-5 max-w-sm text-base leading-8 ${isDark ? "text-cut-ivory/65" : "text-cut-black/65"}`}>{category.description}</p>
          </div>
          <div className={`self-end border-t ${isDark ? "border-cut-warm-beige/20" : "border-cut-black/[0.12]"}`}>{category.services.map((service) => <ServiceRow key={service.name} service={service} isDark={isDark} />)}</div>
        </div>
      </div>
    </section>
  );
}

function StickyCategoryNav() {
  return (
    <nav aria-label="تنقل سريع في قائمة الأسعار" className="sticky top-0 z-40 border-y border-cut-bronze/20 bg-cut-black/95 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="scrollbar-hide mx-auto flex max-w-[1200px] divide-x divide-x-reverse divide-cut-bronze/20 overflow-x-auto px-4 md:px-6">
        {quickLinks.map((link) => <a key={link.href} href={link.href} className="shrink-0 px-3 py-2 text-xs font-bold text-cut-ivory/65 transition first:pr-0 hover:bg-cut-burgundy/35 hover:text-cut-warm-beige focus:bg-cut-burgundy/35 focus:text-cut-warm-beige focus:outline-none md:px-5">{link.label}</a>)}
      </div>
    </nav>
  );
}

function PackageCard({ packageItem }: { packageItem: Package }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-cut-bronze/25 bg-cut-soft-black p-6 text-cut-ivory transition duration-300 hover:-translate-y-1 hover:border-cut-bronze/65 md:p-8">
      <span aria-hidden="true" className="absolute left-0 top-0 h-16 w-px bg-cut-bronze/80" />
      <div className="flex items-start justify-between gap-4"><div><p className="font-display text-[11px] tracking-[0.28em] text-cut-bronze" dir="ltr">CUT EDIT</p><h3 className="mt-4 text-2xl font-black">{packageItem.name}</h3></div><p className="whitespace-nowrap rounded-md border border-cut-bronze/35 bg-cut-bronze/10 px-3 py-2 text-base font-black text-cut-warm-beige">{packageItem.price}</p></div>
      <p className="mt-4 min-h-12 text-sm leading-7 text-cut-ivory/60">{packageItem.description}</p>
      <ul className="mt-6 space-y-2.5 border-t border-cut-ivory/10 pt-5 text-sm text-cut-ivory/75">
        {packageItem.items.map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cut-bronze" />{item}</li>)}
      </ul>
      <a href="/#barbers" className="mt-8 inline-flex items-center gap-1 self-start text-sm font-bold text-cut-warm-beige transition hover:text-cut-ivory">احجز الباكدج <ArrowLeft className="h-4 w-4" /></a>
    </article>
  );
}

function GroomPackageCard({ packageItem }: { packageItem: GroomPackage }) {
  return (
    <article className={`relative flex h-full flex-col overflow-hidden border p-6 transition duration-300 md:p-8 ${packageItem.featured ? "z-10 border-cut-bronze bg-[linear-gradient(155deg,#4A000F_0%,#170406_55%,#050505_100%)] text-cut-ivory shadow-cut-glow-strong lg:-my-3 lg:scale-[1.035]" : "border-cut-bronze/30 bg-cut-ivory text-cut-black hover:border-cut-bronze/70"}`}>
      {packageItem.featured && <><div className="absolute inset-x-0 top-0 h-px bg-cut-warm-beige/80" /><span className="absolute left-5 top-5 rounded-full border border-cut-black/10 bg-cut-bronze px-3 py-1 text-xs font-black text-cut-black">الأكثر طلبًا</span></>}
      <p className={`font-display text-xs tracking-[0.27em] ${packageItem.featured ? "text-cut-warm-beige" : "text-cut-burgundy"}`} dir="ltr">GROOM PACKAGE</p>
      <h3 className="mt-4 font-display text-4xl font-semibold" dir="ltr">{packageItem.name}</h3>
      <p className={`mt-2 text-sm font-bold ${packageItem.featured ? "text-cut-ivory/75" : "text-cut-black/60"}`}>{packageItem.tag}</p>
      <p className={`mt-7 text-3xl font-black tabular-nums ${packageItem.featured ? "text-cut-warm-beige" : "text-cut-burgundy"}`}>{packageItem.price}</p>
      <ul className={`mt-7 flex-1 space-y-3 border-t pt-5 text-sm ${packageItem.featured ? "border-cut-ivory/15 text-cut-ivory/75" : "border-cut-black/[0.12] text-cut-black/70"}`}>
        {packageItem.items.map((item) => <li key={item} className="flex items-center gap-2"><Check className={`h-4 w-4 ${packageItem.featured ? "text-cut-bronze" : "text-cut-burgundy"}`} />{item}</li>)}
      </ul>
      <a href="/#barbers" className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition ${packageItem.featured ? "bg-cut-ivory text-cut-black hover:bg-cut-warm-beige" : "bg-cut-black text-cut-ivory hover:bg-cut-burgundy"}`}>احجز الباكدج <ArrowLeft className="h-4 w-4" /></a>
    </article>
  );
}

function AddonCard({ addon }: { addon: Addon }) {
  return (
    <article className="group border border-cut-bronze/25 bg-cut-soft-black p-5 text-cut-ivory transition hover:border-cut-bronze/60 hover:bg-cut-wine-black">
      <div className="flex items-start justify-between gap-3"><p className="font-display text-xs tracking-[0.12em] text-cut-bronze" dir="ltr">{addon.name}</p><span className="h-2 w-2 rounded-full bg-cut-bronze/70" /></div>
      <div className="mt-6 flex items-end justify-between gap-3 border-t border-cut-ivory/10 pt-4"><h3 className="text-sm font-bold">{addon.arabicName}</h3><p className="whitespace-nowrap text-base font-black text-cut-warm-beige">{addon.price}</p></div>
    </article>
  );
}

function LegacyPricesPage() {
  return (
    <main className="overflow-x-clip bg-cut-black" dir="rtl">
      <section className="hero-gradient cut-grain relative isolate min-h-[640px] overflow-hidden pt-32 text-cut-ivory md:min-h-[760px] md:pt-44">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.36),transparent_75%)]" />
        <div className="absolute inset-0 cut-vignette" />
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-cut-bronze/20 md:h-[30rem] md:w-[30rem]" />
        <div className="absolute bottom-0 left-[12%] h-[60%] w-px bg-gradient-to-b from-transparent via-cut-bronze/60 to-transparent" />
        <p aria-hidden="true" className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[clamp(4.5rem,17vw,14rem)] font-bold leading-none text-cut-ivory/[0.035]" dir="ltr">PRICE LIST</p>
        <div className="container relative z-10 px-5 pb-16 md:px-8">
          <div className="max-w-3xl border-r border-cut-bronze/35 pr-5 md:pr-8">
            <div className="mb-7 flex items-center gap-3 text-cut-bronze"><span className="h-px w-10 bg-current" /><span className="font-display text-xs tracking-[0.35em]" dir="ltr">CUT SALON / 2026</span></div>
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-8xl">قائمة الأسعار</h1>
            <p className="mt-7 max-w-xl text-lg leading-9 text-cut-ivory/75 md:text-xl">خدمات CUT Salon — الأسعار، الباقات، وتجهيز العريس</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="/#barbers" className="inline-flex min-h-12 items-center justify-center gap-2 bg-cut-ivory px-6 py-3.5 font-bold text-cut-black transition hover:bg-cut-warm-beige">احجز الآن <ArrowLeft className="h-4 w-4" /></a>
              <a href="#groom" className="inline-flex min-h-12 items-center justify-center gap-2 border border-cut-bronze/50 px-6 py-3.5 font-bold text-cut-ivory transition hover:border-cut-warm-beige hover:bg-cut-burgundy/40">شوف باكدجات العريس <ChevronLeft className="h-4 w-4" /></a>
            </div>
          </div>
          <div className="absolute bottom-2 left-5 hidden items-center gap-3 text-cut-ivory/40 md:flex"><span className="font-display text-xs tracking-[0.3em]" dir="ltr">SCROLL TO EXPLORE</span><span className="h-12 w-px bg-cut-bronze/60" /></div>
        </div>
      </section>

      <StickyCategoryNav />
      {priceCategories.map((category) => <PriceSection key={category.id} category={category} />)}

      <section id="packages" className="relative isolate scroll-mt-32 overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(74,0,15,0.48),transparent_34%),#170406] py-20 text-cut-ivory md:py-28">
        <div className="absolute inset-x-0 top-0 h-px bg-cut-bronze/35" />
        <p aria-hidden="true" className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(5rem,18vw,14rem)] font-black text-cut-ivory/[0.03]">الباقات</p>
        <div className="container relative z-10 px-5 md:px-8">
          <div className="flex flex-col gap-6 border-r border-cut-bronze/35 pr-5 md:flex-row md:items-end md:justify-between md:pr-8"><div className="max-w-2xl"><p className="cut-editorial-label" dir="ltr">CURATED EXPERIENCES</p><h2 className="mt-3 text-4xl font-black md:text-5xl">الباقات</h2><p className="mt-4 text-base leading-8 text-cut-ivory/65">اختيارات مختصرة تجمع أكثر الخدمات طلبًا في تجربة واحدة متوازنة.</p></div><p className="font-display text-sm tracking-[0.28em] text-cut-bronze" dir="ltr">THREE WAYS TO RESET</p></div>
          <div className="mt-10 grid gap-px border border-cut-bronze/25 bg-cut-bronze/25 md:grid-cols-3">{regularPackages.map((packageItem) => <PackageCard key={packageItem.name} packageItem={packageItem} />)}</div>
        </div>
      </section>

      <section id="groom" className="relative isolate scroll-mt-32 overflow-hidden bg-cut-black py-20 text-cut-ivory md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_45%,rgba(74,0,15,0.72),transparent_38%)]" />
        <div className="absolute inset-5 border border-cut-bronze/15 md:inset-8" />
        <p aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(6rem,22vw,18rem)] font-black leading-none text-cut-ivory/[0.03]">العريس</p>
        <div className="container relative z-10 px-5 md:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <div><p className="cut-editorial-label" dir="ltr">THE GROOM EDIT</p><h2 className="mt-3 text-5xl font-black md:text-7xl">باكدج العريس</h2><p className="mt-5 text-xl text-cut-warm-beige">تجهيز متكامل ليوم يليق بك</p><p className="mt-6 max-w-xl leading-8 text-cut-ivory/65">كل التفاصيل محسوبة، من قصة الشعر وحتى الفينيش الأخير، لتدخل يومك الكبير بأفضل نسخة منك.</p></div>
            <div className="border-r border-cut-bronze/45 pr-6 md:pr-8"><p className="font-display text-sm tracking-[0.25em] text-cut-bronze" dir="ltr">GROOM SIGNATURE</p><p className="mt-5 text-4xl font-black text-cut-warm-beige">1,650 ج.م</p><p className="mt-4 leading-7 text-cut-ivory/70">قصة، ذقن، فاشيال، عناية للشعر وتصفيف نهائي في جلسة مصممة لك.</p><a href="/#barbers" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cut-bronze px-5 py-3 text-sm font-bold text-cut-black transition hover:bg-cut-warm-beige">احجز الباكدج <ArrowLeft className="h-4 w-4" /></a></div>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">{groomPackages.map((packageItem) => <GroomPackageCard key={packageItem.name} packageItem={packageItem} />)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-cut-ivory py-20 text-cut-black md:py-28">
        <div className="absolute inset-x-0 top-0 h-px bg-cut-black/[0.12]" />
        <div className="container relative px-5 md:px-8"><div className="flex flex-col justify-between gap-5 border-r border-cut-bronze/55 pr-5 sm:flex-row sm:items-end md:pr-8"><div><p className="font-display text-xs tracking-[0.3em] text-cut-burgundy" dir="ltr">FINISHING TOUCHES</p><h2 className="mt-3 text-4xl font-black md:text-5xl">إضافات العريس</h2><p className="mt-3 text-cut-black/60">لمسات تكمّل اللوك</p></div><Scissors className="h-10 w-10 text-cut-bronze" strokeWidth={1} /></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{groomAddons.map((addon) => <AddonCard key={addon.name} addon={addon} />)}</div></div>
      </section>

      <section className="relative overflow-hidden bg-cut-soft-black py-20 text-cut-ivory md:py-28">
        <div className="container px-5 md:px-8"><div className="grid overflow-hidden rounded-2xl border border-cut-bronze/25 lg:grid-cols-2"><div className="relative min-h-[330px] overflow-hidden bg-gradient-to-bl from-cut-burgundy via-cut-wine-black to-cut-black p-8 md:p-12"><div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-cut-bronze/30" /><div className="absolute left-12 top-12 h-24 w-24 border border-cut-warm-beige/30" /><div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_49.7%,rgba(164,136,121,0.2)_50%,transparent_50.3%)]" /><div className="relative z-10 flex h-full flex-col justify-end"><Sparkles className="mb-5 h-8 w-8 text-cut-bronze" strokeWidth={1} /><p className="font-display text-5xl tracking-[0.12em] text-cut-ivory/90" dir="ltr">ON LOCATION</p><p className="mt-2 text-sm text-cut-ivory/55">Private finishing service</p></div></div><div className="p-8 md:p-12"><p className="font-display text-xs tracking-[0.28em] text-cut-bronze" dir="ltr">WEDDING LOCATION VISIT</p><h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">تجهيز العريس في المنزل أو القاعة</h2><p className="mt-5 leading-8 text-cut-ivory/65">خدمة خاصة للفينيش الأخير قبل الفرح</p><ul className="mt-7 space-y-3 text-sm text-cut-ivory/80">{["تصفيف الشعر", "مراجعة الدقن", "لمسات نهائية للتصوير"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-cut-bronze" />{item}</li>)}</ul><div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-cut-ivory/10 pt-6"><div><p className="text-xl font-black text-cut-warm-beige">يبدأ من 1,500 ج.م</p><p className="mt-1 text-xs text-cut-ivory/45">حسب الموقع: 1,500 / 1,750 / 2,000</p></div><a href="/#barbers" className="inline-flex items-center gap-2 text-sm font-bold text-cut-warm-beige transition hover:text-cut-ivory">احجز الزيارة <ArrowLeft className="h-4 w-4" /></a></div></div></div></div>
      </section>

      <section className="relative overflow-hidden bg-cut-burgundy px-5 py-20 text-center text-cut-ivory md:py-28"><p aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[clamp(5rem,19vw,15rem)] font-bold text-cut-ivory/[0.06]" dir="ltr">CUT</p><div className="relative z-10 mx-auto max-w-2xl"><p className="font-display text-xs tracking-[0.32em] text-cut-warm-beige" dir="ltr">YOUR NEXT LOOK</p><h2 className="mt-4 text-4xl font-black md:text-6xl">جاهز تختار تجربتك؟</h2><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><a href="/#barbers" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cut-ivory px-6 py-3.5 font-bold text-cut-black transition hover:bg-cut-warm-beige">احجز الآن <ArrowLeft className="h-4 w-4" /></a><a href="https://wa.me/201012126899" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cut-ivory/45 px-6 py-3.5 font-bold transition hover:bg-cut-black/20">تواصل معنا <ArrowUpLeft className="h-4 w-4" /></a></div></div></section>
      <FooterSection />
    </main>
  );
}

export default function PricesPage() {
  return <PricesClient />;
}
