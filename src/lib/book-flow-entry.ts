import type { BarberAvailabilityScope } from "@/lib/booking-api";

const STORAGE_KEY = "cut-book-entry-barber";

/** Barber chosen at /book entry before services are confirmed. */
export type BookEntryBarber = {
  id: number;
  name: string;
  image: string | null;
  role: string;
  serviceIds?: number[];
  branchCodes: string[];
  /** Set after multi-branch scope step (or auto for single-branch). */
  availabilityScope?: BarberAvailabilityScope | null;
  /** Branch used to load service catalog when scope is all_branches. */
  catalogBranchCode?: string | null;
};

export function saveBookEntryBarber(barber: BookEntryBarber) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(barber));
  } catch {
    /* ignore */
  }
}

export function readBookEntryBarber(): BookEntryBarber | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookEntryBarber;
    if (!Number.isFinite(parsed?.id) || parsed.id <= 0) return null;
    const scope =
      parsed.availabilityScope === "all_branches" ||
      parsed.availabilityScope === "specific_branch"
        ? parsed.availabilityScope
        : null;
    return {
      id: Number(parsed.id),
      name: String(parsed.name || ""),
      image: parsed.image ?? null,
      role: String(parsed.role || ""),
      serviceIds: Array.isArray(parsed.serviceIds)
        ? parsed.serviceIds.map(Number).filter((id) => Number.isFinite(id))
        : undefined,
      branchCodes: Array.isArray(parsed.branchCodes)
        ? parsed.branchCodes.map(String).filter(Boolean)
        : [],
      availabilityScope: scope,
      catalogBranchCode: parsed.catalogBranchCode
        ? String(parsed.catalogBranchCode)
        : null,
    };
  } catch {
    return null;
  }
}

export function clearBookEntryBarber() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function pickCatalogBranchCode(branchCodes: string[]): string | undefined {
  if (!branchCodes.length) return undefined;
  const gleem = branchCodes.find((c) => c.toUpperCase() === "GLEEM");
  return gleem ?? branchCodes[0];
}
