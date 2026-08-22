"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Star, User } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import BarberPhoto from "@/components/BarberPhoto";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  listBranchBarbers,
  resolveBarberDisplayName,
  resolveBarberPhotoUrl,
  type PublicBarber,
} from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { readBookFlowDraft, saveBookFlowDraft } from "@/lib/book-flow-draft";
import { resolveBookBranchHeroLabel } from "@/lib/booking/branch-label";

type Selection = "nearest" | number;

function canServeSelected(barber: PublicBarber, serviceIds: number[]) {
  if (!serviceIds.length) return true;
  if (!barber.serviceIds?.length) return true;
  const allowed = new Set(barber.serviceIds);
  return serviceIds.every((id) => allowed.has(id));
}

export default function BookProfessionalsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();

  const branchFromQuery = normalizeBranchCode(searchParams.get("branch") ?? "");
  const visitParam = searchParams.get("visit");
  const visitKind = visitParam === "group" ? "group" : "individual";

  const draft = useMemo(() => readBookFlowDraft(), []);
  const serviceIds = useMemo(() => {
    const fromQuery = (searchParams.get("services") ?? "")
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (fromQuery.length) return fromQuery;
    return draft?.serviceIds ?? [];
  }, [searchParams, draft]);

  const branchCode =
    normalizeBranchCode(selectedBranch?.branchCode ?? "") ||
    branchFromQuery ||
    normalizeBranchCode(draft?.branchCode ?? "");

  const servicesHref = branchCode
    ? `/book/services?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";

  const [barbers, setBarbers] = useState<PublicBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Selection>("nearest");
  const [reloadToken, setReloadToken] = useState(0);

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
    if (!serviceIds.length) {
      router.replace(servicesHref);
    }
  }, [serviceIds.length, router, servicesHref]);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await listBranchBarbers(branchCode, controller.signal);
        if (cancelled) return;
        const list = (res.data ?? []).filter(
          (b) => b.isBookableOnline !== false && b.id > 0,
        );
        setBarbers(list.filter((b) => canServeSelected(b, serviceIds)));
      } catch {
        if (!cancelled) {
          setError(true);
          setBarbers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchCode, reloadToken, serviceIds]);

  const branchLabel =
    selectedBranch?.shortName || selectedBranch?.branchName || branchCode;

  const confirm = () => {
    if (!branchCode || !serviceIds.length) return;

    if (selected === "nearest") {
      saveBookFlowDraft({
        branchCode,
        visit: visitKind,
        serviceIds,
        professional: { kind: "nearest" },
      });
    } else {
      const barber = barbers.find((b) => b.id === selected);
      if (!barber) return;
      saveBookFlowDraft({
        branchCode,
        visit: visitKind,
        serviceIds,
        professional: {
          kind: "specific",
          id: barber.id,
          name: resolveBarberDisplayName(barber, lang),
          image: resolveBarberPhotoUrl(barber),
          role: barber.job || (ar ? "حلاق Cut Salon" : "CUT Salon Barber"),
          serviceIds: barber.serviceIds,
        },
      });
    }

    router.push(
      `/book/cart?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`,
    );
  };

  const rowClass =
    "flex w-full min-h-[3.75rem] items-center gap-2.5 px-3 py-2 text-start transition hover:bg-cut-warm-paper/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-burgundy sm:px-6 md:gap-3 md:px-5 md:py-4";

  return (
    <BookFlowChrome
      backHref={servicesHref}
      backLabel={ar ? "رجوع للخدمات" : "Back to services"}
      footer={false}
      entryScroll={false}
      heroTitle={ar ? "اختر الحلاق" : "Select a professional"}
      heroBranchLabel={resolveBookBranchHeroLabel(branchCode, branchLabel, lang)}
      heroBranchCode={branchCode || undefined}
    >
      <section className="relative bg-cut-soft-ivory pb-28 md:-mt-4 md:rounded-t-[1.75rem] md:shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <BookDelayedWaitingOverlay
          busy={loading}
          delayMs={800}
          lang={lang}
          label={ar ? "جاري تحميل الحلاقين…" : "Loading professionals…"}
        />
        <div className="hidden border-b border-cut-black/10 px-5 py-5 sm:px-6 md:block">
          <h1 className="text-[13px] font-black uppercase tracking-[0.16em] text-cut-black">
            {ar ? "اختر الحلاق" : "Select a professional"}
          </h1>
          {branchLabel ? (
            <p className="mt-2 text-sm text-cut-black/55">
              {ar ? "الفرع:" : "Location:"}{" "}
              <span className="font-semibold text-cut-black">{branchLabel}</span>
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-cut-black/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ar ? "جاري تحميل الحلاقين…" : "Loading professionals…"}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-cut-black/65">
              {ar ? "تعذر تحميل الحلاقين. حاول مرة أخرى." : "Couldn't load professionals. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => setReloadToken((n) => n + 1)}
              className="mt-4 inline-flex min-h-11 items-center bg-cut-black px-5 text-sm font-bold text-cut-ivory"
            >
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <ul className="space-y-2 px-3 py-1 md:divide-y md:divide-cut-black/10 md:space-y-0 md:px-0 md:py-0">
            <li>
              <button
                type="button"
                onClick={() => setSelected("nearest")}
                className={`${rowClass} rounded-xl border border-cut-black/10 bg-cut-ivory/90 md:rounded-none md:border-0 md:bg-transparent`}
                aria-pressed={selected === "nearest"}
              >
                <span
                  className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 md:flex ${
                    selected === "nearest"
                      ? "border-cut-burgundy bg-cut-burgundy"
                      : "border-cut-black/25 bg-transparent"
                  }`}
                  aria-hidden
                >
                  {selected === "nearest" ? (
                    <span className="h-2 w-2 rounded-full bg-cut-ivory" />
                  ) : null}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cut-warm-paper text-cut-burgundy md:h-11 md:w-11">
                  <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-tight text-cut-black md:text-[15px]">
                    {ar ? "أول حلاق متاح" : "First Available"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-cut-black/50 md:text-[13px]">
                    {ar ? "أقرب ميعاد مناسب" : "Earliest suitable slot"}
                  </span>
                </span>
              </button>
            </li>

            {barbers.map((barber) => {
              const active = selected === barber.id;
              const name = resolveBarberDisplayName(barber, lang);
              const role = barber.job || (ar ? "حلاق Cut Salon" : "CUT Salon Barber");
              return (
                <li key={barber.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(barber.id)}
                    className={`${rowClass} rounded-xl border border-cut-black/10 bg-cut-ivory/90 md:rounded-none md:border-0 md:bg-transparent`}
                    aria-pressed={active}
                  >
                    <span
                      className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 md:flex ${
                        active
                          ? "border-cut-burgundy bg-cut-burgundy"
                          : "border-cut-black/25 bg-transparent"
                      }`}
                      aria-hidden
                    >
                      {active ? <span className="h-2 w-2 rounded-full bg-cut-ivory" /> : null}
                    </span>
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-cut-bronze/30 bg-cut-warm-paper md:h-11 md:w-11">
                      {resolveBarberPhotoUrl(barber) ? (
                        <BarberPhoto
                          src={resolveBarberPhotoUrl(barber)}
                          name={name}
                          className="h-full w-full"
                          imgClassName="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-cut-black/35">
                          <User className="h-4 w-4" strokeWidth={1.6} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold leading-tight text-cut-black md:text-[15px]">
                        {name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-cut-black/50 md:text-[13px]">
                        {role}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loading && !error && barbers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-cut-black/55">
            {ar
              ? "لا يوجد حلاقين مطابقين للخدمات المختارة — يمكنك المتابعة بأول حلاق متاح."
              : "No matching professionals for these services — you can continue with First Available."}
          </p>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cut-black/10 bg-cut-soft-ivory/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={confirm}
            disabled={loading || (!!error && selected !== "nearest")}
            className="inline-flex min-h-12 w-full items-center justify-center bg-cut-black text-sm font-bold uppercase tracking-[0.14em] text-cut-ivory transition hover:bg-cut-wine-black disabled:opacity-50"
          >
            {ar ? "إضافة" : "Add"}
          </button>
        </div>
      </section>
    </BookFlowChrome>
  );
}
