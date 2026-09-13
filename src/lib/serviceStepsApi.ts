import { getBookingApiBaseUrl } from "@/lib/booking-api/env";

export type ServiceStep = {
  id: number;
  sortOrder: number;
  titleAr: string | null;
  titleEn: string | null;
  detailAr: string | null;
  detailEn: string | null;
  durationMinutes: number | null;
};

type RawStep = Record<string, unknown>;

function asRecord(value: unknown): RawStep | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawStep) : null;
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

export function normalizeServiceStep(raw: unknown, index = 0): ServiceStep | null {
  const row = asRecord(raw);
  if (!row) return null;

  const titleAr = pickString(row.titleAr, row.TitleAr, row.title_ar);
  const titleEn = pickString(row.titleEn, row.TitleEn, row.title_en);
  if (!titleAr && !titleEn) return null;

  return {
    id: pickNumber(row.id, row.StepID, row.stepId, row.step_id) ?? index + 1,
    sortOrder: pickNumber(row.sortOrder, row.SortOrder, row.sort_order) ?? (index + 1) * 10,
    titleAr,
    titleEn,
    detailAr: pickString(row.detailAr, row.DetailAr, row.detail_ar, row.bodyAr, row.descriptionAr),
    detailEn: pickString(row.detailEn, row.DetailEn, row.detail_en, row.bodyEn, row.descriptionEn),
    durationMinutes: pickNumber(row.durationMinutes, row.DurationMinutes, row.duration_minutes),
  };
}

export function normalizeServiceSteps(raw: unknown): ServiceStep[] {
  const root = asRecord(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(root?.steps)
      ? root.steps
      : Array.isArray(asRecord(root?.data)?.steps)
        ? (asRecord(root?.data)?.steps as unknown[])
        : [];

  return list
    .map((item, index) => normalizeServiceStep(item, index))
    .filter((step): step is ServiceStep => Boolean(step))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

const PUBLIC_STEPS_PATHS = (serviceId: number | string) => [
  `/api/public/services/${serviceId}/steps`,
  `/api/public/booking/services/${serviceId}/steps`,
];

export class ServiceStepsUnavailableError extends Error {
  readonly status: number;

  constructor(message = "Service steps are not available on the public API yet", status = 404) {
    super(message);
    this.name = "ServiceStepsUnavailableError";
    this.status = status;
  }
}

export async function getServiceSteps(serviceId: number | string): Promise<ServiceStep[]> {
  const apiBase = getBookingApiBaseUrl();
  let lastStatus = 404;
  let lastError: Error | null = null;

  for (const path of PUBLIC_STEPS_PATHS(serviceId)) {
    try {
      const response = await fetch(`${apiBase}${path}`, { cache: "no-store" });
      lastStatus = response.status;
      if (response.status === 404) continue;
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        lastError = new Error(`Unable to load service steps (${response.status})`);
        continue;
      }
      return normalizeServiceSteps(data);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unable to load service steps");
    }
  }

  if (lastStatus === 404 && !lastError) {
    throw new ServiceStepsUnavailableError();
  }

  throw lastError ?? new ServiceStepsUnavailableError();
}

export function serviceCatalogHasSteps(service: {
  hasSteps?: boolean | null;
  stepCount?: number | null;
  steps?: unknown;
}): boolean {
  if (typeof service.hasSteps === "boolean") return service.hasSteps;
  if (typeof service.stepCount === "number") return service.stepCount > 0;
  if (Array.isArray(service.steps)) return normalizeServiceSteps(service.steps).length > 0;
  return false;
}
