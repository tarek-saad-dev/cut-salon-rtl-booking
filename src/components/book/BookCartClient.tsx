"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import { getServices, type BookingService } from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { readBookFlowDraft, saveBookFlowDraft } from "@/lib/book-flow-draft";

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

  const barberLabel =
    professional?.kind === "specific"
      ? professional.name
      : ar
        ? "أول حلاق متاح"
        : "the first available";

  const withLabel = ar ? `مع ${barberLabel}` : `with ${barberLabel}`;

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
    >
      <section className="relative -mt-4 min-h-[55svh] rounded-t-[1.75rem] bg-cut-soft-ivory pb-36 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <BookDelayedWaitingOverlay
          busy={loading}
          delayMs={800}
          lang={lang}
          label={ar ? "جاري تحميل السلة…" : "Loading cart…"}
        />
        <div className="px-5 pt-6 sm:px-6">
          <h1 className="text-[13px] font-black uppercase tracking-[0.16em] text-cut-black">
            {ar ? "سلتك" : "Your cart"}
          </h1>
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
          <>
            <ul className="mt-2 divide-y divide-cut-black/10">
              {selectedServices.map((service) => (
                <li key={service.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-cut-black">
                        {serviceLabel(service, lang)}
                      </p>
                      <p className="mt-1 text-[13px] text-cut-black/55">{withLabel}</p>
                    </div>
                    <p className="shrink-0 text-[15px] font-bold text-cut-black">
                      {money(service.price ?? 0, lang)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-5 pt-5 sm:px-6">
              <button
                type="button"
                onClick={goAddMore}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-cut-black bg-transparent px-5 text-sm font-bold text-cut-black transition hover:bg-cut-warm-paper"
              >
                {ar ? "أضف المزيد" : "Add More"}
              </button>
            </div>
          </>
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
