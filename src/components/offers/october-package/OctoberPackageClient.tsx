"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
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

const serviceCardId = (serviceId: number) => `october-service-card-${serviceId}`;

function BookButton({ tabIndex }: { tabIndex?: number }) {
  return (
    <Link
      href={octoberOffer.bookHref}
      tabIndex={tabIndex}
      className="flex min-h-14 w-full touch-manipulation select-none items-center justify-center rounded-2xl bg-cut-gold px-6 text-lg font-bold text-cut-black shadow-cut-glow transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold"
    >
      احجز دلوقتي
    </Link>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="size-5 shrink-0 text-cut-bronze transition-transform duration-200 group-open:rotate-180"
    >
      <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OctoberPackageClient() {
  const [view, setView] = useState<PackageView>(FALLBACK);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const targets = [heroCtaRef.current, endCtaRef.current].filter((el): el is HTMLDivElement => el !== null);
    if (typeof IntersectionObserver === "undefined" || targets.length === 0) return;
    const visible = new Map<Element, boolean>(targets.map((el) => [el, el === heroCtaRef.current]));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
      setShowStickyBar(![...visible.values()].some(Boolean));
    });
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const openService = (event: MouseEvent<HTMLAnchorElement>, serviceId: number) => {
    const card = document.getElementById(serviceCardId(serviceId));
    if (!(card instanceof HTMLDetailsElement)) return;
    event.preventDefault();
    card.open = true;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const savings = view.originalPrice ? view.originalPrice - view.price : null;

  return (
    <main dir="rtl" lang="ar" className="min-h-svh overflow-x-hidden bg-cut-black font-ui text-cut-ivory antialiased">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
        <header className="flex justify-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center px-4 font-brand text-xl tracking-[0.3em] text-cut-ivory"
            aria-label="CUT Salon — الرئيسية"
          >
            CUT
          </Link>
        </header>

        <section aria-labelledby="october-package-name" className="-mt-4 flex flex-col items-center gap-5 text-center">
          <h1 id="october-package-name" className="font-laxr text-[2.5rem] leading-tight text-cut-ivory">
            {view.name}
          </h1>

          <div className="flex flex-col items-center gap-2" data-testid="october-package-price">
            <strong className="font-laxr text-[4rem] leading-none text-cut-gold">
              <span dir="ltr">{view.price}</span> جنيه
            </strong>
            {view.originalPrice ? (
              <span className="flex flex-wrap items-center justify-center gap-2 text-base text-cut-ivory/60">
                <span>
                  بدل <del><span dir="ltr">{view.originalPrice}</span> جنيه</del>
                </span>
                {savings ? (
                  <span className="rounded-full bg-cut-gold/15 px-3 py-1 text-sm font-bold text-cut-gold">
                    وفّر <span dir="ltr">{savings}</span> جنيه
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          <p className="text-[15px] text-cut-ivory/75">
            ٤ خدمات في زيارة واحدة{view.durationMinutes ? ` · ${view.durationMinutes} دقيقة` : ""}
          </p>

          <ul aria-label="خدمات الباكدج" className="grid w-full grid-cols-2 gap-2.5">
            {OCTOBER_PACKAGE_SERVICES.map((service, index) => {
              const minutes = view.serviceMinutes[service.serviceId];
              return (
                <li key={service.serviceId}>
                  <a
                    href={`#${serviceCardId(service.serviceId)}`}
                    onClick={(event) => openService(event, service.serviceId)}
                    className="flex h-full min-h-[4.5rem] touch-manipulation flex-col items-start justify-center gap-0.5 rounded-xl border border-cut-bronze/25 bg-cut-soft-black px-3 py-2.5 text-start transition active:scale-[0.98] active:border-cut-gold/50"
                  >
                    <span className="text-xs font-bold text-cut-gold" dir="ltr">{`0${index + 1}`}</span>
                    <span className="text-[15px] font-bold leading-snug text-cut-ivory">{service.name}</span>
                    {minutes ? <span className="text-xs text-cut-ivory/55">{minutes} دقيقة</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>

          <div ref={heroCtaRef} className="flex w-full flex-col items-center gap-2.5">
            <BookButton />
            <p className="text-[13px] text-cut-ivory/60">احجز الباكدج أونلاين، والدفع داخل الفرع.</p>
          </div>
        </section>

        <section aria-labelledby="october-package-services" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="october-package-services" className="font-laxr text-[1.75rem] text-cut-ivory">
              إيه اللي في الباكدج؟
            </h2>
            <p className="text-[13px] text-cut-ivory/55">دوس على أي خدمة تشوف مراحلها وفايدتها.</p>
          </div>
          <ol className="flex flex-col gap-3">
            {OCTOBER_PACKAGE_SERVICES.map((service, index) => {
              const minutes = view.serviceMinutes[service.serviceId];
              return (
                <li key={service.serviceId}>
                  <details
                    id={serviceCardId(service.serviceId)}
                    className="group scroll-mt-4 rounded-2xl border border-cut-bronze/25 bg-cut-soft-black open:border-cut-gold/40"
                  >
                    <summary className="flex min-h-14 cursor-pointer touch-manipulation list-none flex-col gap-2 p-4 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <h3 id={`october-service-${service.serviceId}`} className="text-lg font-bold text-cut-ivory">
                          <span className="ml-2 text-cut-gold" dir="ltr">{`0${index + 1}`}</span>
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {minutes ? <span className="text-xs text-cut-ivory/55">{minutes} دقيقة</span> : null}
                          <Chevron />
                        </div>
                      </div>
                      <p className="text-[15px] leading-7 text-cut-ivory/80">{service.about}</p>
                    </summary>
                    <div className="border-t border-cut-bronze/15 px-4 pb-4 pt-3">
                      <p className="text-xs font-bold text-cut-bronze">المراحل</p>
                      <ol className="mt-2 list-decimal space-y-2 ps-5 text-[15px] leading-6 text-cut-ivory/80 marker:text-cut-bronze">
                        {service.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <p className="mt-4 rounded-xl bg-cut-wine-black/70 px-4 py-3 text-[15px] leading-7 text-cut-ivory/85">
                        <span className="font-bold text-cut-gold">الفايدة: </span>
                        {service.benefit}
                      </p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-label="فيديو الباكدج" className="overflow-hidden rounded-2xl border border-cut-bronze/25 bg-cut-soft-black">
          {OCTOBER_PACKAGE_VIDEO.available ? (
            <video
              className="aspect-[9/16] max-h-[80svh] w-full bg-black object-cover"
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

        <div ref={endCtaRef} className="flex flex-col items-center gap-2.5">
          <BookButton />
          <p className="text-[13px] text-cut-ivory/60">الدفع داخل فروع CUT فقط.</p>
        </div>
      </div>

      <div
        data-testid="october-package-sticky-bar"
        aria-hidden={!showStickyBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-cut-bronze/20 bg-cut-black/90 backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none ${
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <p className="flex shrink-0 flex-col leading-tight">
            <strong className="font-laxr text-2xl text-cut-gold">
              <span dir="ltr">{view.price}</span> جنيه
            </strong>
            {view.originalPrice ? (
              <del className="text-xs text-cut-ivory/50">
                <span dir="ltr">{view.originalPrice}</span> جنيه
              </del>
            ) : null}
          </p>
          <div className="flex-1">
            <BookButton tabIndex={showStickyBar ? undefined : -1} />
          </div>
        </div>
      </div>
    </main>
  );
}
