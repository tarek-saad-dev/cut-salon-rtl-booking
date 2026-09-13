"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Clock3, ListOrdered, Sparkles, X } from "lucide-react";
import type { Language } from "@/lib/i18n/types";
import {
  getServiceSteps,
  type ServiceStep,
} from "@/lib/serviceStepsApi";

type Localized = Record<Language, string>;

export type ServiceStepsTarget = {
  id: string;
  name: Localized;
  price: number;
  durationMinutes?: number | null;
  steps?: ServiceStep[] | null;
};

type ServiceStepsSheetProps = {
  open: boolean;
  onClose: () => void;
  service: ServiceStepsTarget | null;
  language: Language;
};

const t = (value: Localized, language: Language) => value[language];

const formatPrice = (price: number, language: Language) => {
  const amount = new Intl.NumberFormat("en-US").format(price);
  return language === "ar" ? `${amount} ج.م` : `EGP ${amount}`;
};

const formatDuration = (minutes: number, language: Language) =>
  language === "ar" ? `${minutes} دقيقة` : `${minutes} min`;

const stepTitle = (step: ServiceStep, language: Language) =>
  language === "ar" ? step.titleAr || step.titleEn || "" : step.titleEn || step.titleAr || "";

const stepDetail = (step: ServiceStep, language: Language) =>
  language === "ar" ? step.detailAr || step.detailEn : step.detailEn || step.detailAr;

