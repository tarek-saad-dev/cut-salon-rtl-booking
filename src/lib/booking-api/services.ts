import { bookingApiRequest } from "./client";
import { buildRequestKey, deduplicatedRequest } from "./request-dedup";
import type {
  BookingConfig,
  BookingService,
  BookingServiceCategory,
  BookingMostPopularSection,
  BookingApiResponse,
  ServicesCatalog,
} from "./types";

interface ConfigResponse {
  ok: boolean;
  salon: BookingConfig["salon"];
  settings: BookingConfig["settings"];
}

interface StatusResponse {
  ok: boolean;
  bookingEnabled: boolean;
  message?: string;
}

type RawService = BookingService & {
  serviceId?: number;
  nameAr?: string;
  nameEn?: string;
  bookable?: boolean;
  imageUrl?: string | null;
  photoUrl?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  categoryId?: string | number | null;
  categoryNameAr?: string | null;
  categoryNameEn?: string | null;
  shortDescriptionAr?: string | null;
  shortDescriptionEn?: string | null;
  isFeatured?: boolean;
  isMostRequested?: boolean;
  isPackage?: boolean;
  displayPriority?: number | null;
  visualKey?: string | null;
  badgeKey?: string | null;
  sortOrder?: number | null;
  popularityRank?: number | null;
};

interface RawCategory {
  categoryId?: string | number;
  id?: string | number;
  name?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sortOrder?: number | null;
  serviceCount?: number | null;
  services?: RawService[];
}

interface RawMostPopular {
  id?: string;
  title?: string;
  titleAr?: string | null;
  titleEn?: string | null;
  services?: RawService[];
}

interface ServicesResponse {
  ok: boolean;
  services?: RawService[];
  categories?: RawCategory[];
  groups?: RawCategory[];
  mostPopular?: RawMostPopular | null;
  meta?: {
    preferredShape?: string;
    serviceCount?: number;
    categoryCount?: number;
  };
}

export async function getBookingConfig(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<BookingConfig>> {
  const key = buildRequestKey("/api/public/booking/config", { branchCode });
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    void signal;
    const res = await bookingApiRequest<ConfigResponse>({
      path: "/api/public/booking/config",
      query: { branchCode },
      signal: dedupSignal,
      timeoutMs: 15_000,
    });
    return {
      ...res,
      data: { salon: res.data.salon, settings: res.data.settings },
    };
  });
  return promise;
}

