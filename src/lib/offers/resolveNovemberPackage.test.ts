import { describe, expect, it, vi } from "vitest";
import type { ApiPackage } from "@/lib/packagesApi";
import { matchNovemberPackage, resolveNovemberPackage } from "./resolveNovemberPackage";

function pack(partial: Partial<ApiPackage> & Pick<ApiPackage, "packageId" | "price">): ApiPackage {
  return {
    kind: "regular",
    code: null,
    nameAr: null,
    nameEn: null,
    originalPrice: null,
    savings: null,
    durationMinutes: null,
    imageUrl: null,
    popular: false,
    includes: [],
    groom: null,
    ...partial,
  };
}

describe("matchNovemberPackage", () => {
  it("matches by package code NOV-PRO600", () => {
    const list = [
      pack({ packageId: 1, price: 333, nameEn: "October", code: "OCT-333" }),
      pack({ packageId: 9, price: 600, nameEn: "Other", code: "NOV-PRO600" }),
    ];
    expect(matchNovemberPackage(list)).toEqual({
      pack: list[1],
      matchedBy: "code",
    });
  });

  it("falls back to November Protein naming", () => {
    const list = [pack({ packageId: 11, price: 600, nameEn: "November Protein Reset", code: null })];
    expect(matchNovemberPackage(list)?.matchedBy).toBe("name");
  });

  it("returns null when nothing matches", () => {
    expect(matchNovemberPackage([pack({ packageId: 7, price: 333, nameEn: "October Package" })])).toBeNull();
  });
});

describe("resolveNovemberPackage", () => {
  it("prefers the env package id when getById succeeds", async () => {
    const live = pack({ packageId: 15, price: 600, nameEn: "November Protein Reset", code: "NOV-PRO600" });
    const getById = vi.fn().mockResolvedValue(live);
    const listPackages = vi.fn();
    const result = await resolveNovemberPackage({
      envPackageId: 15,
      branchCode: "GLEEM",
      getById,
      listPackages,
    });
    expect(result).toEqual({ status: "ready", packageId: 15, package: live, matchedBy: "env" });
    expect(getById).toHaveBeenCalledWith(15, "GLEEM");
    expect(listPackages).not.toHaveBeenCalled();
  });

  it("lists packages when env id is missing", async () => {
    const live = pack({ packageId: 18, price: 600, code: "NOV-PRO600" });
    const listPackages = vi.fn().mockResolvedValue([live]);
    const result = await resolveNovemberPackage({
      envPackageId: null,
      branchCode: "CAMP_CAESAR",
      getById: vi.fn(),
      listPackages,
    });
    expect(result.status).toBe("ready");
    expect(result.packageId).toBe(18);
    expect(result.matchedBy).toBe("code");
    expect(listPackages).toHaveBeenCalledWith("regular", "CAMP_CAESAR");
  });

  it("defaults catalog branch to GLEEM when branchCode is omitted", async () => {
    const live = pack({ packageId: 8, price: 600, code: "NOV-PRO600" });
    const listPackages = vi.fn().mockResolvedValue([live]);
    await resolveNovemberPackage({
      envPackageId: null,
      getById: vi.fn(),
      listPackages,
    });
    expect(listPackages).toHaveBeenCalledWith("regular", "GLEEM");
  });

  it("reports missing when the POS package is not published yet", async () => {
    const result = await resolveNovemberPackage({
      envPackageId: null,
      getById: vi.fn(),
      listPackages: vi.fn().mockResolvedValue([]),
    });
    expect(result).toEqual({ status: "missing", packageId: null, package: null, matchedBy: null });
  });

  it("reports error when the packages API fails", async () => {
    const result = await resolveNovemberPackage({
      envPackageId: null,
      getById: vi.fn(),
      listPackages: vi.fn().mockRejectedValue(new Error("offline")),
    });
    expect(result.status).toBe("error");
  });
});
