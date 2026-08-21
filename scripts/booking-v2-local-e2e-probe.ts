/**
 * Booking V2 local E2E probe (Node) — no browser.
 * Verifies API contract + local slot gen + zero-network regeneration.
 * Run: npx tsx scripts/booking-v2-local-e2e-probe.ts
 */
import {
  getBookingBootstrap,
  getAvailabilityMatrix,
  BOOKING_API_BASE_URL,
} from "../src/lib/bookingV2/api";
import { resolveAvailabilityScope, toAvailabilityRequest } from "../src/lib/bookingV2/scope";
import { generateSlotsForBusinessDate } from "../src/lib/bookingV2/localAvailability";
import { generateStartsFromFree } from "../src/lib/bookingV2/generateStartsFromFree";
import { cacheClear } from "../src/lib/bookingV2/cache";

async function main() {
  const report: Record<string, unknown> = {};
  const failures: string[] = [];

  if (String(BOOKING_API_BASE_URL).includes("casher-five")) {
    failures.push("Production API base detected");
  }
  report.apiBase = BOOKING_API_BASE_URL || process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL;

  cacheClear();
  const boot = await getBookingBootstrap({ force: true });
  report.bootstrap = {
    ok: boot.ok,
    contract: boot.contract,
    barbers: boot.barbers.length,
    services: boot.services.length,
    branches: boot.branches.map((b) => b.branchCode),
  };
  if (!boot.ok || boot.barbers.length === 0 || boot.services.length === 0) {
    failures.push("bootstrap incomplete");
  }

  const zeyad = boot.barbers.find((b) => b.empId === 12 || /ziad|زياد/i.test(b.name + b.nameEn));
  if (!zeyad) failures.push("Zeyad missing");

  const scope = resolveAvailabilityScope({
    mode: "specific",
    empId: zeyad?.empId ?? 12,
    barber: zeyad ?? null,
    allBranchCodes: boot.branches.map((b) => b.branchCode),
  });
  const { todayBusinessDate } = await import("../src/lib/bookingV2/businessDate");
  const req2 = toAvailabilityRequest(scope, todayBusinessDate(), 14);

  let availCount = 0;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = String(args[0]);
    if (url.includes("/availability")) availCount += 1;
    if (url.includes("casher-five")) failures.push(`production request: ${url}`);
    return origFetch(...args);
  };

  const matrix = await getAvailabilityMatrix(req2, { force: true });
  report.matrix = {
    ok: matrix.ok,
    days: matrix.matrix.length,
    from: matrix.fromBusinessDate,
    to: matrix.toBusinessDate,
    branches: scope.branchCodes,
    availabilityRequests: availCount,
  };
  if (availCount !== 1) failures.push(`expected 1 availability request, got ${availCount}`);

  const before = availCount;
  const day = matrix.matrix.find((d) =>
    d.branches.some((b) => b.employees.some((e) => e.freeRanges.length > 0)),
  );
  if (!day) failures.push("no free day in matrix");

  const d30 = generateSlotsForBusinessDate({
    matrix,
    businessDate: day!.businessDate,
    durationMinutes: 30,
    intervalMinutes: matrix.slotIntervalMinutes || 15,
    branchCode: "GLEEM",
    empId: 12,
    mode: "specific",
  });
  const d60 = generateSlotsForBusinessDate({
    matrix,
    businessDate: day!.businessDate,
    durationMinutes: 60,
    intervalMinutes: matrix.slotIntervalMinutes || 15,
    branchCode: "GLEEM",
    empId: 12,
    mode: "specific",
  });
  const camp = generateSlotsForBusinessDate({
    matrix,
    businessDate: day!.businessDate,
    durationMinutes: 30,
    intervalMinutes: matrix.slotIntervalMinutes || 15,
    branchCode: "CAMP_CAESAR",
    empId: 12,
    mode: "specific",
  });

  report.zeroNetwork = {
    availabilityAfterLocalOps: availCount - before,
    service30: d30.length,
    service60: d60.length,
    branchCamp: camp.length,
  };
  if (availCount !== before) failures.push("local regen caused network");

  // overnight
  const ovDay = matrix.matrix.find((d) =>
    d.branches.some((b) =>
      b.employees.some((e) => e.freeRanges.some((r) => r.endMin > 1440)),
    ),
  );
  if (ovDay) {
    const emp = ovDay.branches.flatMap((b) => b.employees).find((e) => e.freeRanges.some((r) => r.endMin > 1440))!;
    const starts = generateStartsFromFree({
      businessDate: ovDay.businessDate,
      freeRanges: emp.freeRanges,
      durationMinutes: 15,
      intervalMinutes: 15,
      empId: emp.empId,
      branchCode: emp.branchCode ?? "GLEEM",
    });
    const overnight = starts.filter((s) => s.dayOffset === 1);
    report.overnight = {
      businessDate: ovDay.businessDate,
      sample: overnight.slice(0, 4).map((s) => ({ time: s.time, dayOffset: s.dayOffset, bd: s.businessDate })),
      allSameBusinessDate: overnight.every((s) => s.businessDate === ovDay.businessDate),
    };
    if (!report.overnight.allSameBusinessDate) failures.push("overnight mutated BusinessDate");
  } else {
    report.overnight = { skipped: "no overnight free in window" };
  }

  // nearest roster
  availCount = 0;
  const nearestScope = resolveAvailabilityScope({
    mode: "nearest",
    allBranchCodes: ["GLEEM"],
  });
  const nearestReq = toAvailabilityRequest(nearestScope, todayBusinessDate(), 14);
  await getAvailabilityMatrix(nearestReq, { force: true });
  report.anyBarber = { availabilityRequests: availCount, scope: nearestScope };
  if (availCount !== 1) failures.push("nearest should be 1 request");

  // write URL check (no execute)
  const planUrl = `${String(report.apiBase).replace(/\/$/, "")}/api/public/booking/plan`;
  report.legacyWriteUrl = planUrl;
  if (planUrl.includes("casher-five")) failures.push("write would hit production");

  globalThis.fetch = origFetch;

  report.failures = failures;
  report.verdict = failures.length === 0 ? "GO" : "NO-GO";
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
