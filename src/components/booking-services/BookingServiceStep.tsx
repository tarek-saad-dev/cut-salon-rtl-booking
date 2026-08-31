"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import type {
  BookingService,
  BookingServiceCategory,
  BookingMostPopularSection,
} from "@/lib/booking-api";
import {
  isServiceVisible,
  isCoreService,
  getRecommendedAddons,
} from "@/lib/bookingServiceGroups";
import {
  getQuickPickBadge,
  getServicePresentation,
  resolveFeaturedServices,
  resolveMostPopularServices,
  type ServiceBadgeKey,
} from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingFeaturedServiceCard from "./BookingFeaturedServiceCard";
import BookingCompactServiceCard from "./BookingCompactServiceCard";
import BookingPopularServiceCard from "./BookingPopularServiceCard";
import BookingServiceFilters, {
  type ServiceCategoryFilterId,
  type ServiceCategoryFilterOption,
} from "./BookingServiceFilters";
import BookingServiceCart from "./BookingServiceCart";

export const MOST_POPULAR_FILTER_ID = "most_popular";

/** Initial services shown per category before "Show more". */
const INITIAL_CATEGORY_VISIBLE = 5;

export interface BookingServiceStepProps {
  services: BookingService[];
  /** Admin categories from GET /api/public/booking/services (preferred display shape). */
  categories?: BookingServiceCategory[];
  /** Backend `mostPopular` block — enriches the top popular row when present. */
  mostPopular?: BookingMostPopularSection | null;
  selectedIds: number[];
  onCoreSelect: (id: number) => void;
  onToggleService: (id: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  totalPrice?: number;
  totalDuration?: number;
  selectedCount?: number;
  onContinue?: () => void;
  onBack?: () => void;
  backLabel?: string;
  /** Restore previously active category filter when returning to this step. */
  initialFilter?: ServiceCategoryFilterId | null;
  onFilterChange?: (filter: ServiceCategoryFilterId) => void;
  /** Hide title/subtitle when the parent already shows them (e.g. book-flow hero). */
  hideIntro?: boolean;
}

const BADGE_I18N: Record<ServiceBadgeKey, string> = {
  mostRequested: "service.badgeMostRequested",
  featuredPackage: "service.badgeFeaturedPackage",
  bestValue: "service.badgeBestValue",
  quickService: "service.badgeQuickService",
  recommended: "service.badgeRecommended",
  commonlyAdded: "service.badgeCommonlyAdded",
};

function ServiceCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/35 px-3 py-2.5 animate-pulse">
      <div className="h-11 w-11 shrink-0 rounded-xl bg-[var(--booking-surface)]" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3.5 w-2/5 rounded bg-[var(--booking-surface)]" />
        <div className="h-2.5 w-1/4 rounded bg-[var(--booking-surface)]" />
      </div>
      <div className="h-[1.125rem] w-[1.125rem] shrink-0 rounded-full bg-[var(--booking-surface)]" />
    </div>
  );
}

function categoryLabel(cat: BookingServiceCategory, lang: "ar" | "en"): string {
  if (lang === "ar") return (cat.nameAr || cat.name || cat.nameEn || "").trim();
  return (cat.nameEn || cat.name || cat.nameAr || "").trim();
}

/** Fallback when API categories are missing — group flat services by category fields. */
function categoriesFromServices(services: BookingService[]): BookingServiceCategory[] {
  const map = new Map<string, BookingServiceCategory>();
  for (const s of services) {
    const id = (s.categoryId || s.categoryNameEn || s.categoryName || "other").toString();
    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        id,
        name: s.categoryNameAr || s.categoryName || s.categoryNameEn || id,
        nameAr: s.categoryNameAr ?? s.categoryName,
        nameEn: s.categoryNameEn,
        sortOrder: 999,
        serviceCount: 1,
        services: [s],
      });
    } else {
      existing.services.push(s);
      existing.serviceCount = existing.services.length;
    }
  }
  return [...map.values()];
}

