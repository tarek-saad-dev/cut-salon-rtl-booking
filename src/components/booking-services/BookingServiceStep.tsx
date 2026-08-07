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
  type ServiceBadgeKey,
} from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingFeaturedServiceCard from "./BookingFeaturedServiceCard";
import BookingCompactServiceCard from "./BookingCompactServiceCard";
import BookingServiceFilters, {
  type ServiceCategoryFilterId,
  type ServiceCategoryFilterOption,
} from "./BookingServiceFilters";
import BookingServiceCart from "./BookingServiceCart";

export const MOST_POPULAR_FILTER_ID = "most_popular";

export interface BookingServiceStepProps {
  services: BookingService[];
  /** Admin categories from GET /api/public/booking/services (preferred display shape). */
  categories?: BookingServiceCategory[];
  /** Backend `mostPopular` block — shown first when present. */
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

function FeaturedSkeleton() {
  return (
    <div className="flex min-h-[5.75rem] overflow-hidden rounded-2xl border border-[var(--booking-border-subtle)] animate-pulse">
      <div className="w-[6.75rem] shrink-0 self-stretch bg-[var(--booking-surface)] sm:w-[7.75rem]" />
      <div className="flex flex-1 flex-col justify-center gap-2 px-3.5 py-3">
        <div className="h-4 w-2/3 rounded bg-[var(--booking-surface)]" />
        <div className="h-3 w-full rounded bg-[var(--booking-surface)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--booking-surface)]" />
      </div>
    </div>
  );
}

function CompactSkeleton() {
  return (
    <div className="flex min-h-[5.25rem] overflow-hidden rounded-2xl border border-[var(--booking-border-subtle)] animate-pulse">
      <div className="w-[5.75rem] shrink-0 self-stretch bg-[var(--booking-surface)] sm:w-[6.5rem]" />
      <div className="flex flex-1 flex-col justify-center gap-2 px-3 py-2.5">
        <div className="h-4 w-1/2 rounded bg-[var(--booking-surface)]" />
        <div className="h-3 w-full rounded bg-[var(--booking-surface)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--booking-surface)]" />
      </div>
    </div>
  );
}

function categoryLabel(cat: BookingServiceCategory, lang: "ar" | "en"): string {
  if (lang === "ar") return (cat.nameAr || cat.name || cat.nameEn || "").trim();
  return (cat.nameEn || cat.name || cat.nameAr || "").trim();
}

function mostPopularLabel(section: BookingMostPopularSection, lang: "ar" | "en"): string {
  if (lang === "ar") return (section.titleAr || section.title || section.titleEn || "").trim();
  return (section.titleEn || section.title || section.titleAr || "").trim();
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
          <div className="grid grid-cols-1 gap-2.5" role="radiogroup">
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
  initialFilter = null,
  onFilterChange,
  hideIntro = false,
}: BookingServiceStepProps) {
  const { t, lang, dir } = useBookingTranslations();
  const [addedSignal, setAddedSignal] = useState<{ serviceId: number; nonce: number } | null>(
    null,
  );
  const addedNonceRef = useRef(0);
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

  const mostPopular = useMemo(() => {
    if (!mostPopularProp?.services?.length) return null;
    const servicesInView = mostPopularProp.services
      .filter((s) => visibleIds.has(s.id) && isServiceVisible(s))
      .sort(
        (a, b) =>
          (a.popularityRank ?? 999) - (b.popularityRank ?? 999) || a.id - b.id,
      );
    if (servicesInView.length === 0) return null;
    return { ...mostPopularProp, services: servicesInView };
  }, [mostPopularProp, visibleIds]);

  const featured = useMemo(() => resolveFeaturedServices(visible), [visible]);
  const featuredIds = useMemo(() => new Set(featured.map((s) => s.id)), [featured]);
  const popularIds = useMemo(
    () => new Set(mostPopular?.services.map((s) => s.id) ?? []),
    [mostPopular],
  );

  const filterOptions = useMemo((): ServiceCategoryFilterOption[] => {
    const opts: ServiceCategoryFilterOption[] = [];
    if (mostPopular) {
      opts.push({
        id: MOST_POPULAR_FILTER_ID,
        label: mostPopularLabel(mostPopular, lang) || t("service.filterPopular"),
      });
    }
    for (const cat of categories) {
      opts.push({ id: cat.id, label: categoryLabel(cat, lang) || cat.id });
    }
    return opts;
  }, [categories, mostPopular, lang, t]);

  const filterIds = useMemo(() => filterOptions.map((f) => f.id), [filterOptions]);

  const defaultFilterId = useMemo((): ServiceCategoryFilterId => {
    if (mostPopular) return MOST_POPULAR_FILTER_ID;
    return categories[0]?.id ?? MOST_POPULAR_FILTER_ID;
  }, [mostPopular, categories]);

  const [activeFilter, setActiveFilter] = useState<ServiceCategoryFilterId>(() => {
    if (initialFilter) return initialFilter;
    return defaultFilterId;
  });

  useEffect(() => {
    if (filterIds.length === 0) return;
    if (!filterIds.includes(activeFilter)) {
      setActiveFilter(defaultFilterId);
      onFilterChange?.(defaultFilterId);
    }
  }, [filterIds, activeFilter, defaultFilterId, onFilterChange]);

  const setFilter = (id: ServiceCategoryFilterId) => {
    setActiveFilter(id);
    onFilterChange?.(id);
  };

  const sections = useMemo(() => {
    if (activeFilter === MOST_POPULAR_FILTER_ID) return [];
    return categories.filter((c) => c.id === activeFilter);
  }, [categories, activeFilter]);

  const showMostPopular =
    Boolean(mostPopular) && activeFilter === MOST_POPULAR_FILTER_ID;

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
    // Leave most-popular-only view so the guest can pick from a full category list.
    const firstCategory = categories[0]?.id;
    if (firstCategory && activeFilter === MOST_POPULAR_FILTER_ID) {
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
          <div className="grid grid-cols-1 gap-2.5">
            <FeaturedSkeleton />
            <FeaturedSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <CompactSkeleton />
            <CompactSkeleton />
            <CompactSkeleton />
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
  const showCategoryHeadings = true;

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-[var(--booking-bg)]" dir={dir} data-service-step="ready">
      <div
        ref={servicesScrollRef}
        className="flex-1 overflow-y-auto p-5 md:p-6 pb-4 space-y-5"
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

        <BookingServiceFilters
          filters={filterOptions}
          active={activeFilter}
          onChange={setFilter}
        />

        {showMostPopular && mostPopular ? (
          <section
            aria-labelledby="most-popular-heading"
            data-service-category={MOST_POPULAR_FILTER_ID}
            data-most-popular
          >
            <h4
              id="most-popular-heading"
              className="text-[13px] font-bold uppercase tracking-widest text-[var(--booking-text-muted)] mb-2.5"
            >
              {mostPopularLabel(mostPopular, lang) || t("service.filterPopular")}
            </h4>
            <ServiceGrid
              services={mostPopular.services}
              featuredIds={popularIds}
              selectedIds={selectedIds}
              selectService={selectService}
              selectionTypeFor={selectionTypeFor}
              badgeLabel={badgeLabel}
              lang={lang}
              showFeaturedFirst
            />
          </section>
        ) : null}

        {sections.map((cat) => {
          const heading = categoryLabel(cat, lang) || cat.name;
          return (
            <section
              key={cat.id}
              aria-labelledby={`cat-${cat.id}-heading`}
              data-service-category={cat.id}
            >
              {showCategoryHeadings ? (
                <h4
                  id={`cat-${cat.id}-heading`}
                  className="text-[13px] font-bold uppercase tracking-widest text-[var(--booking-text-muted)] mb-2.5"
                >
                  {heading}
                </h4>
              ) : (
                <h4 id={`cat-${cat.id}-heading`} className="sr-only">
                  {heading}
                </h4>
              )}
              <ServiceGrid
                services={cat.services}
                featuredIds={featuredIds}
                selectedIds={selectedIds}
                selectService={selectService}
                selectionTypeFor={selectionTypeFor}
                badgeLabel={badgeLabel}
                lang={lang}
                compactHeading={t("service.moreServices")}
                showFeaturedFirst
              />
            </section>
          );
        })}

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
        addedSignal={addedSignal}
      />
    </div>
  );
}
