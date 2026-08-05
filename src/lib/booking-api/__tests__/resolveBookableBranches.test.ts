import { describe, it, expect } from "vitest";
import { resolveBookableBranchesForBarber } from "@/lib/booking-api/resolve-bookable-branches";
import { getBookingSteps, recoverStepInSequence } from "@/lib/booking-api/booking-steps";
import {
  getEffectiveBookingBranch,
  getBookingBranchDisplay,
} from "@/lib/booking-api/booking-branch";
import {
  filterBarbersForPublicDiscovery,
  filterBarbersForBranchRoster,
  isBarberAssignedToBranch,
} from "@/lib/booking-api/barber-eligibility";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import type { PublicBranch, PublicBarber } from "@/lib/booking-api/types";

const gleem: PublicBranch = {
  branchCode: "GLEEM",
  branchName: "جليم – سابا باشا",
  shortName: "جليم",
  address: null,
  phone: null,
  timeZone: "Africa/Cairo",
};

const camp: PublicBranch = {
  branchCode: "CAMP_CAESAR",
  branchName: "كامب شيزار",
  shortName: "كامب شيزار",
  address: null,
  phone: null,
  timeZone: "Africa/Cairo",
};

const publicBranches = [gleem, camp];

describe("normalizeBranchCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeBranchCode("  camp_caesar ")).toBe("CAMP_CAESAR");
  });
});

describe("resolveBookableBranchesForBarber", () => {
  it("Ahmed (Camp only) auto-resolves to CAMP_CAESAR", () => {
    const result = resolveBookableBranchesForBarber({
      barberProfileBranches: [{ branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" }],
      publicBranches,
      preferredBranchCode: "GLEEM",
    });
    expect(result.resolution).toBe("single");
    expect(result.resolvedBranch?.branchCode).toBe("CAMP_CAESAR");
    expect(result.allowedBranches).toHaveLength(1);
  });

  it("Mahmoud (Gleem only) auto-resolves to GLEEM", () => {
    const result = resolveBookableBranchesForBarber({
      barberProfileBranches: [{ branchCode: "GLEEM", branchName: "جليم" }],
      publicBranches,
      preferredBranchCode: "CAMP_CAESAR",
    });
    expect(result.resolution).toBe("single");
    expect(result.resolvedBranch?.branchCode).toBe("GLEEM");
  });

  it("Ziad multi-branch reuses preferred when valid", () => {
    const result = resolveBookableBranchesForBarber({
      barberProfileBranches: [
        { branchCode: "CAMP_CAESAR", branchName: "كامب" },
        { branchCode: "GLEEM", branchName: "جليم" },
      ],
      publicBranches,
      preferredBranchCode: "GLEEM",
    });
    expect(result.resolution).toBe("preferred");
    expect(result.resolvedBranch?.branchCode).toBe("GLEEM");
    expect(result.allowedBranches).toHaveLength(2);
  });

  it("Kareem multi-branch without preferred requires picker", () => {
    const result = resolveBookableBranchesForBarber({
      barberProfileBranches: [
        { branchCode: "CAMP_CAESAR", branchName: "كامب" },
        { branchCode: "GLEEM", branchName: "جليم" },
      ],
      publicBranches,
      preferredBranchCode: null,
    });
    expect(result.resolution).toBe("multiple");
    expect(result.resolvedBranch).toBeNull();
  });

  it("barber with no public intersection → none", () => {
    const result = resolveBookableBranchesForBarber({
      barberProfileBranches: [{ branchCode: "UNKNOWN", branchName: "x" }],
      publicBranches,
    });
    expect(result.resolution).toBe("none");
    expect(result.allowedBranches).toHaveLength(0);
  });
});

describe("getEffectiveBookingBranch", () => {
  it("never shows stale preferred during barber-first none resolution", () => {
    const effective = getEffectiveBookingBranch({
      preferredBranchCode: "GLEEM",
      publicBranches,
      allowedBranches: [],
      branchResolution: "none",
      entryMode: "barber_first",
    });
    expect(effective.branchCode).toBeNull();
    expect(effective.source).toBe("none");
  });

  it("draft branch wins over preferred", () => {
    const effective = getEffectiveBookingBranch({
      draftBranchCode: "CAMP_CAESAR",
      preferredBranchCode: "GLEEM",
      publicBranches,
      allowedBranches: [camp],
      branchResolution: "single",
      entryMode: "barber_first",
    });
    expect(effective.branchCode).toBe("CAMP_CAESAR");
    expect(effective.source).toBe("draft");
  });

  it("suppresses preferred for multi-branch without draft (any scope)", () => {
    const base = {
      preferredBranchCode: "GLEEM",
      publicBranches,
      allowedBranches: [gleem, camp],
      branchResolution: "preferred" as const,
      entryMode: "barber_first" as const,
      multiBranchBarber: true,
    };
    expect(getEffectiveBookingBranch({ ...base, availabilityScope: null }).source).toBe("none");
    expect(
      getEffectiveBookingBranch({ ...base, availabilityScope: "all_branches" }).source,
    ).toBe("none");
    expect(
      getEffectiveBookingBranch({ ...base, availabilityScope: "specific_branch" }).source,
    ).toBe("none");
  });

  it("display uses not-set label when unresolved", () => {
    const display = getBookingBranchDisplay(
      {
        preferredBranchCode: "GLEEM",
        publicBranches,
        allowedBranches: [],
        branchResolution: "none",
        entryMode: "barber_first",
      },
      "en",
      "Not set yet",
    );
    expect(display.isSet).toBe(false);
    expect(display.name).toBe("Not set yet");
  });
});

describe("getBookingSteps", () => {
  it("barber-first with resolved branch skips branch and mode", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: true,
        barberResolved: true,
      }),
    ).toEqual(["service", "date", "time", "details", "review"]);
  });

  it("barber-first with multiple branches shows branch step", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: false,
        barberResolved: true,
      }),
    ).toEqual(["branch", "service", "date", "time", "details", "review"]);
  });

  it("multi-branch barber shows appointment_scope before service", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: false,
        barberResolved: true,
        multiBranchBarber: true,
        availabilityScope: null,
      }),
    ).toEqual(["appointment_scope", "service", "date", "time", "details", "review"]);
  });

  it("multi-branch specific_branch adds branch step until resolved", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: false,
        barberResolved: true,
        multiBranchBarber: true,
        availabilityScope: "specific_branch",
      }),
    ).toEqual(["appointment_scope", "branch", "service", "date", "time", "details", "review"]);
  });

  it("nearest with confirmed branch skips branch and mode", () => {
    expect(
      getBookingSteps({
        entryMode: "branch_first",
        initialMode: "nearest",
        branchResolved: true,
        barberResolved: false,
      }),
    ).toEqual(["service", "date", "time", "details", "review"]);
  });

  it("branch-first without initial mode includes mode", () => {
    expect(
      getBookingSteps({
        entryMode: "branch_first",
        branchResolved: true,
        barberResolved: false,
      }),
    ).toEqual(["mode", "service", "date", "time", "details", "review"]);
  });

  it("recoverStepInSequence moves off removed branch step", () => {
    expect(
      recoverStepInSequence("branch", ["service", "date", "time", "details", "review"]),
    ).toBe("service");
  });
});

