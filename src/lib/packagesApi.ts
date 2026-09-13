import { buildCasherPublicApiUrl } from "@/lib/casherPublicApiUrl";

export type PackageIncludeItem = {
  serviceId: number;
  nameAr: string | null;
  nameEn: string | null;
  name: string | null;
  qty: number;
  optional: boolean;
  listPrice: number | null;
  durationMinutes: number | null;
};

export type GroomOptionalExtra = {
  proId: number;
  nameAr: string | null;
  nameEn: string | null;
  price: number;
  descriptionAr: string | null;
  descriptionEn: string | null;
  durationMinutes: number | null;
  /** Backend: already part of the selected package — never selectable. */
  alreadyIncluded: boolean;
  /** Backend: may be offered as an optional add-on for this package. */
  availableAsOptional: boolean;
  /** Backend: items sharing this key are single-select (e.g. home_visit). */
  mutuallyExclusiveGroup: string | null;
  groupKey: string | null;
  sortOrder: number;
};

export type GroomOptionalGroup = {
  key: string;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  mutuallyExclusive: boolean;
  sortOrder: number;
};

export type PackageGroomInfo = {
  depositAmount: number | null;
  includesTrial: boolean;
  sessionCount: number | null;
  notesAr: string | null;
  optionalExtras: GroomOptionalExtra[];
  optionalGroups: GroomOptionalGroup[];
};

export type ApiPackage = {
  packageId: number;
  kind: "regular" | "groom";
  nameAr: string | null;
  nameEn: string | null;
  price: number;
  originalPrice: number | null;
  savings: number | null;
  durationMinutes: number | null;
  imageUrl: string | null;
  popular: boolean;
  includes: PackageIncludeItem[];
  groom?: PackageGroomInfo | null;
};

export type GroomExperiencePayload = {
  packages: ApiPackage[];
  currency: string;
};

type PackagesResponse = {
  ok: boolean;
  currency?: string;
  regular?: unknown[];
  groom?: unknown[];
  packages?: unknown[];
};

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

function looksLikeHomeVisit(nameEn: string | null, nameAr: string | null, groupKey: string | null): boolean {
  const key = (groupKey ?? "").toLowerCase();
  if (key === "home_visit" || key === "home-visit" || key === "homevisit") return true;
  const blob = `${nameEn ?? ""} ${nameAr ?? ""}`.toLowerCase();
  return blob.includes("home visit") || blob.includes("زيارة خارجية") || blob.includes("زيارة منزل");
}

export function normalizeGroomOptionalExtra(
  raw: unknown,
  index = 0,
): GroomOptionalExtra | null {
  const row = asRecord(raw);
  if (!row) return null;

  const proId = pickNumber(
    row.proId,
    row.ProID,
    row.proID,
    row.serviceId,
    row.ServiceID,
    row.productId,
    row.ProductID,
    row.id,
  );
  if (proId == null || proId <= 0) return null;

  const price = pickNumber(row.price, row.Price, row.listPrice, row.ListPrice);
  if (price == null || !Number.isFinite(price)) return null;

  const nameAr = pickString(row.nameAr, row.NameAr, row.name_ar, row.name);
  const nameEn = pickString(row.nameEn, row.NameEn, row.name_en, row.name);
  if (!nameAr && !nameEn) return null;

  const groupKey = pickString(
    row.groupKey,
    row.GroupKey,
    row.group,
    row.Group,
    row.type,
    row.Type,
    row.mutuallyExclusiveGroup,
    row.MutuallyExclusiveGroup,
  );

  const mutuallyExclusiveGroup =
    pickString(row.mutuallyExclusiveGroup, row.MutuallyExclusiveGroup) ??
    (looksLikeHomeVisit(nameEn, nameAr, groupKey) ? "home_visit" : null);

  const alreadyIncluded =
    pickBoolean(row.alreadyIncluded, row.AlreadyIncluded, row.included) ?? false;
  const availableAsOptional =
    pickBoolean(row.availableAsOptional, row.AvailableAsOptional, row.optional) ??
    !alreadyIncluded;

  return {
    proId,
    nameAr,
    nameEn,
    price,
    descriptionAr: pickString(
      row.descriptionAr,
      row.DescriptionAr,
      row.detailAr,
      row.DetailAr,
    ),
    descriptionEn: pickString(
      row.descriptionEn,
      row.DescriptionEn,
      row.detailEn,
      row.DetailEn,
    ),
    durationMinutes: pickNumber(
      row.durationMinutes,
      row.DurationMinutes,
      row.duration,
      row.Duration,
    ),
    alreadyIncluded,
    availableAsOptional,
    mutuallyExclusiveGroup,
    groupKey: groupKey ?? mutuallyExclusiveGroup,
    sortOrder: pickNumber(row.sortOrder, row.SortOrder) ?? (index + 1) * 10,
  };
}

