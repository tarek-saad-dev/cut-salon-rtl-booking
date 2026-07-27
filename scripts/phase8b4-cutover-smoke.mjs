/**
 * Phase 8B4 — controlled production cutover smoke.
 * One create → access-token lookup → cancel (idempotent) → verify cancelled.
 * Origin: https://cutsaloon.com. Fake customer only. No enforce activation.
 */
const base = "https://casher-five.vercel.app";
const origin = "https://cutsaloon.com";

async function get(path) {
  const res = await fetch(base + path, {
    headers: { Origin: origin },
    cache: "no-store",
  });
  return { status: res.status, json: await res.json().catch(() => null), headers: res.headers };
}

async function post(path, body, extraHeaders = {}) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return { status: res.status, json: await res.json().catch(() => null), headers: res.headers };
}

function dayOpen(d) {
  return d.available === true || d.isAvailable === true;
}

const smokePhone = "01099887766";
const smokeName = "Smoke 8B4 Cutover";

const global = await get("/api/public/booking/barbers");
const barbers = (global.json?.barbers || []).filter((b) => b.isBookableOnline !== false);
let pick = null;
outer: for (const b of barbers) {
  const empId = b.id ?? b.empId;
  const branches = (b.branches || []).filter(
    (x) => x.branchCode && String(x.branchCode).toUpperCase() !== "CAMP_CAESAR",
  );
  for (const br of branches) {
    for (const sid of (b.serviceIds || []).slice(0, 2)) {
      const days = await get(
        `/api/public/booking/available-days?branchCode=${encodeURIComponent(br.branchCode)}&serviceIds=${sid}&mode=specific&empId=${empId}`,
      );
      const openDay = (days.json?.days || []).find(dayOpen);
      if (!openDay) continue;
      const slots = await get(
        `/api/public/booking/available-slots?branchCode=${encodeURIComponent(br.branchCode)}&date=${openDay.date}&serviceIds=${sid}&mode=specific&empId=${empId}`,
      );
      const list = slots.json?.slots || [];
      const openSlot =
        list.find((s) => s.available !== false && s.isAvailable !== false) || list[0];
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
  console.log(JSON.stringify({ ok: false, stage: "pick", reason: "no_open_slot" }, null, 2));
  process.exit(1);
}

const plan = await post(
  "/api/public/booking/plan",
  {
    branchCode: pick.branchCode,
    serviceIds: [pick.serviceId],
    mode: "specific",
    empId: pick.empId,
    date: pick.date,
    time: pick.time,
    dayOffset: pick.dayOffset,
    customer: { name: smokeName, phone: smokePhone },
  },
  { "Idempotency-Key": `8b4-plan-${Date.now()}` },
);

const nested = plan.json?.plan && !Array.isArray(plan.json.plan) ? plan.json.plan : null;
const planToken = nested?.planToken || plan.json?.planToken;
if (!planToken) {
  console.log(
    JSON.stringify({ ok: false, stage: "plan", pick, planStatus: plan.status, body: plan.json }, null, 2),
  );
  process.exit(2);
}

const clientRequestId = `8b4-create-${Date.now()}`;
const create = await post(
  "/api/public/booking/create",
  {
    branchCode: pick.branchCode,
    serviceIds: [pick.serviceId],
    mode: "specific",
    empId: pick.empId,
    date: pick.date,
    time: pick.time,
    dayOffset: pick.dayOffset,
    customer: { name: smokeName, phone: smokePhone },
    planToken,
    clientRequestId,
  },
  { "Idempotency-Key": clientRequestId },
);

const booking =
  create.json?.booking ||
  (create.json?.bookingCode || create.json?.code ? create.json : null);
const bookingCode =
  booking?.bookingCode || booking?.code || create.json?.bookingCode || create.json?.code;
const accessToken =
  booking?.bookingAccessToken ||
  create.json?.bookingAccessToken ||
  create.json?.accessToken;

if (!bookingCode) {
  console.log(
    JSON.stringify(
      { ok: false, stage: "create", pick, createStatus: create.status, body: create.json },
      null,
      2,
    ),
  );
  process.exit(3);
}

const lookup = await get(
  `/api/public/booking/${encodeURIComponent(bookingCode)}?accessToken=${encodeURIComponent(accessToken || "")}`,
);

const cancelKey = `8b4-cancel-${bookingCode}`;
const cancel1 = await post(
  `/api/public/booking/${encodeURIComponent(bookingCode)}/cancel`,
  {
    bookingAccessToken: accessToken,
    reason: "8B4 cutover smoke",
  },
  { "Idempotency-Key": cancelKey },
);
const cancel2 = await post(
  `/api/public/booking/${encodeURIComponent(bookingCode)}/cancel`,
  {
    bookingAccessToken: accessToken,
    reason: "8B4 cutover smoke",
  },
  { "Idempotency-Key": cancelKey },
);

const after = await get(
  `/api/public/booking/${encodeURIComponent(bookingCode)}?accessToken=${encodeURIComponent(accessToken || "")}`,
);

const statusAfter =
  after.json?.booking?.status ||
  after.json?.status ||
  after.json?.bookingStatus;

const branches = await get("/api/public/branches");
const campInBranches = (branches.json?.branches || []).some((b) =>
  /camp/i.test(b.branchCode || b.branchName || ""),
);

const result = {
  ok: true,
  phase: "8B4-cutover-smoke",
  pick,
  planTokenPresent: true,
  createStatus: create.status,
  bookingCode,
  bookingCodeLength: String(bookingCode).length,
  bookingCodeMaxOk: String(bookingCode).length <= 32,
  accessTokenPresent: Boolean(accessToken),
  lookupStatus: lookup.status,
  lookupOk: lookup.status >= 200 && lookup.status < 300,
  cancel1Status: cancel1.status,
  cancel2Status: cancel2.status,
  cancelIdempotent:
    cancel1.status >= 200 &&
    cancel1.status < 300 &&
    cancel2.status >= 200 &&
    cancel2.status < 300,
  statusAfter,
  cancelled:
    /cancel/i.test(String(statusAfter || "")) ||
    after.json?.booking?.cancelled === true,
  campCaesarHidden: !campInBranches,
  create: "DONE",
  enforce: "NOT_ACTIVATED",
};

result.verdict =
  result.lookupOk &&
  result.cancelIdempotent &&
  result.bookingCodeMaxOk &&
  result.campCaesarHidden &&
  result.accessTokenPresent
    ? "PASS"
    : "FAIL";

console.log(JSON.stringify(result, null, 2));
process.exit(result.verdict === "PASS" ? 0 : 4);