export async function getBookingStatus(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<{ bookingEnabled: boolean; message?: string }>> {
  const res = await bookingApiRequest<StatusResponse>({
    path: "/api/public/booking/status",
    query: { branchCode },
    signal,
    timeoutMs: 15_000,
  });
  return {
    ...res,
    data: { bookingEnabled: res.data.bookingEnabled, message: res.data.message },
  };
}

function normalizeService(
  raw: RawService,
  categoryFallback?: {
    categoryId?: string | null;
    categoryName?: string | null;
    categoryNameAr?: string | null;
    categoryNameEn?: string | null;
  },
): BookingService | null {
  const id = Number(raw.id ?? raw.serviceId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const nameAr = (raw.nameAr ?? "").trim() || null;
  const nameEn = (raw.nameEn ?? "").trim() || null;
  const fallback = (raw.name ?? "").trim() || null;
  const name = nameEn || fallback || nameAr || "";
  const imageUrl =
    (typeof raw.imageUrl === "string" && raw.imageUrl.trim()) ||
    (typeof raw.photoUrl === "string" && raw.photoUrl.trim()) ||
    null;
  const categoryIdRaw = raw.categoryId ?? categoryFallback?.categoryId;
  const categoryId =
    categoryIdRaw != null && String(categoryIdRaw).trim()
      ? String(categoryIdRaw).trim()
      : null;

  return {
    id,
    name,
    nameAr,
    nameEn,
    price: Number(raw.price) || 0,
    durationMinutes: Number(raw.durationMinutes) || 0,
    categoryId,
    categoryName:
      raw.categoryName ??
      categoryFallback?.categoryName ??
      null,
    categoryNameAr:
      raw.categoryNameAr ??
      categoryFallback?.categoryNameAr ??
      null,
    categoryNameEn:
      raw.categoryNameEn ??
      categoryFallback?.categoryNameEn ??
      null,
    sortOrder:
      raw.sortOrder != null && Number.isFinite(Number(raw.sortOrder))
        ? Number(raw.sortOrder)
        : null,
    isBookableOnline: raw.isBookableOnline ?? raw.bookable !== false,
    imageUrl,
    photoUrl: imageUrl,
    descriptionAr: (raw.descriptionAr ?? "").trim() || null,
    descriptionEn: (raw.descriptionEn ?? "").trim() || null,
    shortDescriptionAr: (raw.shortDescriptionAr ?? "").trim() || null,
    shortDescriptionEn: (raw.shortDescriptionEn ?? "").trim() || null,
    isFeatured: raw.isFeatured === true,
    isMostRequested: raw.isMostRequested === true,
    popularityRank:
      raw.popularityRank != null && Number.isFinite(Number(raw.popularityRank))
        ? Number(raw.popularityRank)
        : null,
    isPackage: raw.isPackage === true,
    displayPriority:
      raw.displayPriority != null && Number.isFinite(Number(raw.displayPriority))
        ? Number(raw.displayPriority)
        : null,
    visualKey: (raw.visualKey ?? "").trim() || null,
    badgeKey: (raw.badgeKey ?? "").trim() || null,
  };
}

function normalizeCategory(raw: RawCategory): BookingServiceCategory | null {
  const idRaw = raw.categoryId ?? raw.id;
  if (idRaw == null || String(idRaw).trim() === "") return null;
  const id = String(idRaw).trim();
  const nameAr = (raw.nameAr ?? "").trim() || null;
  const nameEn = (raw.nameEn ?? "").trim() || null;
  const fallback = (raw.name ?? "").trim() || null;
  const name = nameAr || nameEn || fallback || id;
  const sortOrder = Number(raw.sortOrder);
  const categoryMeta = {
    categoryId: id,
    categoryName: name,
    categoryNameAr: nameAr ?? name,
    categoryNameEn: nameEn,
  };
  const services = (raw.services ?? [])
    .map((s) => normalizeService(s, categoryMeta))
    .filter((s): s is BookingService => s != null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);

  return {
    id,
    name,
    nameAr: nameAr ?? name,
    nameEn,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    serviceCount: Number(raw.serviceCount) || services.length,
    services,
  };
}

function flattenFromCategories(categories: BookingServiceCategory[]): BookingService[] {
  const out: BookingService[] = [];
  const seen = new Set<number>();
  for (const cat of categories) {
    for (const s of cat.services) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push(s);
    }
  }
  return out;
}

function categoriesFromFlatServices(services: BookingService[]): BookingServiceCategory[] {
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

function enrichFromCatalog(
  partial: BookingService,
  byId: Map<number, BookingService>,
): BookingService {
  const full = byId.get(partial.id);
  if (!full) {
    return { ...partial, isMostRequested: true };
  }
  return {
    ...full,
    // Prefer mostPopular payload fields when present.
    name: partial.name || full.name,
    nameAr: partial.nameAr ?? full.nameAr,
    nameEn: partial.nameEn ?? full.nameEn,
    price: partial.price || full.price,
    durationMinutes: partial.durationMinutes || full.durationMinutes,
    imageUrl: partial.imageUrl || full.imageUrl,
    photoUrl: partial.photoUrl || full.photoUrl || partial.imageUrl || full.imageUrl,
    popularityRank: partial.popularityRank ?? full.popularityRank ?? null,
    isMostRequested: true,
  };
}

function normalizeMostPopular(
  raw: RawMostPopular | null | undefined,
  catalogServices: BookingService[],
): BookingMostPopularSection | null {
  if (!raw || !Array.isArray(raw.services) || raw.services.length === 0) return null;
  const byId = new Map(catalogServices.map((s) => [s.id, s]));
  const services = raw.services
    .map((s) => normalizeService({ ...s, isMostRequested: true }))
    .filter((s): s is BookingService => s != null)
    .map((s) => enrichFromCatalog(s, byId))
    .sort(
      (a, b) =>
        (a.popularityRank ?? 999) - (b.popularityRank ?? 999) || a.id - b.id,
    );
  if (services.length === 0) return null;
  const titleAr = (raw.titleAr ?? "").trim() || null;
  const titleEn = (raw.titleEn ?? "").trim() || null;
  const fallback = (raw.title ?? "").trim() || null;
  const title = titleAr || titleEn || fallback || "Most Popular";
  return {
    id: (raw.id ?? "most_popular").trim() || "most_popular",
    title,
    titleAr: titleAr ?? title,
    titleEn,
    services,
  };
}

/** Prefer admin `categories` shape; fall back to flat `services` / legacy `groups`. */
export function normalizeServicesCatalog(raw: ServicesResponse): ServicesCatalog {
  const rawCategories = raw.categories?.length
    ? raw.categories
    : raw.groups?.length
      ? raw.groups
      : [];

  let categories = rawCategories
    .map(normalizeCategory)
    .filter((c): c is BookingServiceCategory => c != null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));

  let services =
    categories.length > 0
      ? flattenFromCategories(categories)
      : (raw.services ?? [])
          .map((s) => normalizeService(s))
          .filter((s): s is BookingService => s != null);

  if (categories.length === 0 && services.length > 0) {
    categories = categoriesFromFlatServices(services);
  }

  const mostPopular = normalizeMostPopular(raw.mostPopular, services);

  return { services, categories, mostPopular };
}

export async function getServices(
  branchCode: string,
  signal?: AbortSignal,
): Promise<BookingApiResponse<ServicesCatalog>> {
  const key = buildRequestKey("/api/public/booking/services", { branchCode });
  const { promise } = deduplicatedRequest(key, async (dedupSignal) => {
    void signal;
    const res = await bookingApiRequest<ServicesResponse>({
      path: "/api/public/booking/services",
      query: { branchCode },
      signal: dedupSignal,
      timeoutMs: 15_000,
    });
    const catalog = normalizeServicesCatalog(res.data);
    return { ...res, data: catalog };
  });
  return promise;
}

/** Filter categories to services allowed for the current barber / bookable set. */
export function filterCatalogByServiceIds(
  catalog: ServicesCatalog,
  allowedIds: Set<number> | null,
  bookableOnly = true,
): ServicesCatalog {
  const allow = (s: BookingService) => {
    if (bookableOnly && !s.isBookableOnline) return false;
    if (allowedIds && !allowedIds.has(s.id)) return false;
    return true;
  };
  // Session cache may predate categories — rebuild from flat list.
  const sourceCategories =
    catalog.categories.length > 0
      ? catalog.categories
      : categoriesFromFlatServices(catalog.services);
  const categories = sourceCategories
    .map((cat) => {
      const services = cat.services.filter(allow);
      return {
        ...cat,
        services,
        serviceCount: services.length,
      };
    })
    .filter((cat) => cat.services.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const services = flattenFromCategories(categories);
  let mostPopular = catalog.mostPopular;
  if (mostPopular) {
    const popularServices = mostPopular.services.filter(allow);
    mostPopular =
      popularServices.length > 0
        ? { ...mostPopular, services: popularServices }
        : null;
  }
  return { services, categories, mostPopular };
}
