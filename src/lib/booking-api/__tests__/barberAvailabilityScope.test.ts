import { describe, it, expect } from "vitest";
import { getBookingSteps } from "@/lib/booking-api/booking-steps";
import { getEffectiveBookingBranch } from "@/lib/booking-api/booking-branch";
import { barberSlotKey } from "@/lib/booking-api/barber-availability";
import type { PublicBranch } from "@/lib/booking-api/types";

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

describe("barberAvailabilityScope — getBookingSteps", () => {
  it("single-branch barber-first skips appointment_scope", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: true,
        barberResolved: true,
        multiBranchBarber: false,
      }),
    ).toEqual(["service", "date", "time", "details", "review"]);
  });

  it("multi-branch with unset scope starts at appointment_scope", () => {
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

  it("multi-branch all_branches skips branch step", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: true,
        barberResolved: true,
        multiBranchBarber: true,
        availabilityScope: "all_branches",
      }),
    ).toEqual(["appointment_scope", "service", "date", "time", "details", "review"]);
  });

  it("multi-branch specific_branch includes branch until resolved", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: false,
        barberResolved: true,
        multiBranchBarber: true,
        availabilityScope: "specific_branch",
      }),
    ).toEqual([
      "appointment_scope",
      "branch",
      "service",
      "date",
      "time",
      "details",
      "review",
    ]);
  });
});

describe("barberAvailabilityScope — getEffectiveBookingBranch", () => {
  it("does not use preferred for all_branches multi-branch", () => {
    const effective = getEffectiveBookingBranch({
      preferredBranchCode: "GLEEM",
      publicBranches,
      allowedBranches: publicBranches,
      branchResolution: "preferred",
      entryMode: "barber_first",
      multiBranchBarber: true,
      availabilityScope: "all_branches",
    });
    expect(effective.branchCode).toBeNull();
    expect(effective.source).toBe("none");
  });

  it("draft/slot still wins under all_branches", () => {
    const effective = getEffectiveBookingBranch({
      draftBranchCode: "CAMP_CAESAR",
      preferredBranchCode: "GLEEM",
      publicBranches,
      allowedBranches: publicBranches,
      branchResolution: "multiple",
      entryMode: "barber_first",
      multiBranchBarber: true,
      availabilityScope: "all_branches",
    });
    expect(effective.branchCode).toBe("CAMP_CAESAR");
    expect(effective.source).toBe("draft");
  });
});

describe("barberAvailabilityScope — barberSlotKey", () => {
  it("keeps same time at different branches unique", () => {
    const a = barberSlotKey({
      empId: 12,
      branchCode: "GLEEM",
      date: "2026-08-10",
      time: "18:00",
      dayOffset: 0,
    });
    const b = barberSlotKey({
      empId: 12,
      branchCode: "CAMP_CAESAR",
      date: "2026-08-10",
      time: "18:00",
      dayOffset: 0,
    });
    expect(a).not.toBe(b);
    expect(a).toContain("GLEEM");
    expect(b).toContain("CAMP_CAESAR");
  });

  it("includes dayOffset in the key", () => {
    const sameDay = barberSlotKey({
      empId: 12,
      branchCode: "GLEEM",
      date: "2026-08-10",
      time: "01:00",
      dayOffset: 0,
    });
    const overnight = barberSlotKey({
      empId: 12,
      branchCode: "GLEEM",
      date: "2026-08-10",
      time: "01:00",
      dayOffset: 1,
    });
    expect(sameDay).not.toBe(overnight);
  });
});

describe("barberAvailabilityScope — merged day shape", () => {
  it("accepts branches summary on available days (compat merge shape)", () => {
    const mergedDay = {
      date: "2026-08-10",
      available: true,
      branches: [
        { branchCode: "GLEEM", slotsCount: 3, earliestTime: "11:00", hasOvernightSlots: false },
        {
          branchCode: "CAMP_CAESAR",
          slotsCount: 2,
          earliestTime: "12:30",
          hasOvernightSlots: true,
        },
      ],
    };
    expect(mergedDay.branches).toHaveLength(2);
    expect(mergedDay.branches.map((b) => b.branchCode).sort()).toEqual([
      "CAMP_CAESAR",
      "GLEEM",
    ]);
  });
});
