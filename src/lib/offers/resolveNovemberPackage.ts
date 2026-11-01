import {
  NOVEMBER_PACKAGE_CODE,
  readNovemberPackageIdFromEnv,
} from "@/config/novemberProteinOffer";
import { getPackageById, getPackages, type ApiPackage } from "@/lib/packagesApi";

export type NovemberPackageStatus = "ready" | "missing" | "inactive" | "error";

export type NovemberPackageResolution = {
  status: NovemberPackageStatus;
  packageId: number | null;
  package: ApiPackage | null;
  matchedBy: "env" | "code" | "name" | null;
};

function normalizeBlob(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Pure matcher used by tests and the live resolver. */
export function matchNovemberPackage(list: readonly ApiPackage[]): {
  pack: ApiPackage;
  matchedBy: "code" | "name";
} | null {
  const code = normalizeBlob(NOVEMBER_PACKAGE_CODE);
  const byCode = list.find((pack) => normalizeBlob(pack.code) === code);
  if (byCode) return { pack: byCode, matchedBy: "code" };

  const byName = list.find((pack) => {
    const blob = `${normalizeBlob(pack.nameEn)} ${normalizeBlob(pack.nameAr)}`;
    return (
      blob.includes("nov-pro600") ||
      blob.includes("protein reset") ||
      (blob.includes("november") && blob.includes("protein")) ||
      (blob.includes("نوفمبر") && blob.includes("بروتين"))
    );
  });
  if (byName) return { pack: byName, matchedBy: "name" };
  return null;
}

export async function resolveNovemberPackage(
  deps: {
    getById?: typeof getPackageById;
    listPackages?: typeof getPackages;
    envPackageId?: number | null;
  } = {},
): Promise<NovemberPackageResolution> {
  const getById = deps.getById ?? getPackageById;
  const listPackages = deps.listPackages ?? getPackages;
  const envPackageId =
    deps.envPackageId !== undefined ? deps.envPackageId : readNovemberPackageIdFromEnv();

  try {
    if (envPackageId != null) {
      try {
        const pack = await getById(envPackageId);
        return {
          status: "ready",
          packageId: pack.packageId,
          package: pack,
          matchedBy: "env",
        };
      } catch {
        /* fall through to list match */
      }
    }

    const list = await listPackages("regular");
    const matched = matchNovemberPackage(list);
    if (!matched) {
      return { status: "missing", packageId: null, package: null, matchedBy: null };
    }
    return {
      status: "ready",
      packageId: matched.pack.packageId,
      package: matched.pack,
      matchedBy: matched.matchedBy,
    };
  } catch {
    return { status: "error", packageId: null, package: null, matchedBy: null };
  }
}
