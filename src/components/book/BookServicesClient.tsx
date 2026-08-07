"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import BookingServiceStep from "@/components/booking-services/BookingServiceStep";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getServices,
  type BookingMostPopularSection,
  type BookingService,
  type BookingServiceCategory,
} from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { getCoreServiceIdSet, isCoreService } from "@/lib/bookingServiceGroups";
import { readBookFlowDraft, saveBookFlowDraft } from "@/lib/book-flow-draft";

type VisitKind = "individual" | "group";

const MAX_SERVICES = 12;

export default function BookServicesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();

  const branchFromQuery = normalizeBranchCode(searchParams.get("branch") ?? "");
  const visitParam = searchParams.get("visit");
  const visitKind: VisitKind = visitParam === "group" ? "group" : "individual";

  const [services, setServices] = useState<BookingService[]>([]);
  const [categories, setCategories] = useState<BookingServiceCategory[]>([]);
  const [mostPopular, setMostPopular] = useState<BookingMostPopularSection | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const branchCode =
    normalizeBranchCode(selectedBranch?.branchCode ?? "") || branchFromQuery;

  const visitTypeHref = branchCode
    ? `/book/visit-type?branch=${encodeURIComponent(branchCode)}`
    : "/book";

  useEffect(() => {
    if (isLoadingBranches) return;
    if (selectedBranch) return;
    if (branchFromQuery) {
      const match = branches.find(
        (b) => normalizeBranchCode(b.branchCode) === branchFromQuery,
      );
      if (match) {
        selectBranch(match);
        return;
      }
    }
    router.replace("/book");
  }, [isLoadingBranches, selectedBranch, branchFromQuery, branches, selectBranch, router]);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const servicesRes = await getServices(branchCode, controller.signal);
        if (cancelled) return;
        if (!servicesRes.data) throw new Error("services");
        setServices(servicesRes.data.services ?? []);
        setCategories(servicesRes.data.categories ?? []);
        setMostPopular(servicesRes.data.mostPopular ?? null);
      } catch {
        if (!cancelled) {
          setError(true);
          setServices([]);
          setCategories([]);
          setMostPopular(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchCode, reloadToken]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds],
  );

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0,
  );

  const onCoreSelect = useCallback(
    (id: number) => {
      const coreIds = getCoreServiceIdSet(services);
      const nonCore = selectedIds.filter((sid) => !coreIds.has(sid));
      setSelectedIds([id, ...nonCore]);
    },
    [services, selectedIds],
  );

  const onToggleService = useCallback(
    (id: number) => {
      setSelectedIds((current) => {
        if (current.includes(id)) return current.filter((sid) => sid !== id);
        if (current.length >= MAX_SERVICES) return current;
        const service = services.find((s) => s.id === id);
        if (service && isCoreService(service)) {
          const coreIds = getCoreServiceIdSet(services);
          const nonCore = current.filter((sid) => !coreIds.has(sid));
          return [id, ...nonCore];
        }
        return [...current, id];
      });
    },
    [services],
  );

  const onContinue = () => {
    if (!branchCode || selectedIds.length === 0) return;
    const existing = readBookFlowDraft();
    saveBookFlowDraft({
      branchCode,
      visit: visitKind,
      serviceIds: selectedIds,
      professional: existing?.professional ?? null,
    });
    const code = encodeURIComponent(branchCode);
    const services = selectedIds.join(",");
    router.push(`/book/professionals?branch=${code}&visit=${visitKind}&services=${services}`);
  };

  return (
    <BookFlowChrome
      backHref={visitTypeHref}
      backLabel={ar ? "رجوع لنوع الزيارة" : "Back to visit type"}
      footer={false}
      heroTitle={ar ? "اختر خدمتك الأساسية" : "Choose your core service"}
      heroMeta={
        ar
          ? "ابدأ بالخدمة الرئيسية المناسبة لك"
          : "Start with the main service that suits you"
      }
    >
      <div
        className="booking-modal-shell relative -mt-4 rounded-t-[1.75rem] border-b border-cut-black/10 bg-cut-soft-ivory text-cut-black shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
        style={
          {
            ["--booking-bg"]: "#f4ebdd",
            ["--booking-surface"]: "#efe4d2",
            ["--booking-surface-hover"]: "#e8dcc8",
            ["--booking-sidebar-bg"]: "#f4ebdd",
            ["--booking-border"]: "rgba(5,5,5,0.12)",
            ["--booking-border-subtle"]: "rgba(5,5,5,0.08)",
          } as CSSProperties
        }
      >
        <BookDelayedWaitingOverlay
          busy={loading}
          delayMs={800}
          lang={lang}
          label={ar ? "جاري تحميل الخدمات…" : "Loading services…"}
        />
        {loading && services.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-5 py-20 text-sm text-cut-black/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ar ? "جاري تحميل الخدمات…" : "Loading services…"}
          </div>
        ) : (
          <div className="px-4 pb-28 pt-5 sm:px-6">
            <BookingServiceStep
              services={services}
              categories={categories}
              mostPopular={mostPopular}
              selectedIds={selectedIds}
              onCoreSelect={onCoreSelect}
              onToggleService={onToggleService}
              isLoading={loading}
              isError={error}
              onRetry={() => setReloadToken((n) => n + 1)}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              selectedCount={selectedIds.length}
              onContinue={onContinue}
              hideIntro
            />
          </div>
        )}
      </div>
    </BookFlowChrome>
  );
}
