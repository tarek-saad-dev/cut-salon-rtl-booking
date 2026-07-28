import type { BookingService } from "./types";

type ServiceNames = Pick<BookingService, "name" | "nameAr" | "nameEn">;

/** Arabic label for booking UI. */
export function serviceNameAr(service: ServiceNames): string {
  return service.nameAr?.trim() || service.name?.trim() || service.nameEn?.trim() || "";
}

/** English label for booking UI. */
export function serviceNameEn(service: ServiceNames): string {
  return service.nameEn?.trim() || service.name?.trim() || service.nameAr?.trim() || "";
}

/** Compact bilingual label: "حلاقة شعر · Hair Cut" (or single name if identical/missing). */
export function formatServiceLabelBilingual(service: ServiceNames): string {
  const ar = serviceNameAr(service);
  const en = serviceNameEn(service);
  if (ar && en && ar !== en) return `${ar} · ${en}`;
  return ar || en;
}

/** Join selected services for summaries (AR · EN per item). */
export function formatServicesSummary(services: ServiceNames[]): string {
  return services.map(formatServiceLabelBilingual).filter(Boolean).join(" + ");
}
