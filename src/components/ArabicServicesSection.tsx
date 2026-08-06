"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getServiceCatalog, type ServiceCatalogCategory } from "@/lib/serviceCatalogApi";

const money = (value: number) =>
  `${new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(value)} ج.م`;

export default function ArabicServicesSection() {
  const [catalog, setCatalog] = useState<ServiceCatalogCategory[]>([]);

  useEffect(() => {
    getServiceCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  const featured = catalog
    .filter((category) => category.services.some((service) => service.isActive && (service.nameAr || service.nameEn)))
    .slice(0, 6);

  return (
    <section
      id="services"
      className="relative overflow-hidden bg-cut-soft-ivory py-20 text-cut-black md:py-28"
      dir="rtl"
    >
      <p
        aria-hidden
        className="pointer-events-none absolute -right-5 top-5 font-laxr text-[clamp(5rem,16vw,14rem)] font-normal text-cut-black/[0.035]"
      >
        الخدمات
      </p>
      <div className="relative mx-auto max-w-[1360px] px-[clamp(20px,5vw,80px)]">
        <p className="cut-editorial-label text-cut-burgundy">THE SERVICE EDIT</p>
        <h2 className="cut-ar-section-heading font-laxr mt-5 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-normal leading-[1.2] text-cut-black">
          مصممة لكل تفصيلة.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-cut-black/65 md:text-lg">
          استكشف خدمات مبنية حول ستايلك وروتينك ومناسباتك.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((category, index) => {
            const active = category.services.filter(
              (service) => service.isActive && (service.nameAr || service.nameEn),
            );
            const fromPrice = active.length
              ? Math.min(...active.map((service) => service.price))
              : null;
            const dark = index === 0;

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
                  CUT SALON SERVICES
                </p>
                <h3
                  className={`mt-5 text-3xl font-bold md:text-4xl ${
                    dark ? "font-laxr font-normal text-cut-ivory" : "font-laxr font-normal text-cut-black"
                  }`}
                >
                  {category.name || "العناية"}
                </h3>
                <p className={`mt-4 max-w-sm text-sm leading-7 ${dark ? "text-cut-ivory/70" : "text-cut-black/60"}`}>
                  {active.length} {active.length === 1 ? "خدمة متاحة" : "خدمات متاحة"}
                  {fromPrice != null ? ` · يبدأ من ${money(fromPrice)}` : ""}
                </p>
                <a
                  href="/prices"
                  className={`mt-auto inline-flex min-h-11 items-center gap-2 pt-8 text-sm font-bold ${
                    dark ? "text-cut-warm-beige" : "text-cut-burgundy"
                  }`}
                >
                  استكشف الخدمات <ChevronLeft className="h-4 w-4" />
                </a>
              </article>
            );
          })}

          <article className="flex min-h-[280px] flex-col border border-cut-bronze/35 bg-cut-burgundy p-6 text-cut-ivory md:min-h-[300px]">
            <p className="cut-editorial-label text-cut-warm-beige">THE GROOM EDIT</p>
            <h3 className="mt-6 font-laxr text-3xl font-normal md:text-4xl">باقات العريس</h3>
            <p className="mt-4 text-sm leading-7 text-cut-ivory/70">
              تجارب تجهيز ليوم الزفاف، مصممة حول التفاصيل اللي تهمك.
            </p>
            <a
              href="/prices#groom-packages"
              className="mt-auto inline-flex min-h-11 items-center gap-2 pt-8 font-bold text-cut-warm-beige"
            >
              استكشف الباقات <ChevronLeft className="h-4 w-4" />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
