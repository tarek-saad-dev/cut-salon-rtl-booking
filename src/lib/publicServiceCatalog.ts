import { buildCasherPublicApiUrl } from "@/lib/casherPublicApiUrl";

export type PublicServiceFact = { id: number; ar: string; en: string; price: number };
export type PublicBranchCatalog = { code: string; name: string; services: PublicServiceFact[]; available: boolean };
const text = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 200) : "";

async function readPublic(path: string) {
  const response = await fetch(buildCasherPublicApiUrl(path), {
    method: "GET", credentials: "omit", redirect: "error",
    next: { revalidate: 300 }, signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Public catalog unavailable");
  const body = await response.json();
  if (body?.ok !== true) throw new Error("Public catalog unavailable");
  return body;
}

/** Public read-only endpoints only. Never forward cookies, credentials or API diagnostics. */
export async function loadPublicServiceCatalog(): Promise<PublicBranchCatalog[]> {
  try {
    const body = await readPublic("/api/public/branches");
    if (!Array.isArray(body.branches)) return [];
    const seen = new Set<string>();
    const branches = body.branches.flatMap((raw: Record<string, unknown>) => {
      if (!raw || typeof raw !== "object") return [];
      const code = text(raw.branchCode);
      const name = text(raw.branchName);
      if (!code || !name || seen.has(code)) return [];
      seen.add(code);
      return [{ code, name }];
    });
    return await Promise.all(branches.map(async (branch: { code: string; name: string }) => {
      try {
        const query = new URLSearchParams({ type: "serv", branchCode: branch.code });
        const catalog = await readPublic(`/api/services/catalog?${query}`);
        if (!Array.isArray(catalog.categories)) throw new Error("Invalid catalog");
        const ids = new Set<number>();
        const services: PublicServiceFact[] = catalog.categories.flatMap((category: { services?: unknown[] }) =>
          (Array.isArray(category?.services) ? category.services : []).flatMap((value: unknown) => {
            if (!value || typeof value !== "object") return [];
            const raw = value as Record<string, unknown>;
            const ar = text(raw.nameAr), en = text(raw.nameEn);
            if (raw.isActive !== true || typeof raw.id !== "number" || !Number.isInteger(raw.id) || raw.id <= 0 || ids.has(raw.id)
              || (!ar && !en) || typeof raw.price !== "number" || !Number.isFinite(raw.price) || raw.price < 0) return [];
            ids.add(raw.id);
            return [{ id: raw.id, ar: ar || en, en: en || ar, price: raw.price }];
          }));
        return { ...branch, services, available: true };
      } catch { return { ...branch, services: [], available: false }; }
    }));
  } catch { return []; }
}
