const base = "https://casher-five.vercel.app";

async function get(path, originHeader) {
  const headers = {};
  if (originHeader) headers.Origin = originHeader;
  const res = await fetch(base + path, { headers, cache: "no-store" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return {
    status: res.status,
    headers: {
      contract: res.headers.get("x-booking-contract-version"),
      reqId: res.headers.get("x-request-id"),
      expose: res.headers.get("access-control-expose-headers"),
      acao: res.headers.get("access-control-allow-origin"),
    },
    json,
  };
}

function isDayOpen(d) {
  return d.available === true || d.isAvailable === true;
}
function isSlotOpen(s) {
  return s.available === true || s.isAvailable === true;
}

const origins = [
  "https://cutsaloon.com",
  "https://www.cutsaloon.com",
  "http://localhost:3000",
  undefined,
];

const branchProbes = [];
for (const o of origins) {
  const p = await get("/api/public/branches", o);
  branchProbes.push({
    origin: o ?? "(none)",
    status: p.status,
    count: (p.json?.branches || []).length,
    codes: (p.json?.branches || []).map((b) => b.branchCode),
    acao: p.headers.acao,
    expose: Boolean(p.headers.expose),
    contract: p.headers.contract,
  });
}
console.log("branchProbes", JSON.stringify(branchProbes, null, 2));

const chosenOrigin =
  origins.find((_, i) => branchProbes[i].count > 0) ?? "https://cutsaloon.com";
const branches = await get("/api/public/branches", chosenOrigin);
const list = (branches.json?.branches || []).filter(
  (b) => b.branchCode && b.branchCode.toUpperCase() !== "CAMP_CAESAR",
);
const branchCode = list[0]?.branchCode || "GLEEM"; // fallback for catalog when list empty in this runner
console.log(
  JSON.stringify(
    {
      chosenOrigin,
      branchCount: list.length,
      branchCode,
      headers: branches.headers,
      campHidden: !list.some((b) => /camp/i.test(b.branchCode || "")),
      note:
        list.length === 0
          ? "Public branches list empty in this runner; continuing catalog/plan with known public code GLEEM"
          : "ok",
    },
    null,
    2,
  ),
);

const cfg = await get(
  "/api/public/booking/config?branchCode=" + encodeURIComponent(branchCode),
  chosenOrigin,
);
const svc = await get(
  "/api/public/booking/services?branchCode=" + encodeURIComponent(branchCode),
  chosenOrigin,
);
const services = (
  svc.json?.services ||
  svc.json?.categories?.flatMap((c) => c.services) ||
  []
).filter((s) => s.isBookableOnline !== false);
const serviceId = services[0]?.id;
const bar = await get(
  "/api/public/booking/barbers?branchCode=" + encodeURIComponent(branchCode),
  chosenOrigin,
);
const barbers = (bar.json?.barbers || []).filter(
  (b) => b.isBookableOnline !== false,
);

async function tryPlan({ mode, empId }) {
  const qs = new URLSearchParams({
    branchCode,
    serviceIds: String(serviceId),
    mode,
  });
  if (mode === "specific" && empId != null) qs.set("empId", String(empId));
  const days = await get(`/api/public/booking/available-days?${qs}`, chosenOrigin);
  const dayList = days.json?.days || [];
  const day = dayList.find(isDayOpen)?.date;
  if (!day) {
    return {
      mode,
      empId,
      day: null,
      openDays: dayList.filter(isDayOpen).length,
      slots: 0,
      plan: null,
    };
  }

  const slotQs = new URLSearchParams({
    branchCode,
    date: day,
    serviceIds: String(serviceId),
    mode,
  });
  if (mode === "specific" && empId != null) slotQs.set("empId", String(empId));
  const slotsRes = await get(
    `/api/public/booking/available-slots?${slotQs}`,
    chosenOrigin,
  );
  const slots = slotsRes.json?.slots || [];
  const slot = slots.find(isSlotOpen);
  if (!slot) {
    return {
      mode,
      empId,
      day,
      slots: slots.length,
      overnight: slots.some((s) => s.dayOffset === 1),
      plan: null,
    };
  }

  const t0 = Date.now();
  const res = await fetch(base + "/api/public/booking/plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(chosenOrigin ? { Origin: chosenOrigin } : {}),
    },
    body: JSON.stringify({
      branchCode,
      customer: { name: "Phase8B1 Smoke", phone: "01000000000" },
      serviceIds: [serviceId],
      date: day,
      time: slot.time,
      dayOffset: slot.dayOffset ?? 0,
      mode,
      empId: mode === "specific" ? empId : undefined,
    }),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return {
    mode,
    empId,
    day,
    slots: slots.length,
    overnight: slots.some((s) => s.dayOffset === 1),
    plan: {
      status: res.status,
      ms: Date.now() - t0,
      hasToken: Boolean(json?.planToken),
      totalPrice: json?.totalPrice,
      totalDuration: json?.totalDurationMinutes,
      contract: res.headers.get("x-booking-contract-version"),
      reqId: res.headers.get("x-request-id"),
      createSkipped: true,
      error: json?.error?.code || json?.message || null,
    },
  };
}

let result = null;
if (serviceId) {
  result = await tryPlan({ mode: "nearest" });
  if (!result.plan?.hasToken) {
    for (const b of barbers.slice(0, 8)) {
      result = await tryPlan({ mode: "specific", empId: b.id });
      if (result.plan?.hasToken) break;
    }
  }
}

console.log(
  JSON.stringify(
    {
      configOk: cfg.status,
      services: services.length,
      serviceId,
      barberCount: barbers.length,
      result,
      createProof: "NOT RUN — no safe smoke create/cleanup",
      exposeHeadersPass: Boolean(branches.headers.expose),
      contract: branches.headers.contract,
    },
    null,
    2,
  ),
);