export function normalizeGroomOptionalGroup(
  raw: unknown,
  index = 0,
): GroomOptionalGroup | null {
  const row = asRecord(raw);
  if (!row) return null;
  const key = pickString(row.key, row.Key, row.id, row.Id, row.group, row.Group);
  if (!key) return null;

  return {
    key,
    titleAr: pickString(row.titleAr, row.TitleAr, row.nameAr, row.NameAr),
    titleEn: pickString(row.titleEn, row.TitleEn, row.nameEn, row.NameEn),
    descriptionAr: pickString(row.descriptionAr, row.DescriptionAr, row.detailAr),
    descriptionEn: pickString(row.descriptionEn, row.DescriptionEn, row.detailEn),
    mutuallyExclusive:
      pickBoolean(row.mutuallyExclusive, row.MutuallyExclusive, row.exclusive) ??
      key === "home_visit",
    sortOrder: pickNumber(row.sortOrder, row.SortOrder) ?? (index + 1) * 10,
  };
}

function normalizeInclude(raw: unknown): PackageIncludeItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const serviceId = pickNumber(row.serviceId, row.ServiceID, row.proId, row.ProID, row.id);
  if (serviceId == null || serviceId <= 0) return null;
  return {
    serviceId,
    nameAr: pickString(row.nameAr, row.NameAr),
    nameEn: pickString(row.nameEn, row.NameEn),
    name: pickString(row.name, row.Name),
    qty: pickNumber(row.qty, row.Qty) ?? 1,
    optional: pickBoolean(row.optional, row.Optional) ?? false,
    listPrice: pickNumber(row.listPrice, row.ListPrice, row.price, row.Price),
    durationMinutes: pickNumber(row.durationMinutes, row.DurationMinutes),
  };
}

/**
 * Bridge: when Cashier has not yet populated groom.optionalExtras, derive the same
 * contract fields from package.includes (same `/api/public/client/packages` payload).
 */
function synthesizeExtrasFromIncludes(includes: PackageIncludeItem[]): GroomOptionalExtra[] {
  return includes
    .map((item, index) => {
      const nameAr = item.nameAr;
      const nameEn = item.nameEn ?? item.name;
      const home = looksLikeHomeVisit(nameEn, nameAr, null);
      // Core package lines that are not optional are "already included" markers when
      // the same ProID appears as optional on other packages — they are not selectable here.
      const alreadyIncluded = !item.optional;
      const availableAsOptional = item.optional;
      if (!availableAsOptional && !alreadyIncluded) return null;
      // Only surface rows that are optional offers OR included core lines that help
      // reconciliation. Selectable UI filters to availableAsOptional && !alreadyIncluded.
      if (!availableAsOptional) {
        // Keep included-only rows so alreadyIncluded checks work if extras list is mixed.
        // For includes bridge we only need selectable optionals in the extras array;
        // already-included services are detected via includes themselves.
        return null;
      }
      if (item.listPrice == null || !Number.isFinite(item.listPrice)) return null;
      return {
        proId: item.serviceId,
        nameAr,
        nameEn,
        price: item.listPrice,
        descriptionAr: null,
        descriptionEn: null,
        durationMinutes: item.durationMinutes,
        alreadyIncluded: false,
        availableAsOptional: true,
        mutuallyExclusiveGroup: home ? "home_visit" : null,
        groupKey: home ? "home_visit" : "groom_addons",
        sortOrder: (index + 1) * 10,
      } satisfies GroomOptionalExtra;
    })
    .filter((item): item is GroomOptionalExtra => Boolean(item));
}

