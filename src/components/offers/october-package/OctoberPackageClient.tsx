"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OCTOBER_PACKAGE_ID,
  OCTOBER_PACKAGE_SERVICES,
  OCTOBER_PACKAGE_VIDEO,
  octoberOffer,
} from "@/config/octoberOffer";
import { getPackageById, type ApiPackage } from "@/lib/packagesApi";

type PackageView = {
  name: string;
  price: number;
  originalPrice: number | null;
  durationMinutes: number | null;
  serviceMinutes: Record<number, number>;
};

/** Shown until (or if) the live package fails to load; the backend stays authoritative at booking time. */
const FALLBACK: PackageView = {
  name: "باكدج أكتوبر",
  price: octoberOffer.price,
  originalPrice: octoberOffer.originalPrice,
  durationMinutes: null,
  serviceMinutes: {},
};

function toView(pack: ApiPackage): PackageView {
  const serviceMinutes: Record<number, number> = {};
  for (const item of pack.includes) {
    if (item.durationMinutes) serviceMinutes[item.serviceId] = item.durationMinutes;
  }
  return {
    name: pack.nameAr || pack.nameEn || FALLBACK.name,
    price: pack.price,
    originalPrice: pack.originalPrice && pack.originalPrice > pack.price ? pack.originalPrice : null,
    durationMinutes: pack.durationMinutes,
    serviceMinutes,
  };
}

function BookButton() {
  return (
    <Link
      href={octoberOffer.bookHref}
      className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-cut-gold px-6 text-lg font-bold text-cut-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold"
    >
      احجز دلوقتي
    </Link>
  );
}

export function OctoberPackageClient() {
  const [view, setView] = useState<PackageView>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    getPackageById(OCTOBER_PACKAGE_ID)
      .then((pack) => {
        if (!cancelled) setView(toView(pack));
      })
      .catch(() => {
        /* keep the campaign values */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main dir="rtl" lang="ar" className="min-h-svh bg-cut-black font-ui text-cut-ivory">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6">
        <header className="flex justify-center">
          <Link href="/" className="font-brand text-xl tracking-[0.3em] text-cut-ivory" aria-label="CUT Salon — الرئيسية">
            CUT
          </Link>
        </header>

        <section aria-labelledby="october-package-name" className="flex flex-col items-center gap-5 text-center">
          <h1 id="october-package-name" className="font-laxr text-4xl leading-tight text-cut-ivory">
            {view.name}
          </h1>

          <p className="flex flex-col items-center gap-1" data-testid="october-package-price">
            <strong className="font-laxr text-6xl leading-none text-cut-gold">
              <span dir="ltr">{view.price}</span> جنيه
            </strong>
            {view.originalPrice ? (
              <span className="text-base text-cut-ivory/55">
                بدل <del><span dir="ltr">{view.originalPrice}</span> جنيه</del>
              </span>
            ) : null}
          </p>

          <p className="text-sm text-cut-ivory/70">
            ٤ خدمات في زيارة واحدة{view.durationMinutes ? ` · ${view.durationMinutes} دقيقة` : ""}
          </p>

          <BookButton />
          <p className="text-xs text-cut-ivory/55">احجز الباكدج أونلاين، والدفع داخل الفرع.</p>
        </section>

        <section aria-labelledby="october-package-services" className="flex flex-col gap-4">
          <h2 id="october-package-services" className="font-laxr text-2xl text-cut-ivory">
            إيه اللي في الباكدج؟
          </h2>
          <ol className="flex flex-col gap-4">
            {OCTOBER_PACKAGE_SERVICES.map((service, index) => {
              const minutes = view.serviceMinutes[service.serviceId];
              return (
                <li
                  key={service.serviceId}
                  className="rounded-2xl border border-cut-bronze/25 bg-cut-soft-black p-5"
                  aria-labelledby={`october-service-${service.serviceId}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 id={`october-service-${service.serviceId}`} className="text-lg font-bold text-cut-ivory">
                      <span className="ml-2 text-cut-gold" dir="ltr">{`0${index + 1}`}</span>
                      {service.name}
                    </h3>
                    {minutes ? <span className="shrink-0 text-xs text-cut-ivory/55">{minutes} دقيقة</span> : null}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-cut-ivory/80">{service.about}</p>
                  <p className="mt-4 text-xs font-bold text-cut-bronze">المراحل</p>
                  <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm leading-6 text-cut-ivory/75 marker:text-cut-bronze">
                    {service.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="mt-4 rounded-xl bg-cut-wine-black/70 px-4 py-3 text-sm leading-6 text-cut-ivory/85">
                    <span className="font-bold text-cut-gold">الفايدة: </span>
                    {service.benefit}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-label="فيديو الباكدج" className="overflow-hidden rounded-2xl border border-cut-bronze/25 bg-cut-soft-black">
          {OCTOBER_PACKAGE_VIDEO.available ? (
            <video
              className="aspect-[9/16] w-full bg-black object-cover"
              src={OCTOBER_PACKAGE_VIDEO.src}
              poster={OCTOBER_PACKAGE_VIDEO.poster}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="font-laxr text-xl text-cut-ivory/85">فيديو الباكدج</p>
              <p className="text-sm text-cut-ivory/55">قص شعر · ذقن وفيد · حمام زيت · تنظيف بشرة كلاسيكي</p>
            </div>
          )}
        </section>

        <BookButton />
      </div>
    </main>
  );
}