function ServiceGrid({
  services,
  featuredIds,
  selectedIds,
  selectService,
  selectionTypeFor,
  badgeLabel,
  lang,
  featuredHeading,
  compactHeading,
  showFeaturedFirst,
}: {
  services: BookingService[];
  featuredIds: Set<number>;
  selectedIds: number[];
  selectService: (s: BookingService) => void;
  selectionTypeFor: (s: BookingService) => "radio" | "checkbox";
  badgeLabel: (s: BookingService) => string | null;
  lang: "ar" | "en";
  featuredHeading?: string;
  compactHeading?: string;
  showFeaturedFirst: boolean;
}) {
  const featuredInView = showFeaturedFirst
    ? services.filter((s) => featuredIds.has(s.id))
    : [];
  const featuredSet = new Set(featuredInView.map((s) => s.id));
  const compactInView = services.filter((s) => !featuredSet.has(s.id));

  return (
    <div className="space-y-4">
      {featuredInView.length > 0 && (
        <section aria-labelledby={featuredHeading ? undefined : undefined}>
          {featuredHeading ? (
            <h5 className="sr-only">{featuredHeading}</h5>
          ) : null}
          <div className="grid grid-cols-1 gap-2" role="radiogroup">
            {featuredInView.map((s, i) => (
              <BookingFeaturedServiceCard
                key={`featured-${s.id}`}
                service={s}
                presentation={getServicePresentation(s, lang)}
                selected={selectedIds.includes(s.id)}
                selectionType={selectionTypeFor(s)}
                onSelect={() => selectService(s)}
                priorityImage={i === 0}
                badgeLabel={badgeLabel(s)}
              />
            ))}
          </div>
        </section>
      )}

      {compactInView.length > 0 && (
        <section>
          {compactHeading && featuredInView.length > 0 ? (
            <h5 className="text-[13px] font-bold uppercase tracking-widest text-[var(--booking-text-muted)] mb-2.5">
              {compactHeading}
            </h5>
          ) : null}
          <div className="grid grid-cols-1 gap-2.5">
            {compactInView.map((s) => (
              <BookingCompactServiceCard
                key={`compact-${s.id}`}
                service={s}
                presentation={getServicePresentation(s, lang)}
                selected={selectedIds.includes(s.id)}
                selectionType={selectionTypeFor(s)}
                onSelect={() => selectService(s)}
                badgeLabel={badgeLabel(s)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function BookingServiceStep({
  services,
  categories: categoriesProp,
  mostPopular: mostPopularProp = null,
  selectedIds,
  onCoreSelect,
  onToggleService,
  isLoading = false,
  isError = false,
  onRetry,
  totalPrice = 0,
  totalDuration = 0,
  selectedCount = 0,
  onContinue,
  onBack,
  backLabel,
  initialFilter = null,
  onFilterChange,
  hideIntro = false,
}: BookingServiceStepProps) {
  const { t, lang, dir } = useBookingTranslations();
  const [addedSignal, setAddedSignal] = useState<{ serviceId: number; nonce: number } | null>(
    null,
  );
  const addedNonceRef = useRef(0);
  const [showAllInCategory, setShowAllInCategory] = useState(false);
  const visible = useMemo(() => services.filter(isServiceVisible), [services]);
  const visibleIds = useMemo(() => new Set(visible.map((s) => s.id)), [visible]);

  const categories = useMemo(() => {
    const source =
      categoriesProp && categoriesProp.length > 0
        ? categoriesProp
        : categoriesFromServices(visible);
    return source
      .map((cat) => {
        const catServices = cat.services.filter(
          (s) => visibleIds.has(s.id) && isServiceVisible(s),
        );
        return { ...cat, services: catServices, serviceCount: catServices.length };
      })
      .filter((cat) => cat.services.length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }, [categoriesProp, visible, visibleIds]);

  const mostPopularServices = useMemo(() => {
    const normalizedBackend =
      mostPopularProp?.services?.length
        ? {
            services: mostPopularProp.services
              .filter((s) => visibleIds.has(s.id) && isServiceVisible(s))
              .sort(
                (a, b) =>
                  (a.popularityRank ?? 999) - (b.popularityRank ?? 999) || a.id - b.id,
              ),
          }
        : null;
    return resolveMostPopularServices(visible, normalizedBackend);
  }, [mostPopularProp, visible, visibleIds]);

  const popularIds = useMemo(
    () => new Set(mostPopularServices.map((s) => s.id)),
    [mostPopularServices],
  );

  const featured = useMemo(() => resolveFeaturedServices(visible), [visible]);
  const featuredIds = useMemo(() => new Set(featured.map((s) => s.id)), [featured]);

  const filterOptions = useMemo((): ServiceCategoryFilterOption[] => {
    return categories
      .map((cat) => ({
        id: cat.id,
        label: categoryLabel(cat, lang) || cat.id,
        remaining: cat.services.filter((s) => !popularIds.has(s.id)).length,
      }))
      .filter((cat) => cat.remaining > 0)
      .map(({ id, label }) => ({ id, label }));
  }, [categories, lang, popularIds]);

  const filterIds = useMemo(() => filterOptions.map((f) => f.id), [filterOptions]);

  const defaultFilterId = useMemo((): ServiceCategoryFilterId => {
    return filterOptions[0]?.id ?? categories[0]?.id ?? "all";
  }, [filterOptions, categories]);

  const [activeFilter, setActiveFilter] = useState<ServiceCategoryFilterId>(() => {
    if (initialFilter && initialFilter !== MOST_POPULAR_FILTER_ID) return initialFilter;
    return defaultFilterId;
  });

  useEffect(() => {
    if (filterIds.length === 0) return;
    if (!filterIds.includes(activeFilter)) {
      setActiveFilter(defaultFilterId);
      onFilterChange?.(defaultFilterId);
    }
  }, [filterIds, activeFilter, defaultFilterId, onFilterChange]);

  useEffect(() => {
    setShowAllInCategory(false);
  }, [activeFilter]);

  const setFilter = (id: ServiceCategoryFilterId) => {
    setActiveFilter(id);
    onFilterChange?.(id);
  };

  const sections = useMemo(() => {
    return categories
      .filter((c) => c.id === activeFilter)
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((s) => !popularIds.has(s.id)),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [categories, activeFilter, popularIds]);

  const hasMainSelected = selectedIds.some((id) => {
    const s = visible.find((x) => x.id === id);
    return s ? isCoreService(s) : false;
  });

  const addons = useMemo(() => {
    if (!hasMainSelected && selectedIds.length === 0) return [];
    return getRecommendedAddons(visible, selectedIds);
  }, [visible, selectedIds, hasMainSelected]);

  const selectedServices = useMemo(() => {
    const byId = new Map(visible.map((s) => [s.id, s]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((s): s is BookingService => s != null);
  }, [visible, selectedIds]);

  const servicesScrollRef = useRef<HTMLDivElement>(null);

  const browseServicesFromCart = () => {
    const firstCategory = categories[0]?.id;
    if (firstCategory && activeFilter !== firstCategory) {
      setFilter(firstCategory);
    }
    const el = servicesScrollRef.current;
    if (!el) return;
    window.requestAnimationFrame(() => {
      el.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const badgeLabel = (service: BookingService) => {
    if (popularIds.has(service.id)) return t("service.badgeMostRequested");
    const key = getQuickPickBadge(service, visible);
    return key ? t(BADGE_I18N[key]) : null;
  };

  const signalAdded = (serviceId: number) => {
    addedNonceRef.current += 1;
    setAddedSignal({ serviceId, nonce: addedNonceRef.current });
  };

  const selectService = (service: BookingService) => {
    if (isCoreService(service)) {
      const already = selectedIds.includes(service.id);
      onCoreSelect(service.id);
      if (!already) signalAdded(service.id);
      return;
    }
    const already = selectedIds.includes(service.id);
    onToggleService(service.id);
    if (!already) signalAdded(service.id);
  };

  const removeOrToggleService = (serviceId: number) => {
    onToggleService(serviceId);
  };

  const selectionTypeFor = (service: BookingService): "radio" | "checkbox" =>
    isCoreService(service) ? "radio" : "checkbox";

  const scrollBottomPadding = onContinue
    ? "pb-[max(7.5rem,calc(env(safe-area-inset-bottom)+6.5rem))] md:pb-6"
    : "pb-4";

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-0 flex-1" dir={dir} aria-busy="true" data-service-step="loading">
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {!hideIntro ? (
            <div>
              <div className="h-6 w-48 rounded bg-[var(--booking-surface)] animate-pulse mb-2" />
              <div className="h-3 w-64 rounded bg-[var(--booking-surface)] animate-pulse" />
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-2">
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center space-y-3" dir={dir} role="alert" aria-live="assertive" data-service-step="error">
        <p className="font-bold text-[var(--booking-text)]">{t("service.loadFailedTitle")}</p>
        <p className="text-sm text-[var(--booking-text-secondary)]">{t("service.loadFailedBody")}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 px-4 rounded-xl bg-[var(--booking-accent)] text-white font-bold text-sm"
          >
            {t("actions.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="p-6 text-center" dir={dir} data-service-step="empty">
        <div className="w-16 h-16 rounded-full bg-[var(--booking-surface)] border border-[var(--booking-border)] flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8 text-[var(--booking-text-muted)]" />
        </div>
        <p className="text-[var(--booking-text-secondary)] text-sm">{t("service.emptyForBarberBranch")}</p>
      </div>
    );
  }

  const showAddons = selectedIds.length > 0 && addons.length > 0;

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-[var(--booking-bg)]" dir={dir} data-service-step="ready">
      <div
        ref={servicesScrollRef}
        className={`flex-1 overflow-y-auto p-5 md:p-6 space-y-5 ${scrollBottomPadding}`}
        data-services-scroll
      >
        {!hideIntro ? (
          <div>
            <h3 className="text-lg md:text-xl font-heading font-bold text-[var(--booking-text)] mb-0.5">
              {t("service.title")}
            </h3>
            <p className="text-[var(--booking-text-secondary)] text-sm">{t("service.subtitle")}</p>
          </div>
        ) : null}

        {mostPopularServices.length > 0 ? (
          <section
            aria-labelledby="most-popular-heading"
            data-service-category={MOST_POPULAR_FILTER_ID}
            data-most-popular
          >
            <h4
              id="most-popular-heading"
              className="text-[13px] font-bold uppercase tracking-widest text-[var(--booking-text-muted)] mb-2.5"
            >
              {t("service.filterPopular")}
            </h4>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-labelledby="most-popular-heading"
            >
              {mostPopularServices.map((s, i) => (
                <BookingPopularServiceCard
                  key={`popular-${s.id}`}
                  service={s}
                  presentation={getServicePresentation(s, lang)}
                  selected={selectedIds.includes(s.id)}
                  selectionType={selectionTypeFor(s)}
                  onSelect={() => selectService(s)}
                  priorityImage={i === 0}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="all-services-heading" data-all-services>
          <h4
            id="all-services-heading"
            className="text-[13px] font-bold uppercase tracking-widest text-[var(--booking-text-muted)] mb-3"
          >
            {t("service.allServicesHeading")}
          </h4>

          <BookingServiceFilters
            filters={filterOptions}
            active={activeFilter}
            onChange={setFilter}
          />

          {sections.map((cat) => {
            const heading = categoryLabel(cat, lang) || cat.name;
            const hasMore = cat.services.length > INITIAL_CATEGORY_VISIBLE;
            const servicesInView = showAllInCategory
              ? cat.services
              : cat.services.slice(0, INITIAL_CATEGORY_VISIBLE);

            return (
              <div
                key={cat.id}
                className="mt-4"
                data-service-category={cat.id}
              >
                <section aria-labelledby={`cat-${cat.id}-heading`}>
                  <h5
                    id={`cat-${cat.id}-heading`}
                    className="sr-only"
                  >
                    {heading}
                  </h5>
                  <ServiceGrid
                    services={servicesInView}
                    featuredIds={featuredIds}
                    selectedIds={selectedIds}
                    selectService={selectService}
                    selectionTypeFor={selectionTypeFor}
                    badgeLabel={badgeLabel}
                    lang={lang}
                    compactHeading={t("service.moreServices")}
                    showFeaturedFirst
                  />
                  {hasMore && !showAllInCategory ? (
                    <button
                      type="button"
                      onClick={() => setShowAllInCategory(true)}
                      className="mt-3 w-full min-h-11 rounded-xl border border-dashed border-[var(--booking-border)] bg-[var(--booking-surface)]/60 px-4 text-sm font-bold text-[var(--booking-text-secondary)] hover:border-[var(--booking-accent)] hover:text-[var(--booking-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
                      data-show-more-services
                    >
                      {t("service.showMoreServices")}
                    </button>
                  ) : null}
                </section>
              </div>
            );
          })}
        </section>

        {showAddons && (
          <section aria-labelledby="addons-heading" data-addons-section>
            <h4
              id="addons-heading"
              className="text-base font-heading font-bold text-[var(--booking-text)] mb-0.5"
            >
              {t("service.completeVisit")}
            </h4>
            <p className="text-[13px] text-[var(--booking-text-secondary)] mb-3">
              {t("service.addonsHint")}
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {addons.map((s) => (
                <BookingCompactServiceCard
                  key={`addon-${s.id}`}
                  service={s}
                  presentation={getServicePresentation(s, lang)}
                  selected={selectedIds.includes(s.id)}
                  selectionType="checkbox"
                  onSelect={() => selectService(s)}
                  badgeLabel={t("service.badgeCommonlyAdded")}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <BookingServiceCart
        selectedServices={selectedServices}
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        onRemove={removeOrToggleService}
        onBrowseServices={browseServicesFromCart}
        onContinue={onContinue}
        continueDisabled={selectedCount === 0}
        onBack={onBack}
        backLabel={backLabel}
        addedSignal={addedSignal}
      />
    </div>
  );
}
