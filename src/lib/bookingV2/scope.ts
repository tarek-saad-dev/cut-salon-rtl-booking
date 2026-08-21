import type {
  AvailabilityMatrix,
  AvailabilityRequest,
  AvailabilityScope,
  BookingModeV2,
  BookingV2Barber,
  BranchCode,
} from "./types";

export const ZEYAD_BRANCH_CODES: BranchCode[] = ["GLEEM", "CAMP_CAESAR"];

const ZEYAD_NAME_RE = /زياد|ذياد|ziad|zeyad/i;

export function isZeyadBarber(barber: Pick<BookingV2Barber, "name" | "nameAr" | "nameEn" | "empId">): boolean {
  const names = [barber.name, barber.nameAr, barber.nameEn].filter(Boolean).join(" ");
  return ZEYAD_NAME_RE.test(names);
}

export function uniqueBranchCodes(codes: BranchCode[]): BranchCode[] {
  const seen = new Set<string>();
  const out: BranchCode[] = [];
  for (const code of codes) {
    const key = String(code).toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(code);
  }
  return out;
}

/**
 * Resolve availability scope for a booking selection.
 * Specific Zeyad → GLEEM + CAMP_CAESAR in one request.
 * Specific other → that barber's branches (or provided fallback).
 * Nearest → branch roster codes (all requested branches).
 */
export function resolveAvailabilityScope(input: {
  mode: BookingModeV2;
  empId?: number;
  barber?: BookingV2Barber | null;
  selectedBranchCode?: BranchCode | null;
  allBranchCodes?: BranchCode[];
}): AvailabilityScope {
  const { mode, empId, barber, selectedBranchCode, allBranchCodes = [] } = input;

  if (mode === "nearest") {
    const roster =
      allBranchCodes.length > 0
        ? allBranchCodes
        : selectedBranchCode
          ? [selectedBranchCode]
          : ZEYAD_BRANCH_CODES;
    return {
      mode: "nearest",
      branchCodes: uniqueBranchCodes(roster),
    };
  }

  const id = empId ?? barber?.empId;
  const barberBranches = (barber?.branches ?? []).map((b) => b.branchCode);
  const isZeyad = barber ? isZeyadBarber(barber) : false;

  let branchCodes: BranchCode[];
  if (isZeyad) {
    branchCodes = [...ZEYAD_BRANCH_CODES];
  } else if (barberBranches.length > 0) {
    branchCodes = barberBranches;
  } else if (selectedBranchCode) {
    branchCodes = [selectedBranchCode];
  } else {
    branchCodes = allBranchCodes.length > 0 ? allBranchCodes : ["GLEEM"];
  }

  return {
    mode: "specific",
    empId: id,
    branchCodes: uniqueBranchCodes(branchCodes),
  };
}

export function scopeCacheKey(
  scope: AvailabilityScope,
  fromBusinessDate: string,
  toOrDays: string | number,
): string {
  const branches = [...scope.branchCodes].map((c) => String(c).toUpperCase()).sort().join(",");
  return `${scope.mode}|${scope.empId ?? "any"}|${branches}|${fromBusinessDate}|${toOrDays}`;
}

export function toAvailabilityRequest(
  scope: AvailabilityScope,
  fromBusinessDate: string,
  days = 14,
): AvailabilityRequest {
  const [y, m, d] = fromBusinessDate.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + (days - 1));
  const dt = new Date(utc);
  const toBusinessDate = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;

  return {
    mode: scope.mode,
    empId: scope.empId,
    branchCodes: scope.branchCodes,
    fromBusinessDate,
    toBusinessDate,
    days,
  };
}

/** True when switching branch stays inside an already-loaded matrix scope. */
export function isBranchLoadedInMatrix(
  matrix: AvailabilityMatrix | null | undefined,
  branchCode: BranchCode,
): boolean {
  if (!matrix) return false;
  const target = String(branchCode).toUpperCase();
  return matrix.scope.branchCodes.some((c) => String(c).toUpperCase() === target);
}
