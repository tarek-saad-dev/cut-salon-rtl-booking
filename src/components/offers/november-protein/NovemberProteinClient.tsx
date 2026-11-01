"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OfferMobileHeader } from "@/components/offers/OfferMobileHeader";
import {
  NOVEMBER_BRANCHES,
  NOVEMBER_EXPERIENCE_STEPS,
  NOVEMBER_OFFER_TERMS,
  NOVEMBER_TRANSFORM_MEDIA,
  buildNovemberBookHref,
  isNovemberCampaignActive,
  novemberProteinOffer,
  rememberNovemberPackageId,
} from "@/config/novemberProteinOffer";
import { trackCampaignEvent } from "@/lib/campaignAnalytics";
import { captureCampaignAttribution, readCampaignAttribution } from "@/lib/offers/campaignAttribution";
import { resolveNovemberPackage, type NovemberPackageResolution } from "@/lib/offers/resolveNovemberPackage";
import { trackMetaEvent } from "@/lib/metaPixel";
import styles from "./novemberProtein.module.css";

type LoadState = "loading" | NovemberPackageResolution["status"];

function BookCta({
  href,
  disabled,
  compact = false,
  onClick,
  label = "احجز العرض الآن",
}: {
  href: string | null;
  disabled: boolean;
  compact?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const className = `flex h-14 w-full max-w-full touch-manipulation select-none items-center justify-center whitespace-nowrap rounded-[18px] ${compact ? "px-3 text-[1.05rem]" : "px-4 sm:px-6 text-[clamp(1.05rem,4.6vw,1.3rem)]"} font-bold shadow-[0_8px_24px_rgba(212,175,55,0.22)] transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold ${
    disabled
      ? "cursor-not-allowed border border-cut-gold/45 bg-cut-gold/18 text-cut-gold shadow-none"
      : "bg-cut-gold text-cut-black"
  }`;

  if (disabled || !href) {
    return (
      <button type="button" disabled className={className} aria-disabled="true">
        {label}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {label}
    </Link>
  );
}

export function NovemberProteinClient() {
  const [active] = useState(() => isNovemberCampaignActive());
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [resolution, setResolution] = useState<NovemberPackageResolution | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const bookSectionRef = useRef<HTMLElement>(null);
  const experienceRef = useRef<HTMLElement>(null);

  const price = resolution?.package?.price ?? novemberProteinOffer.price;
  const packageId = resolution?.packageId ?? null;
  const bookHref = packageId != null && active ? buildNovemberBookHref(packageId) : null;
  const bookingReady = active && loadState === "ready" && packageId != null && bookHref != null;

  useEffect(() => {
    captureCampaignAttribution();
    trackCampaignEvent("november_protein_view", {
      ...readCampaignAttribution(),
      campaign: novemberProteinOffer.id,
      active,
    });
  }, [active]);

  useEffect(() => {
    if (!active) {
      setLoadState("inactive");
      return;
    }
    let cancelled = false;
    resolveNovemberPackage()
      .then((result) => {
        if (cancelled) return;
        if (result.packageId != null) rememberNovemberPackageId(result.packageId);
        setResolution(result);
        setLoadState(result.status);
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    const targets = [heroCtaRef.current, bookSectionRef.current].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (typeof IntersectionObserver === "undefined" || targets.length === 0) return;
    const visible = new Map<Element, boolean>(targets.map((el) => [el, false]));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
      setShowStickyBar(![...visible.values()].some(Boolean));
    });
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trackBookStart = () => {
    const attrs = readCampaignAttribution();
    trackCampaignEvent("november_protein_book_start", {
      ...attrs,
      packageId,
      value: price,
    });
    if (packageId != null) {
      trackMetaEvent("InitiateCheckout", {
        content_name: "November Protein Reset",
        content_ids: [String(packageId)],
        value: price,
        currency: "EGP",
        ...attrs,
      });
    }
  };

  const trackWhatsApp = () => {
    trackCampaignEvent("november_protein_whatsapp", {
      ...readCampaignAttribution(),
      packageId,
    });
  };

  const scrollToExperience = () => {
    experienceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!active) {
    return (
      <main dir="rtl" lang="ar" className="min-h-svh overflow-x-clip bg-cut-black font-ui text-cut-ivory antialiased">
        <OfferMobileHeader />
        <div className="mx-auto flex w-full max-w-lg flex-col px-5 pb-16 pt-10 lg:max-w-3xl lg:px-8">
          <p className="text-xs font-bold tracking-[0.22em] text-cut-bronze">انتهى العرض</p>
          <h1 className="mt-4 font-laxr text-[clamp(2.2rem,11vw,3rem)] leading-none text-cut-ivory">
            {novemberProteinOffer.campaignName}
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-cut-ivory/70">
            عرض نوفمبر انتهى في {novemberProteinOffer.endsLabel} 2026. الحجوزات السابقة تظل سارية.
          </p>
          <Link
            href="/"
            className="mt-8 flex h-14 max-w-md items-center justify-center rounded-[18px] bg-cut-gold font-bold text-cut-black"
          >
            العودة للرئيسية
          </Link>
        </div>
      </main>
    );
  }

  const statusNote =
    loadState === "loading"
      ? "جاري تجهيز العرض…"
      : loadState === "missing"
        ? "العرض قيد التفعيل في النظام. تقدر تتواصل معانا على واتساب للحجز."
        : loadState === "error"
          ? "تعذر تحميل الباكدج الآن. استخدم واتساب للمساعدة أو حاول مرة أخرى."
          : "احجز أونلاين، والدفع داخل الفرع.";

  return (
    <main dir="rtl" lang="ar" className="min-h-svh overflow-x-clip bg-cut-black font-ui text-cut-ivory antialiased">
      <OfferMobileHeader />

      <div className="relative mx-auto flex w-full max-w-lg flex-col overflow-x-clip px-4 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:max-w-5xl lg:px-8 lg:pb-16">
        {/* SECTION 1 — HERO */}
        <section
          aria-labelledby="november-headline"
          className="relative grid min-h-[min(78svh,760px)] grid-cols-1 content-center overflow-x-clip py-6 sm:py-8 lg:min-h-[min(72svh,700px)] lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-12"
        >
          <div className={styles.heroGlow} aria-hidden />
          <div className="min-w-0">
            <p className={`${styles.fadeUp} text-[10px] font-bold tracking-[0.2em] text-cut-gold sm:text-[11px] sm:tracking-[0.28em]`}>
              {novemberProteinOffer.campaignLabel}
            </p>
            <p className={`${styles.fadeUpDelay1} mt-3 font-brand text-xs tracking-[0.16em] text-cut-ivory/70 sm:text-sm sm:tracking-[0.2em]`}>
              CUT SALON
            </p>
            <h1
              id="november-headline"
              className={`${styles.fadeUpDelay1} mt-4 max-w-full break-words font-laxr text-[clamp(1.85rem,9.2vw,3.25rem)] leading-[1.05] text-cut-ivory sm:mt-5 lg:text-[clamp(2.75rem,4.5vw,4rem)]`}
            >
              {novemberProteinOffer.headlineEn}
            </h1>
            <p className={`${styles.fadeUpDelay2} mt-4 max-w-full break-words text-[clamp(1rem,4.2vw,1.125rem)] leading-7 text-cut-ivory/85 sm:leading-8 lg:max-w-xl lg:text-lg`}>
              {novemberProteinOffer.messageAr}
            </p>
            <p
              className={`${styles.fadeUpDelay2} mt-3 max-w-full break-words text-[clamp(0.8rem,3.6vw,0.95rem)] leading-6 text-cut-ivory/65 lg:text-base`}
              dir="ltr"
            >
              {novemberProteinOffer.servicesLineEn}
            </p>
          </div>

          <div className="min-w-0 lg:rounded-3xl lg:border lg:border-cut-bronze/20 lg:bg-cut-soft-black/40 lg:px-8 lg:py-9">
            <div className={`${styles.fadeUpDelay3} mt-7 w-full max-w-full overflow-x-clip sm:mt-8 lg:mt-0`} data-testid="november-protein-price">
              <strong className="flex max-w-full flex-wrap items-baseline gap-x-[0.18em] gap-y-1 font-ui text-[clamp(2.6rem,14vw,4.5rem)] font-black leading-none text-cut-gold lg:text-[4.25rem]">
                <span dir="ltr" className="min-w-0 break-all">
                  {price}
                </span>
                <span className="shrink-0 text-[0.36em] font-bold leading-none sm:text-[0.38em]">
                  {novemberProteinOffer.currencyAr}
                </span>
              </strong>
              <p className="mt-2 max-w-full break-words text-[11px] tracking-[0.14em] text-cut-bronze sm:text-xs sm:tracking-[0.18em]">
                {novemberProteinOffer.campaignName}
              </p>
            </div>

            <div ref={heroCtaRef} className={`${styles.fadeUpDelay3} mt-8 flex w-full flex-col gap-3 lg:mt-7`}>
              <BookCta href={bookHref} disabled={!bookingReady} onClick={trackBookStart} />
              <button
                type="button"
                onClick={scrollToExperience}
                className="flex h-12 w-full items-center justify-center rounded-[18px] border border-cut-bronze/35 text-[15px] font-bold text-cut-ivory/90 transition hover:border-cut-gold/45"
              >
                شوف التجربة
              </button>
              <p className="text-center text-sm leading-6 text-cut-ivory/60">{statusNote}</p>
            </div>
          </div>
        </section>

        {/* SECTION 2 — THE TRANSFORM */}
        <section aria-labelledby="november-transform" className="mt-6 scroll-mt-20 lg:mt-10">
          <h2 id="november-transform" className="font-laxr text-2xl text-cut-ivory lg:text-3xl">
            THE TRANSFORM
          </h2>
          <p className="mt-2 text-[15px] leading-7 text-cut-ivory/65 lg:max-w-2xl lg:text-base">نتائج حقيقية من CUT — هنضيف الفيديو والمعرض بعد اعتماد الأصول.</p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-cut-bronze/25 bg-cut-soft-black lg:mx-auto lg:max-w-3xl">
            {NOVEMBER_TRANSFORM_MEDIA.video.available ? (
              <video
                className="aspect-[9/16] max-h-[70svh] w-full bg-black object-cover lg:aspect-video lg:max-h-[28rem]"
                src={NOVEMBER_TRANSFORM_MEDIA.video.src}
                poster={NOVEMBER_TRANSFORM_MEDIA.video.poster}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 p-6 text-center">
                <p className="font-laxr text-xl text-cut-ivory/80">Transformation video</p>
                <p className="text-sm text-cut-ivory/50">15–25s · placeholder until approved assets</p>
              </div>
            )}
          </div>
          {!NOVEMBER_TRANSFORM_MEDIA.gallery.available ? (
            <div className="mt-3 grid grid-cols-2 gap-3 lg:mx-auto lg:max-w-3xl lg:gap-4">
              {["Before", "After"].map((label) => (
                <div
                  key={label}
                  className="flex aspect-[3/4] items-end rounded-2xl border border-dashed border-cut-bronze/30 bg-cut-espresso/80 p-3 lg:aspect-[4/3]"
                >
                  <span className="text-xs tracking-[0.16em] text-cut-bronze">{label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* SECTION 3 — THE EXPERIENCE */}
        <section
          ref={experienceRef}
          id="november-experience"
          aria-labelledby="november-experience-title"
          className="mt-12 scroll-mt-24 lg:mt-16"
        >
          <h2 id="november-experience-title" className="font-laxr text-2xl text-cut-ivory lg:text-3xl">
            THE EXPERIENCE
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {NOVEMBER_EXPERIENCE_STEPS.map((step) => (
              <li
                key={step.id}
                className="rounded-2xl border border-cut-bronze/25 bg-gradient-to-l from-cut-soft-black to-cut-espresso px-4 py-5 lg:px-5 lg:py-6"
              >
                <p className="text-[12px] font-bold tracking-[0.2em] text-cut-gold" dir="ltr">
                  {step.number}
                </p>
                <h3 className="mt-2 font-brand text-xl tracking-wide text-cut-ivory" dir="ltr">
                  {step.nameEn}
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-cut-ivory/75">{step.descriptionAr}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* SECTION 4 — THE OFFER */}
        <section
          aria-labelledby="november-offer-title"
          className="mt-12 rounded-2xl border border-cut-gold/25 bg-cut-wine-black/60 px-5 py-7 lg:mt-16 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:py-9"
        >
          <div>
            <p className="text-[11px] font-bold tracking-[0.24em] text-cut-gold">{novemberProteinOffer.campaignLabel}</p>
            <h2 id="november-offer-title" className="mt-3 font-laxr text-[clamp(1.75rem,8vw,2.25rem)] text-cut-ivory lg:text-4xl">
              {novemberProteinOffer.campaignName}
            </h2>
            <p className="mt-4 flex items-baseline gap-2 font-ui text-4xl font-black text-cut-gold">
              <span dir="ltr">{price}</span>
              <span className="text-base font-bold">{novemberProteinOffer.currencyAr}</span>
            </p>
            <p className="mt-3 text-sm text-cut-ivory/70">
              <time dateTime={novemberProteinOffer.startsOn}>{novemberProteinOffer.startsLabel}</time>
              {" – "}
              <time dateTime={novemberProteinOffer.endsOn}>{novemberProteinOffer.endsLabel}</time>
              {" 2026"}
            </p>
          </div>
          <ul className="mt-5 space-y-2 text-[14px] leading-7 text-cut-ivory/80 lg:mt-0">
            {NOVEMBER_OFFER_TERMS.map((term) => (
              <li key={term} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cut-gold/80" aria-hidden />
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* SECTION 5 — BOOK */}
        <section
          ref={bookSectionRef}
          id="november-book"
          aria-labelledby="november-book-title"
          className="mt-12 scroll-mt-24 pb-6 lg:mt-16"
        >
          <h2 id="november-book-title" className="font-laxr text-2xl text-cut-ivory lg:text-3xl">
            BOOK YOUR EXPERIENCE
          </h2>
          <p className="mt-2 text-[15px] leading-7 text-cut-ivory/65">اختار الفرع والحلاق، والباكدج يتحدد تلقائيًا في الحجز.</p>

          <ul className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            {NOVEMBER_BRANCHES.map((branch) => {
              const href =
                bookingReady && packageId != null ? buildNovemberBookHref(packageId, branch.code) : null;
              return (
                <li key={branch.code} className="rounded-2xl border border-cut-bronze/25 bg-cut-soft-black px-4 py-4 lg:px-5 lg:py-5">
                  <p className="text-xs font-bold text-cut-gold">{branch.tag}</p>
                  <h3 className="mt-1 text-lg font-bold text-cut-ivory">{branch.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-cut-ivory/60">{branch.address}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold">
                    <a
                      href={branch.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cut-bronze underline-offset-4 hover:text-cut-gold hover:underline"
                    >
                      اللوكيشن
                    </a>
                    {href ? (
                      <Link href={href} onClick={trackBookStart} className="text-cut-gold underline-offset-4 hover:underline">
                        احجز في الفرع ده
                      </Link>
                    ) : (
                      <span className="text-cut-ivory/40">الحجز غير متاح حاليًا</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex w-full max-w-md flex-col gap-3 lg:mx-auto lg:max-w-lg">
            <BookCta href={bookHref} disabled={!bookingReady} onClick={trackBookStart} />
            <a
              href={novemberProteinOffer.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsApp}
              className="flex h-12 w-full items-center justify-center rounded-[18px] border border-cut-bronze/35 text-[15px] font-bold text-cut-ivory/90 transition hover:border-cut-gold/45"
            >
              واتساب للمساعدة
            </a>
            <p className="text-center text-sm text-cut-ivory/55" data-testid="november-book-status">
              {statusNote}
            </p>
            {bookingReady ? (
              <p className="text-center text-sm font-bold text-cut-gold">
                السعر النهائي: <span dir="ltr">{price}</span> {novemberProteinOffer.currencyAr}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div
        data-testid="november-protein-sticky-bar"
        aria-hidden={!showStickyBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-cut-bronze/20 bg-cut-black/90 backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto flex w-full max-w-lg items-center gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:gap-3 sm:px-5">
          <p className="flex min-w-0 shrink flex-col leading-tight">
            <strong className="font-ui text-[clamp(1.15rem,5vw,1.5rem)] font-black leading-none text-cut-gold">
              <span dir="ltr">{price}</span>
              <span className="ms-1 text-[0.55em] font-bold">{novemberProteinOffer.currencyAr}</span>
            </strong>
          </p>
          <div className="min-w-0 flex-1">
            <BookCta
              href={bookHref}
              disabled={!bookingReady}
              compact
              onClick={trackBookStart}
              label="احجز العرض الآن"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
