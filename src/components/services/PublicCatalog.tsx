"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import type { PublicBranchCatalog } from "@/lib/publicServiceCatalog";
import { matchesGuide, type ServiceGuideKey } from "@/lib/serviceGuides";

export default function PublicCatalog({ branches, guide }: { branches: PublicBranchCatalog[]; guide?: ServiceGuideKey }) {
  const { isArabic: ar, dir } = useLanguage();
  return <section dir={dir} className="container py-12 space-y-6" aria-labelledby="public-catalog-title">
    <h2 id="public-catalog-title" className="text-2xl font-bold">{ar ? "الخدمات والأسعار حسب الفرع" : "Services and prices by branch"}</h2>
    <p>{ar ? "المصدر: كتالوج Casher العام. تُحدّث البيانات كل خمس دقائق؛ أكّد السعر والتوافر عند اختيار الفرع في الحجز. الأسعار بالجنيه المصري." : "Source: the public Casher catalog. Data refreshes every five minutes; confirm price and availability for your branch during booking. Prices are in Egyptian pounds."}</p>
    {!branches.length && <p>{ar ? "تعذّر تحميل الخدمات والأسعار حاليًا. لا نعرض أسعارًا تقديرية؛ حاول لاحقًا أو تواصل مع الفرع." : "Services and prices are unavailable right now. We do not show estimated prices; try later or contact the branch."}</p>}
    {branches.map(branch => {
      const services = guide ? branch.services.filter(s => matchesGuide(guide, `${s.ar} ${s.en}`)) : branch.services;
      return <section key={branch.code} className="rounded border border-cut-bronze p-5 space-y-3">
        <h3 className="text-xl font-bold">{branch.name}</h3>
        {!branch.available ? <p>{ar ? "أسعار هذا الفرع غير متاحة حاليًا." : "Prices for this branch are currently unavailable."}</p> : !services.length ? <p>{ar ? "لا توجد خدمات مطابقة منشورة حاليًا لهذا الفرع. تحقّق من الفرع قبل الحجز." : "No matching services are currently published for this branch. Check with the branch before booking."}</p> : <ul>{services.map(s => <li key={s.id} className="flex justify-between gap-4 border-b py-3"><span>{ar ? s.ar : s.en}</span><span>{s.price.toLocaleString("en-US")} {ar ? "ج.م" : "EGP"}</span></li>)}</ul>}
      </section>;
    })}
    <nav className="flex flex-wrap gap-6 underline" aria-label={ar ? "خطوتك التالية" : "Next steps"}><Link href="/prices">{ar ? "كل الأسعار والباقات" : "All prices and packages"}</Link><Link href="/#branches">{ar ? "الفروع والتواصل" : "Branches and contact"}</Link><Link href="/book">{ar ? "اختيار الفرع وحجز موعد" : "Choose a branch and book"}</Link><Link href="/services">{ar ? "دليل الخدمات" : "Service guides"}</Link></nav>
  </section>;
}
