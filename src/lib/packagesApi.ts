const API_BASE = (process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ?? "").replace(/\/$/, "");

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

export type PackageGroomInfo = {
  depositAmount: number | null;
  includesTrial: boolean;
  sessionCount: number | null;
  notesAr: string | null;
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

type PackagesResponse = {
  ok: boolean;
  currency: string;
  regular: ApiPackage[];
  groom: ApiPackage[];
  packages: ApiPackage[];
  meta: {
    regularCount: number;
    groomCount: number;
    totalCount: number;
    generatedAt: string;
    contractVersion: string;
  };
};

export async function getPackages(kind?: "regular" | "groom"): Promise<ApiPackage[]> {
  const qs = kind ? `?kind=${kind}` : "";
  const response = await fetch(`${API_BASE}/api/public/client/packages${qs}`, { cache: "no-store" });
  const data: PackagesResponse | null = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error("Unable to load packages");
  }

  if (kind === "regular") return data.regular ?? [];
  if (kind === "groom") return data.groom ?? [];
  return data.packages ?? [];
}

export async function getPackageById(id: number): Promise<ApiPackage> {
  const response = await fetch(`${API_BASE}/api/public/client/packages/${id}`, { cache: "no-store" });
  const data: { ok: boolean; package?: ApiPackage } | null = await response.json().catch(() => null);

  if (!response.ok || !data?.ok || !data.package) {
    throw new Error("Unable to load package");
  }

  return data.package;
}
