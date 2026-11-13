"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { serviceGuides, type ServiceGuideKey } from "@/lib/serviceGuides";
export default function ServiceContent({ guide }: { guide?: ServiceGuideKey }) {
  const { isArabic: ar, dir } = useLanguage();
  const content = guide ? serviceGuides[guide] : null;
  return <header dir={dir} className="container pt-32 pb-8 space-y-6 max-w-4xl">
    <h1 className="text-4xl font-bold">{content ? (ar ? content.ar : content.en) : ar ? "دليل خدمات CUT Salon في الإسكندرية" : "CUT Salon service guide in Alexandria"}</h1>
    <p className="text-lg leading-8">{content ? (ar ? content.introAr : content.introEn) : ar ? "قارن بين خدمات الشعر واللحية قبل اختيار موعدك. يعرض كل دليل ما يجب توضيحه للحلاق، والأسعار المنشورة لكل فرع من الكتالوج العام. أسماء الخدمات وتوافرها قد تختلف بين الفروع؛ اختر الفرع والخدمة في الحجز للتأكد من اختيارك." : "Compare hair and beard services before choosing an appointment. Each guide explains what to discuss with your barber and shows published branch prices from the public catalog. Names and availability may differ between branches; select your branch and service in booking to confirm your choice."}</p>
    {content && <section className="space-y-3"><h2 className="text-2xl font-bold">{ar ? content.questionAr : content.questionEn}</h2><p className="leading-8">{ar ? content.answerAr : content.answerEn}</p><h2 className="text-2xl font-bold">{ar ? "أين أجد السعر وأحجز؟" : "Where can I find prices and book?"}</h2><p>{ar ? "راجع قائمة الفرع أدناه ثم افتح الحجز لاختيار الفرع والخدمة والموعد المتاح. لا تعتبر الخدمة متاحة في كل الفروع لمجرد ظهورها في أحدها." : "Review the branch list below, then open booking to choose the branch, service and available time. A listing at one branch does not establish availability at every branch."}</p></section>}
    <nav className="flex gap-6 underline">{Object.entries(serviceGuides).filter(([key]) => key !== guide).map(([key, item]) => <Link key={key} href={`/services/${key}`}>{ar ? item.ar : item.en}</Link>)}</nav>
  </header>;
}
