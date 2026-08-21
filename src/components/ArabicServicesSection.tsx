"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getServiceCatalog, type ServiceCatalogCategory } from "@/lib/serviceCatalogApi";
import { useLanguage } from "@/context/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";

export default function ArabicServicesSection() {
  const { lang, dir } = useLanguage();
  const t = landingCopy.services;
  const [catalog, setCatalog] = useState<ServiceCatalogCategory[]>([]);
  const ExploreIcon = lang === "ar" ? ChevronLeft : ChevronRight;

  const money = (value: number) =>
    `${new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG", { maximumFractionDigits: 0 }).format(value)} ${tx(t.currency, lang)}`;

  useEffect(() => {
    getServiceCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  const featured = catalog
    .filter((category) => category.services.some((service) => service.isActive && (service.nameAr || service.nameEn)))
    .slice(0, 6);

  const sectionHeading =
    lang === "ar"
      ? "cut-ar-section-heading font-laxr mt-5 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-normal leading-[1.2] text-cut-black"
      : "mt-5 max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1.15] text-cut-black";

  return (
    <section
      id="services"
      className="relative overflow-hidden bg-cut-soft-ivory py-20 text-cut-black md:py-28"
      dir={dir}
    >
      <p
        aria-hidden
        className={`pointer-events-none absolute top-5 text-[clamp(5rem,16vw,14rem)] font-normal text-cut-black/[0.035] ${
          lang === "ar" ? "-right-5 font-laxr" : "-left-5 font-display font-bold"
        }`}
      >
        {tx(t.watermark, lang)}
      </p>
      <div className="relative mx-auto max-w-[1360px] px-[clamp(20px,5vw,80px)]">
        <p className="cut-editorial-label text-cut-burgundy">{tx(t.eyebrow, lang)}</p>
        <h2 className={sectionHeading}>{tx(t.title, lang)}</h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-cut-black/65 md:text-lg">{tx(t.body, lang)}</p>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((category, index) => {
            const active = category.services.filter(
              (service) => service.isActive && (service.nameAr || service.nameEn),
            );
            const fromPrice = active.length ? Math.min(...active.map((service) => service.price)) : null;
            const dark = index === 0;
            const countLabel =
              active.length === 1
                ? `${active.length} ${tx(t.serviceOne, lang)}`
                : `${active.length} ${tx(t.serviceMany, lang)}`;

            return (
              <article
                key={category.id}
                className={`group flex min-h-[280px] flex-col overflow-hidden border border-cut-bronze/35 p-6 md:min-h-[300px] ${
                  dark ? "bg-cut-wine-black text-cut-ivory lg:col-span-2" : "bg-cut-ivory"
                }`}
              >
                <p
                  className={`text-xs font-bold tracking-[0.22em] ${
                    dark ? "text-cut-warm-beige" : "text-cut-burgundy"
                  }`}
                >
                  {tx(t.cardEyebrow, lang)}
                </p>
                <h3
                  className={`mt-5 text-3xl md:text-4xl ${
                    dark
                      ? lang === "ar"
                        ? "font-laxr font-normal text-cut-ivory"
                        : "font-display font-semibold text-cut-ivory"
                      : lang === "ar"
                        ? "font-laxr font-normal text-cut-black"
                        : "font-display font-semibold text-cut-black"
                  }`}
                >
                  {category.name || tx(t.fallbackCategory, lang)}
                </h3>
                <p className={`mt-4 max-w-sm text-sm leading-7 ${dark ? "text-cut-ivory/70" : "text-cut-black/60"}`}>
                  {countLabel}
                  {fromPrice != null ? ` · ${tx(t.fromPrice, lang)} ${money(fromPrice)}` : ""}
                </p>
                <a
                  href="/prices"
                  className={`mt-auto inline-flex min-h-11 items-center gap-2 pt-8 text-sm font-bold ${
                    dark ? "text-cut-warm-beige" : "text-cut-burgundy"
                  }`}
                >
                  {tx(t.explore, lang)} <ExploreIcon className="h-4 w-4" />
                </a>
              </article>
            );
          })}

          <article className="flex min-h-[280px] flex-col border border-cut-bronze/35 bg-cut-burgundy p-6 text-cut-ivory md:min-h-[300px]">
            <p className="cut-editorial-label text-cut-warm-beige">{tx(t.groomEyebrow, lang)}</p>
            <h3
              className={`mt-6 text-3xl md:text-4xl ${
                lang === "ar" ? "font-laxr font-normal" : "font-display font-semibold"
              }`}
            >
              {tx(t.groomTitle, lang)}
            </h3>
            <p className="mt-4 text-sm leading-7 text-cut-ivory/70">{tx(t.groomBody, lang)}</p>
            <a
              href="/prices#groom-packages"
              className="mt-auto inline-flex min-h-11 items-center gap-2 pt-8 font-bold text-cut-warm-beige"
            >
              {tx(t.explorePackages, lang)} <ExploreIcon className="h-4 w-4" />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