describe("barber eligibility", () => {
  const ahmed: PublicBarber = {
    id: 18,
    name: "احمد",
    nameAr: "احمد",
    nameEn: "Ahmed",
    job: null,
    imageUrl: null,
    photoUrl: null,
    bio: null,
    isBookableOnline: true,
    branches: [{ branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" }],
  };
  const mahmoud: PublicBarber = {
    id: 1188,
    name: "محمود",
    nameAr: "محمود",
    nameEn: "Mahmoud",
    job: null,
    imageUrl: null,
    photoUrl: null,
    bio: null,
    isBookableOnline: true,
    branches: [{ branchCode: "GLEEM", branchName: "جليم" }],
  };

  it("Ahmed is eligible globally through Camp", () => {
    const list = filterBarbersForPublicDiscovery([ahmed, mahmoud], publicBranches);
    expect(list.map((b) => b.id)).toContain(18);
  });

  it("Ahmed is absent from GLEEM roster and present in Camp roster", () => {
    expect(isBarberAssignedToBranch(ahmed, "GLEEM")).toBe(false);
    expect(isBarberAssignedToBranch(ahmed, "CAMP_CAESAR")).toBe(true);
    expect(filterBarbersForBranchRoster([ahmed], "GLEEM", publicBranches)).toHaveLength(0);
    expect(filterBarbersForBranchRoster([ahmed], "CAMP_CAESAR", publicBranches)).toHaveLength(1);
  });
});
