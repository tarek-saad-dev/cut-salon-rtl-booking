"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Loader2, Plus, Scissors, User } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import { getServices, type BookingService } from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { readBookFlowDraft, saveBookFlowDraft } from "@/lib/book-flow-draft";
import { resolveBookBranchHeroLabel } from "@/lib/booking/branch-label";

function serviceLabel(service: BookingService, lang: "ar" | "en") {
  if (lang === "ar") return (service.nameAr || service.name || service.nameEn || "").trim();
  return (service.nameEn || service.name || service.nameAr || "").trim();
}

function money(value: number, lang: "ar" | "en") {
  const n = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(value);
  return lang === "ar" ? `${n} ج.م` : `EGP ${n}`;
}

export default function BookCartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();

  const draft = useMemo(() => readBookFlowDraft(), []);
  const branchFromQuery = normalizeBranchCode(searchParams.get("branch") ?? "");
  const visitParam = searchParams.get("visit");
  const visitKind =
    visitParam === "group" || draft?.visit === "group" ? "group" : "individual";

  const branchCode =
    normalizeBranchCode(selectedBranch?.branchCode ?? "") ||
    branchFromQuery ||
    normalizeBranchCode(draft?.branchCode ?? "");

  const serviceIds = draft?.serviceIds ?? [];
  const professional = draft?.professional ?? null;

  const professionalsHref = branchCode
    ? `/book/professionals?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}&services=${serviceIds.join(",")}`
    : "/book";
  const servicesHref = branchCode
    ? `/book/services?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";
  const phoneHref = branchCode
    ? `/book/phone?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";

  const [catalog, setCatalog] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isLoadingBranches) return;
    if (selectedBranch) return;
    if (branchCode) {
      const match = branches.find(
        (b) => normalizeBranchCode(b.branchCode) === branchCode,
      );
      if (match) {
        selectBranch(match);
        return;
      }
    }
    router.replace("/book");
  }, [isLoadingBranches, selectedBranch, branchCode, branches, selectBranch, router]);

  useEffect(() => {
    if (!serviceIds.length || !professional) {
      router.replace(professionalsHref);
    }
  }, [serviceIds.length, professional, router, professionalsHref]);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await getServices(branchCode, controller.signal);
        if (cancelled) return;
        setCatalog(res.data?.services ?? []);
      } catch {
        if (!cancelled) {
          setError(true);
          setCatalog([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchCode]);

  const selectedServices = useMemo(() => {
    const map = new Map(catalog.map((s) => [s.id, s]));
    return serviceIds.map((id) => map.get(id)).filter(Boolean) as BookingService[];
  }, [catalog, serviceIds]);

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0,
  );

  const barberLabel =
    professional?.kind === "specific"
      ? professional.name
      : ar
        ? "أول حلاق متاح"
        : "First Available";

  const branchLabel = selectedBranch
    ? (selectedBranch.shortName || selectedBranch.branchName || "").trim()
    : branchCode;

  const goAddMore = () => {
    if (!branchCode) return;
    saveBookFlowDraft({
      branchCode,
      visit: visitKind,
      serviceIds,
      professional,
      customer: draft?.customer ?? null,
    });
    router.push(servicesHref);
  };

  const goNext = () => {
    if (!branchCode || !serviceIds.length || !professional) return;
    saveBookFlowDraft({
      branchCode,
      visit: visitKind,
      serviceIds,
      professional,
      customer: draft?.customer ?? null,
    });
    router.push(phoneHref);
  };

  return (
    <BookFlowChrome
      backHref={professionalsHref}
      backLabel={ar ? "رجوع للحلاقين" : "Back to professionals"}
      footer={false}
      entryScroll={false}
      heroTitle={ar ? "سلتك" : "Your cart"}
      heroBranchLabel={resolveBookBranchHeroLabel(
        branchCode,
        selectedBranch?.branchName || selectedBranch?.shortName,
        lang,
      )}
      heroBranchCode={branchCode || undefined}
    >
      <section className="relative bg-cut-soft-ivory pb-36 md:-mt-4 md:min-h-[55svh] md:rounded-t-[1.75rem] md:shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <BookDelayedWaitingOverlay
          busy={loading}
          delayMs={800}
          lang={lang}
          label={ar ? "جاري تحميل السلة…" : "Loading cart…"}
        />

        <div className="hidden border-b border-cut-black/10 px-5 py-5 sm:px-6 md:block">
          <h1 className="text-[13px] font-black uppercase tracking-[0.16em] text-cut-black">
            {ar ? "سلتك" : "Your cart"}
          </h1>
          <p className="mt-2 text-sm text-cut-black/55">
            {ar
              ? "راجع خدماتك قبل متابعة الحجز."
              : "Review your services before continuing."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-cut-black/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ar ? "جاري تحميل السلة…" : "Loading cart…"}
          </div>
        ) : null}

        {!loading && error ? (
          <p className="px-5 py-12 text-center text-sm text-cut-black/65">
            {ar ? "تعذر تحميل تفاصيل الخدمات." : "Couldn't load service details."}
          </p>
        ) : null}

        {!loading && !error ? (
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="rounded-2xl border border-cut-burgundy/15 bg-cut-ivory/90 px-4 py-3.5 shadow-[0_8px_28px_rgba(74,0,15,0.05)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cut-burgundy/10 text-cut-burgundy">
                  <User className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cut-black/45">
                    {ar ? "الحلاق" : "Professional"}
                  </p>
                  <p className="truncate text-[15px] font-bold text-cut-black">{barberLabel}</p>
                  {branchLabel ? (
                    <p className="mt-0.5 truncate text-[12px] text-cut-black/50">{branchLabel}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-cut-black/10 bg-cut-ivory">
              <div className="flex items-center justify-between border-b border-cut-black/8 px-4 py-3">
                <p className="inline-flex items-center gap-1.5 text-[13px] font-bold text-cut-black">
                  <Scissors className="h-3.5 w-3.5 text-cut-burgundy" strokeWidth={2} />
                  {ar ? "الخدمات" : "Services"}
                </p>
                <p className="text-[12px] text-cut-black/45">
                  {selectedServices.length}{" "}
                  {ar
                    ? selectedServices.length === 1
                      ? "خدمة"
                      : "خدمات"
                    : selectedServices.length === 1
                      ? "service"
                      : "services"}
                </p>
              </div>

              <ul className="divide-y divide-cut-black/8">
                {selectedServices.map((service) => (
                  <li key={service.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-cut-black">
                        {serviceLabel(service, lang)}
                      </p>
                      {service.durationMinutes ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-cut-black/50">
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          {service.durationMinutes} {ar ? "دقيقة" : "min"}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-[15px] font-bold text-cut-burgundy">
                      {money(service.price ?? 0, lang)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-cut-black/10 bg-cut-warm-paper/40 px-4 py-3.5">
                {totalDuration > 0 ? (
                  <div className="flex items-center justify-between text-[13px] text-cut-black/60">
                    <span>{ar ? "المدة الإجمالية" : "Total duration"}</span>
                    <span className="font-semibold text-cut-black">
                      {totalDuration} {ar ? "دقيقة" : "min"}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-cut-black">
                    {ar ? "الإجمالي" : "Total"}
                  </span>
                  <span className="text-[17px] font-black text-cut-burgundy">
                    {money(totalPrice, lang)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goAddMore}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-cut-burgundy/25 bg-cut-ivory px-5 text-sm font-bold text-cut-burgundy transition hover:border-cut-burgundy/45 hover:bg-cut-warm-paper"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              {ar ? "أضف خدمة أخرى" : "Add another service"}
            </button>
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cut-black/10 bg-cut-soft-ivory/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={goNext}
            disabled={loading || error || selectedServices.length === 0 || !professional}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cut-black text-sm font-bold uppercase tracking-[0.14em] text-cut-ivory transition hover:bg-cut-wine-black disabled:opacity-50"
          >
            {ar ? "التالي" : "Next"}
          </button>
        </div>
      </section>
    </BookFlowChrome>
  );
}