export default function ServiceStepsSheet({ open, onClose, service, language }: ServiceStepsSheetProps) {
  const ar = language === "ar";
  const dir = ar ? "rtl" : "ltr";
  const serviceId = service?.id ?? "";
  const embeddedSteps = service?.steps?.length ? service.steps : null;

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["service-steps", serviceId],
    queryFn: () => getServiceSteps(serviceId),
    enabled: open && Boolean(serviceId) && !embeddedSteps,
    staleTime: 5 * 60_000,
  });

  const steps = embeddedSteps ?? data ?? [];
  const stepsDuration = steps.reduce((sum, step) => sum + (step.durationMinutes || 0), 0);
  const totalDuration = stepsDuration || service?.durationMinutes || 0;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !service) return null;

  const loading = !embeddedSteps && (isPending || isFetching);
  const arrow = ar ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />;

  return (
    <div className="fixed inset-0 z-[70]" dir={dir} data-service-steps-sheet>
      <button
        type="button"
        aria-label={ar ? "إغلاق" : "Close"}
        className="absolute inset-0 bg-cut-black/70 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-steps-title"
        className="
          absolute inset-x-0 bottom-0 flex max-h-[min(92vh,760px)] flex-col overflow-hidden
          rounded-t-[1.5rem] border-t border-cut-bronze/35
          bg-[linear-gradient(165deg,#170406_0%,#050505_48%,#0f0c0b_100%)] text-cut-ivory
          shadow-[0_-24px_64px_rgba(0,0,0,0.45)]
          pb-[max(0.75rem,env(safe-area-inset-bottom))]
          md:inset-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[min(88vh,720px)]
          md:w-[min(100%-2rem,440px)] md:-translate-x-1/2 md:-translate-y-1/2
          md:rounded-2xl md:border md:border-cut-bronze/30
        "
      >
        <div className="flex justify-center pt-3 md:hidden" aria-hidden>
          <span className="h-1 w-11 rounded-full bg-cut-bronze/45" />
        </div>

        <div className="relative border-b border-cut-ivory/10 px-5 pb-5 pt-3 md:px-6 md:pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cut-bronze/30 bg-cut-black/40 text-cut-ivory/80 transition hover:bg-cut-burgundy/50 hover:text-cut-ivory end-4 md:top-5"
            aria-label={ar ? "إغلاق" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-cut-bronze">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            <p className="font-display text-[10px] tracking-[0.32em]">
              {ar ? "تجربة الجلسة" : "THE SESSION RITUAL"}
            </p>
          </div>

          <h2
            id="service-steps-title"
            className={`mt-3 max-w-[85%] text-2xl font-black leading-tight tracking-tight md:text-3xl ${ar ? "" : "font-editorial font-semibold"}`}
          >
            {t(service.name, language)}
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-cut-ivory/65">
            {ar
              ? "مش مجرد خدمة — بروتوكول مرتب خطوة بخطوة عشان تحس إنك واخد قيمة كاملة."
              : "Not just a service — a sequenced protocol so every minute feels worth it."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-cut-bronze/40 bg-cut-bronze/10 px-3 py-1.5 text-sm font-black tabular-nums text-cut-warm-beige">
              {formatPrice(service.price, language)}
            </span>
            {steps.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-cut-ivory/15 bg-cut-black/35 px-2.5 py-1.5 text-xs font-bold text-cut-ivory/80">
                <ListOrdered className="h-3.5 w-3.5 text-cut-bronze" />
                {ar ? `${steps.length} مرحلة` : `${steps.length} stages`}
              </span>
            )}
            {totalDuration > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-cut-ivory/15 bg-cut-black/35 px-2.5 py-1.5 text-xs font-bold text-cut-ivory/80">
                <Clock3 className="h-3.5 w-3.5 text-cut-bronze" />
                {formatDuration(totalDuration, language)}
              </span>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {loading && (
            <div className="space-y-3 py-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-cut-ivory/10 bg-cut-ivory/[0.04]" />
              ))}
            </div>
          )}

          {!loading && isError && (
            <div className="rounded-xl border border-dashed border-cut-bronze/35 bg-cut-black/30 px-4 py-10 text-center">
              <p className="text-sm font-bold text-cut-warm-beige">
                {ar ? "تعذّر تحميل مراحل الخدمة الآن." : "Couldn't load the service stages right now."}
              </p>
              <p className="mt-2 text-xs leading-6 text-cut-ivory/55">
                {ar ? "جرّب تاني بعد لحظات." : "Please try again in a moment."}
              </p>
            </div>
          )}

          {!loading && !isError && steps.length === 0 && (
            <div className="rounded-xl border border-dashed border-cut-bronze/35 bg-cut-black/30 px-4 py-10 text-center">
              <p className="text-sm font-bold text-cut-warm-beige">
                {ar ? "تفاصيل المراحل هتتضاف قريبًا." : "Stage details will be added soon."}
              </p>
            </div>
          )}

          {!loading && !isError && steps.length > 0 && (
            <ol className="relative space-y-0">
              <span
                aria-hidden
                className="absolute top-3 bottom-3 w-px bg-gradient-to-b from-cut-bronze/70 via-cut-bronze/25 to-transparent start-4"
              />
              {steps.map((step, index) => {
                const detail = stepDetail(step, language);
                return (
                  <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
                    <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cut-bronze/55 bg-cut-burgundy text-[11px] font-black tabular-nums text-cut-warm-beige shadow-[0_0_18px_rgba(164,136,121,0.22)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-cut-ivory/10 bg-cut-ivory/[0.035] px-3.5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[0.95rem] font-bold leading-6 text-cut-ivory">
                          {stepTitle(step, language)}
                        </h3>
                        {step.durationMinutes ? (
                          <span className="shrink-0 text-[11px] font-bold tabular-nums text-cut-bronze">
                            {formatDuration(step.durationMinutes, language)}
                          </span>
                        ) : null}
                      </div>
                      {detail ? (
                        <p className="mt-1.5 text-sm leading-6 text-cut-ivory/62">{detail}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="border-t border-cut-ivory/10 px-5 py-4 md:px-6">
          <a
            href="/#barbers"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-cut-ivory px-5 py-3 text-sm font-bold text-cut-black transition hover:bg-cut-soft-ivory"
          >
            {ar ? "احجز الخدمة دي" : "Book this service"}
            {arrow}
          </a>
        </div>
      </div>
    </div>
  );
}
