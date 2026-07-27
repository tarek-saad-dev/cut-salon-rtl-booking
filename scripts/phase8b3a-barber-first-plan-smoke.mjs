/**
 * Phase 8B3A — barber-first live planToken proof (stop before create).
 */
const base = "https://casher-five.vercel.app";
const origin = "https://cutsaloon.com";

async function get(path) {
  const res = await fetch(base + path, {
    headers: { Origin: origin },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "Idempotency-Key": `smoke-8b3a-${Date.now()}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function dayOpen(d) {
  return d.available === true || d.isAvailable === true;
}

const global = await get("/api/public/booking/barbers");
const barbers = (global.json?.barbers || []).filter((b) => b.isBookableOnline !== false);

let pick = null;
outer: for (const b of barbers) {
  const empId = b.id ?? b.empId;
  const branches = (b.branches || []).filter(
    (x) => x.branchCode && String(x.branchCode).toUpperCase() !== "CAMP_CAESAR",
  );
  for (const br of branches) {
    for (const sid of (b.serviceIds || []).slice(0, 3)) {
      const days = await get(
        `/api/public/booking/available-days?branchCode=${encodeURIComponent(br.branchCode)}&serviceIds=${sid}&mode=specific&empId=${empId}`,
      );
      const openDay = (days.json?.days || []).find(dayOpen);
      if (!openDay) continue;
      const slots = await get(
        `/api/public/booking/available-slots?branchCode=${encodeURIComponent(br.branchCode)}&date=${openDay.date}&serviceIds=${sid}&mode=specific&empId=${empId}`,
      );
      const list = slots.json?.slots || [];
      const openSlot = list.find((s) => s.available !== false && s.isAvailable !== false) || list[0];
      if (!openSlot) continue;
      pick = {
        empId,
        name: b.name || b.nameAr,
        branchCode: br.branchCode,
        serviceId: sid,
        date: openDay.date,
        time: openSlot.time,
        dayOffset: openSlot.dayOffset ?? 0,
      };
      break outer;
    }
  }
}

if (!pick) {
  console.log(JSON.stringify({ ok: false, reason: "no_open_slot", create: "NOT_RUN" }, null, 2));
  process.exit(1);
}

const plan = await post("/api/public/booking/plan", {
  branchCode: pick.branchCode,
  serviceIds: [pick.serviceId],
  mode: "specific",
  empId: pick.empId,
  date: pick.date,
  time: pick.time,
  dayOffset: pick.dayOffset,
  customer: { name: "Smoke 8B3A", phone: "01000000000" },
});

const nested = plan.json?.plan && !Array.isArray(plan.json.plan) ? plan.json.plan : null;
const planToken = nested?.planToken || plan.json?.planToken;
const totalPrice = nested?.total ?? nested?.totalPrice ?? plan.json?.totalPrice;

const verdict =
  plan.status >= 200 && plan.status < 300 && Boolean(planToken) ? "PASS" : "FAIL";

console.log(
  JSON.stringify(
    {
      ok: verdict === "PASS",
      phase: "8B3A-barber-first-planToken",
      ...pick,
      planStatus: plan.status,
      planTokenPresent: Boolean(planToken),
      planTokenPrefix: planToken ? String(planToken).slice(0, 20) : null,
      totalPrice,
      create: "NOT_RUN",
      verdict,
    },
    null,
    2,
  ),
);

process.exit(verdict === "PASS" ? 0 : 2);