function synthesizeGroupsFromExtras(extras: GroomOptionalExtra[]): GroomOptionalGroup[] {
  const hasHome = extras.some((item) => item.mutuallyExclusiveGroup === "home_visit");
  const hasAddons = extras.some((item) => item.mutuallyExclusiveGroup == null);
  const groups: GroomOptionalGroup[] = [];
  if (hasAddons) {
    groups.push({
      key: "groom_addons",
      titleAr: "أضف لطلبك (اختياري)",
      titleEn: "Add to your order (optional)",
      descriptionAr: null,
      descriptionEn: null,
      mutuallyExclusive: false,
      sortOrder: 10,
    });
  }
  if (hasHome) {
    groups.push({
      key: "home_visit",
      titleAr: "زيارة خارجية يوم الفرح (اختياري)",
      titleEn: "Home visit (optional)",
      descriptionAr: "اختار نطاق الزيارة المناسب حسب مكان تجهيز العريس يوم الفرح.",
      descriptionEn: "Choose the visit range that matches your wedding location.",
      mutuallyExclusive: true,
      sortOrder: 20,
    });
  }
  return groups;
}

function normalizeGroomInfo(
  raw: unknown,
  includes: PackageIncludeItem[],
): PackageGroomInfo | null {
  const row = asRecord(raw);
  const extrasRaw = row
    ? (row.optionalExtras ?? row.OptionalExtras ?? row.optional_extras)
    : undefined;
  const groupsRaw = row
    ? (row.optionalGroups ?? row.OptionalGroups ?? row.optional_groups)
    : undefined;

  let optionalExtras = Array.isArray(extrasRaw)
    ? extrasRaw
        .map((item, index) => normalizeGroomOptionalExtra(item, index))
        .filter((item): item is GroomOptionalExtra => Boolean(item))
    : [];

  let optionalGroups = Array.isArray(groupsRaw)
    ? groupsRaw
        .map((item, index) => normalizeGroomOptionalGroup(item, index))
        .filter((item): item is GroomOptionalGroup => Boolean(item))
    : [];

  if (!optionalExtras.length) {
    optionalExtras = synthesizeExtrasFromIncludes(includes);
  }
  if (!optionalGroups.length) {
    optionalGroups = synthesizeGroupsFromExtras(optionalExtras);
  }

  // Apply group.mutuallyExclusive onto extras that share the group key.
  const exclusiveKeys = new Set(
    optionalGroups.filter((group) => group.mutuallyExclusive).map((group) => group.key),
  );
  optionalExtras = optionalExtras.map((extra) => {
    if (extra.mutuallyExclusiveGroup) return extra;
    if (extra.groupKey && exclusiveKeys.has(extra.groupKey)) {
      return { ...extra, mutuallyExclusiveGroup: extra.groupKey };
    }
    return extra;
  });

  return {
    depositAmount: row ? pickNumber(row.depositAmount, row.DepositAmount) : null,
    includesTrial: row ? (pickBoolean(row.includesTrial, row.IncludesTrial) ?? false) : false,
    sessionCount: row ? pickNumber(row.sessionCount, row.SessionCount) : null,
    notesAr: row ? pickString(row.notesAr, row.NotesAr) : null,
    optionalExtras,
    optionalGroups,
  };
}

export function normalizeApiPackage(raw: unknown): ApiPackage | null {
  const row = asRecord(raw);
  if (!row) return null;
  const packageId = pickNumber(row.packageId, row.PackageID, row.id);
  if (packageId == null || packageId <= 0) return null;
  const price = pickNumber(row.price, row.Price);
  if (price == null) return null;

  const includes = Array.isArray(row.includes)
    ? row.includes
        .map((item) => normalizeInclude(item))
        .filter((item): item is PackageIncludeItem => Boolean(item))
    : [];

  const kindRaw = pickString(row.kind, row.Kind)?.toLowerCase();
  const kind: ApiPackage["kind"] = kindRaw === "groom" ? "groom" : "regular";

  return {
    packageId,
    kind,
    nameAr: pickString(row.nameAr, row.NameAr),
    nameEn: pickString(row.nameEn, row.NameEn),
    price,
    originalPrice: pickNumber(row.originalPrice, row.OriginalPrice),
    savings: pickNumber(row.savings, row.Savings),
    durationMinutes: pickNumber(row.durationMinutes, row.DurationMinutes),
    imageUrl: pickString(row.imageUrl, row.ImageUrl),
    popular: pickBoolean(row.popular, row.Popular) ?? false,
    includes,
    groom: kind === "groom" ? normalizeGroomInfo(row.groom ?? row.Groom, includes) : null,
  };
}

