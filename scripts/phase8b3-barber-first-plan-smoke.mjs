/**
 * Phase 8B3 — barber-first plan smoke (stop before create).
 * Uses Origin: https://cutsaloon.com for CORS parity with production.
 */
const base = "https://casher-five.vercel.app";
const origin = "https://cutsaloon.com";

async function get(path) {
  const res = await fetch(base + path, {
    headers: { Origin: origin },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, contract: res.headers.get("x-booking-contract-version") };
}

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "Idempotency-Key": `smoke-8b3-${Date.now()}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, contract: res.headers.get("x-booking-contract-version") };
}

function dayOpen(d) {
  return d.available === true || d.isAvailable === true;
}
function slotOpen(s) {
  return s.available === true || s.isAvailable === true;
}

const global = await get("/api/public/booking/barbers");
const barbers = (global.json?.barbers || []).filter((b) => b.isBookableOnline !== false);
const barber = barbers.find(
  (b) =>
    Array.isArray(b.serviceIds) &&
    b.serviceIds.length > 0 &&
    Array.isArray(b.branches) &&
    b.branches.some((x) => x.branchCode && String(x.branchCode).toUpperCase() !== "CAMP_CAESAR"),
) || barbers[0];

if (!barber) {
  console.log(JSON.stringify({ ok: false, reason: "no_public_barbers", status: global.status }, null, 2));
  process.exit(1);
}

const empId = barber.id ?? barber.empId;
const branches = (barber.branches || []).filter(
  (b) => b.branchCode && String(b.branchCode).toUpperCase() !== "CAMP_CAESAR",
);
const branchCode = branches[0]?.branchCode;
const serviceId = (barber.serviceIds || [])[0];

const summary = {
  ok: true,
  phase: "8B3-barber-first-plan-smoke",
  empId,
  name: barber.name || barber.nameAr,
  branchCode,
  serviceId,
  campFiltered: !(barber.branches || []).some((b) => /camp/i.test(b.branchCode || "")),
  contract: global.contract,
};

if (!branchCode || !serviceId) {
  console.log(JSON.stringify({ ...summary, ok: false, reason: "missing_branch_or_service" }, null, 2));
  process.exit(1);
}

const days = await get(
  `/api/public/booking/available-days?branchCode=${encodeURIComponent(branchCode)}&serviceIds=${serviceId}&mode=specific&empId=${empId}`,
);
const openDay = (days.json?.days || days.json?.availableDays || []).find(dayOpen);
if (!openDay) {
  console.log(
    JSON.stringify(
      {
        ...summary,
        plan: "SKIP",
        reason: "no_open_day",
        daysStatus: days.status,
        sample: (days.json?.days || []).slice(0, 3),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const date = openDay.date;
const slots = await get(
  `/api/public/booking/available-slots?branchCode=${encodeURIComponent(branchCode)}&date=${date}&serviceIds=${serviceId}&mode=specific&empId=${empId}`,
);
const openSlot = (slots.json?.slots || slots.json?.availableSlots || []).find(slotOpen);
if (!openSlot) {
  console.log(
    JSON.stringify(
      { ...summary, plan: "SKIP", reason: "no_open_slot", date, slotsStatus: slots.status },
      null,
      2,
    ),
  );
  process.exit(0);
}

const plan = await post("/api/public/booking/plan", {
  branchCode,
  serviceIds: [serviceId],
  mode: "specific",
  empId,
  date,
  startTime: openSlot.time || openSlot.startTime,
  customer: {
    name: "Smoke 8B3",
    phone: "01000000000",
  },
});

const planToken = plan.json?.planToken || plan.json?.plan?.planToken;
const totalPrice = plan.json?.totalPrice ?? plan.json?.plan?.totalPrice;

console.log(
  JSON.stringify(
    {
      ...summary,
      date,
      time: openSlot.time || openSlot.startTime,
      planStatus: plan.status,
      planTokenPresent: Boolean(planToken),
      totalPrice,
      create: "NOT_RUN",
      verdict: plan.status >= 200 && plan.status < 300 && planToken ? "PASS" : "FAIL",
    },
    null,
    2,
  ),
);

process.exit(plan.status >= 200 && plan.status < 300 && planToken ? 0 : 2);
