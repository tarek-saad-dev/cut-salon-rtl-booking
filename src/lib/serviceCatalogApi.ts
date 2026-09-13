import { getBookingApiBaseUrl } from "@/lib/booking-api/env";

export type ServiceCatalogService = {
  id: number;
  nameEn: string | null;
  nameAr: string | null;
  price: number;
  bonus: number | null;
  durationMinutes: number | null;
  imageUrl: string | null;
  isActive: boolean;
  salesCount: number;
  categoryId: number;
  /** Present when the public catalog includes procedure stages */
  hasSteps?: boolean | null;
  stepCount?: number | null;
  steps?: unknown;
};

export type ServiceCatalogCategory = {
  id: number;
  name: string | null;
  type: string | null;
  sortOrder: number;
  serviceCount: number;
  services: ServiceCatalogService[];
};

type ServiceCatalogResponse = {
  ok: boolean;
  categories: ServiceCatalogCategory[];
};

export async function getServiceCatalog(): Promise<ServiceCatalogCategory[]> {
  const apiBase = getBookingApiBaseUrl();
  const response = await fetch(`${apiBase}/api/services/catalog?type=serv`, { cache: "no-store" });
  const data: ServiceCatalogResponse | null = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error("Unable to load service catalog");
  }

  return data.categories;
}