/** Selectable optional extras for a package — respects Cashier flags exactly. */
export function getSelectableOptionalExtras(pack: ApiPackage | null | undefined): GroomOptionalExtra[] {
  if (!pack?.groom?.optionalExtras?.length) return [];
  return pack.groom.optionalExtras
    .filter((item) => item.availableAsOptional && !item.alreadyIncluded)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.proId - b.proId);
}

export function getOptionalGroup(
  pack: ApiPackage | null | undefined,
  key: string,
): GroomOptionalGroup | null {
  return pack?.groom?.optionalGroups?.find((group) => group.key === key) ?? null;
}

export function splitSelectableExtras(pack: ApiPackage | null | undefined): {
  addons: GroomOptionalExtra[];
  exclusiveByGroup: Record<string, GroomOptionalExtra[]>;
} {
  const selectable = getSelectableOptionalExtras(pack);
  const addons: GroomOptionalExtra[] = [];
  const exclusiveByGroup: Record<string, GroomOptionalExtra[]> = {};

  for (const item of selectable) {
    if (item.mutuallyExclusiveGroup) {
      const key = item.mutuallyExclusiveGroup;
      if (!exclusiveByGroup[key]) exclusiveByGroup[key] = [];
      exclusiveByGroup[key].push(item);
    } else {
      addons.push(item);
    }
  }

  return { addons, exclusiveByGroup };
}

/** Core (non-optional) includes for package cards / booking base services. */
export function getPackageCoreIncludes(pack: ApiPackage): PackageIncludeItem[] {
  return pack.includes.filter((item) => !item.optional);
}

export async function getPackages(kind?: "regular" | "groom"): Promise<ApiPackage[]> {
  const qs = kind ? `?kind=${kind}` : "";
  const response = await fetch(buildCasherPublicApiUrl(`/api/public/client/packages${qs}`), {
    cache: "no-store",
  });
  const data: PackagesResponse | null = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error("Unable to load packages");
  }

  const list =
    kind === "regular"
      ? data.regular
      : kind === "groom"
        ? data.groom
        : data.packages;

  return (list ?? [])
    .map((item) => normalizeApiPackage(item))
    .filter((item): item is ApiPackage => Boolean(item));
}

/**
 * Single source of truth: `/api/public/client/packages?kind=groom`
 * Optionals come from each package's `groom.optionalExtras` / `groom.optionalGroups`
 * (or the includes bridge on the same payload).
 */
export async function getGroomExperience(): Promise<GroomExperiencePayload> {
  const response = await fetch(buildCasherPublicApiUrl("/api/public/client/packages?kind=groom"), {
    cache: "no-store",
  });
  const data: PackagesResponse | null = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error("Unable to load groom experience");
  }

  const packages = (data.groom ?? data.packages ?? [])
    .map((item) => normalizeApiPackage(item))
    .filter((item): item is ApiPackage => Boolean(item) && item.kind === "groom");

  return {
    packages,
    currency: data.currency || "EGP",
  };
}

export async function getPackageById(id: number): Promise<ApiPackage> {
  const response = await fetch(buildCasherPublicApiUrl(`/api/public/client/packages/${id}`), {
    cache: "no-store",
  });
  const data: { ok: boolean; package?: unknown } | null = await response.json().catch(() => null);
  const normalized = data?.package ? normalizeApiPackage(data.package) : null;

  if (!response.ok || !data?.ok || !normalized) {
    throw new Error("Unable to load package");
  }

  return normalized;
}
