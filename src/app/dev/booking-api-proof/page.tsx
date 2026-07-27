"use client";

import { useState, useCallback } from "react";

/**
 * Development-only API connectivity proof page.
 * Disabled in production via runtime check.
 */

interface ProbeResult {
  step: string;
  status: "pending" | "running" | "pass" | "fail" | "skip";
  detail?: string;
  durationMs?: number;
}

const INITIAL_PROBES: ProbeResult[] = [
  { step: "1. GET /api/public/branches", status: "pending" },
  { step: "2. GET /api/public/booking/config", status: "pending" },
  { step: "3. GET /api/public/booking/services", status: "pending" },
  { step: "4. GET /api/public/booking/barbers", status: "pending" },
  { step: "5. GET /api/public/booking/available-days", status: "pending" },
  { step: "6. GET /api/public/booking/available-slots", status: "pending" },
  { step: "7. POST /api/public/booking/check-slot", status: "pending" },
  { step: "8. POST /api/public/booking/plan", status: "pending" },
  { step: "9. Verify planToken present", status: "pending" },
  { step: "10. Create (skipped — no safe smoke)", status: "pending" },
  { step: "11. Idempotent replay (skipped)", status: "pending" },
  { step: "12. Lookup (skipped)", status: "pending" },
  { step: "13. POST /api/public/booking/upcoming", status: "pending" },
  { step: "14. Cancel (skipped)", status: "pending" },
  { step: "15. Headers / CORS check", status: "pending" },
];

export default function BookingApiProofPage() {
  const [probes, setProbes] = useState<ProbeResult[]>(INITIAL_PROBES);
  const [running, setRunning] = useState(false);

  const isProd = process.env.NODE_ENV === "production";

  const update = (idx: number, patch: Partial<ProbeResult>) => {
    setProbes((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    );
  };

  const runProbes = useCallback(async () => {
    if (isProd) return;
    setRunning(true);
    setProbes(INITIAL_PROBES.map((p) => ({ ...p, status: "pending" })));

    const baseUrl = process.env.NEXT_PUBLIC_CASHER_API_BASE_URL ?? "";
    if (!baseUrl) {
      update(0, { status: "fail", detail: "NEXT_PUBLIC_CASHER_API_BASE_URL not set" });
      setRunning(false);
      return;
    }

    const base = baseUrl.replace(/\/+$/, "");

    async function probe(
      idx: number,
      url: string,
      init?: RequestInit
    ): Promise<Response | null> {
      update(idx, { status: "running" });
      const t0 = performance.now();
      try {
        const res = await fetch(url, {
          credentials: "omit",
          cache: "no-store",
          ...init,
        });
        const dt = Math.round(performance.now() - t0);
        const ok = res.ok;
        const contractVersion = res.headers.get("x-booking-contract-version") ?? "—";
        const requestId = res.headers.get("x-request-id") ?? "—";
        update(idx, {
          status: ok ? "pass" : "fail",
          detail: `${res.status} | contract=${contractVersion} | reqId=${requestId}`,
          durationMs: dt,
        });
        return ok ? res : null;
      } catch (err) {
        const dt = Math.round(performance.now() - t0);
        update(idx, {
          status: "fail",
          detail: err instanceof Error ? err.message : "Unknown error",
          durationMs: dt,
        });
        return null;
      }
    }

    // 1. Branches
    const branchRes = await probe(0, `${base}/api/public/branches`);
    let branchCode = "";
    if (branchRes) {
      try {
        const data = await branchRes.json();
        branchCode = data.branches?.[0]?.branchCode ?? "";
        update(0, {
          status: "pass",
          detail: `${probes[0].detail} | branches=${data.branches?.length ?? 0} | first=${branchCode}`,
        });
      } catch (e) {
        void e;
      }
    }
    if (!branchCode) {
      for (let i = 1; i < INITIAL_PROBES.length; i++) {
        update(i, { status: "skip", detail: "No branch available" });
      }
      setRunning(false);
      return;
    }

    // 2. Config
    await probe(1, `${base}/api/public/booking/config?branchCode=${branchCode}`);

    // 3. Services
    const svcRes = await probe(2, `${base}/api/public/booking/services?branchCode=${branchCode}`);
    let serviceIds: number[] = [];
    if (svcRes) {
      try {
        const data = await svcRes.json();
        serviceIds = (data.services ?? [])
          .filter((s: { isBookableOnline: boolean }) => s.isBookableOnline)
          .slice(0, 1)
          .map((s: { id: number }) => s.id);
      } catch (e) {
        void e;
      }
    }

    // 4. Barbers
    const barberRes = await probe(3, `${base}/api/public/booking/barbers?branchCode=${branchCode}`);
    let empId: number | undefined;
    if (barberRes) {
      try {
        const data = await barberRes.json();
        empId = data.barbers?.[0]?.id;
      } catch (e) {
        void e;
      }
    }

    // 5. Available days
    if (serviceIds.length > 0) {
      const dayParams = new URLSearchParams({
        branchCode,
        serviceIds: serviceIds.join(","),
        mode: "specific",
        ...(empId ? { empId: String(empId) } : {}),
      });
      const dayRes = await probe(4, `${base}/api/public/booking/available-days?${dayParams}`);
      let availDate = "";
      if (dayRes) {
        try {
          const data = await dayRes.json();
          availDate = data.days?.find((d: { available: boolean }) => d.available)?.date ?? "";
        } catch (e) {
          void e;
        }
      }

      // 6. Available slots
      if (availDate) {
        const slotParams = new URLSearchParams({
          branchCode,
          date: availDate,
          serviceIds: serviceIds.join(","),
          mode: "specific",
          ...(empId ? { empId: String(empId) } : {}),
        });
        const slotRes = await probe(5, `${base}/api/public/booking/available-slots?${slotParams}`);
        let slotTime = "";
        let slotDayOffset = 0;
        if (slotRes) {
          try {
            const data = await slotRes.json();
            const slot = data.slots?.find((s: { available: boolean }) => s.available);
            slotTime = slot?.time ?? "";
            slotDayOffset = slot?.dayOffset ?? 0;
          } catch (e) {
            void e;
          }
        }

        // 7. Check slot
        if (slotTime) {
          await probe(6, `${base}/api/public/booking/check-slot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              branchCode,
              date: availDate,
              time: slotTime,
              serviceIds,
              mode: "specific",
              empId,
              dayOffset: slotDayOffset,
            }),
          });

          // 8. Plan
          const planRes = await probe(7, `${base}/api/public/booking/plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              branchCode,
              customer: { name: "API Probe", phone: "00000000000" },
              serviceIds,
              date: availDate,
              time: slotTime,
              dayOffset: slotDayOffset,
              mode: "specific",
              empId,
            }),
          });

          // 9. Verify planToken
          if (planRes) {
            try {
              const data = await planRes.json();
              const hasToken = !!data.planToken;
              update(8, {
                status: hasToken ? "pass" : "skip",
                detail: hasToken ? "planToken present" : "planToken not in response (backend may not support yet)",
              });
            } catch {
              update(8, { status: "fail", detail: "Failed to parse plan response" });
            }
          } else {
            update(8, { status: "skip", detail: "Plan failed" });
          }
        } else {
          for (const i of [6, 7, 8]) {
            update(i, { status: "skip", detail: "No available slot" });
          }
        }
      } else {
        for (const i of [5, 6, 7, 8]) {
          update(i, { status: "skip", detail: "No available date" });
        }
      }
    } else {
      for (const i of [4, 5, 6, 7, 8]) {
        update(i, { status: "skip", detail: "No bookable services" });
      }
    }

    // 10-12. Mutation steps — skipped
    update(9, { status: "skip", detail: "Mutation proof deferred to Phase 8D" });
    update(10, { status: "skip", detail: "Requires create first" });
    update(11, { status: "skip", detail: "Requires create first" });

    // 13. Upcoming
    await probe(12, `${base}/api/public/booking/upcoming`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "00000000000" }),
    });

    // 14. Cancel — skipped
    update(13, { status: "skip", detail: "Requires active booking" });

    // 15. Headers / CORS
    update(14, { status: "running" });
    try {
      const res = await fetch(`${base}/api/public/branches`, {
        credentials: "omit",
        cache: "no-store",
      });
      const hdrs = [
        "x-booking-contract-version",
        "x-request-id",
        "retry-after",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
      ];
      const visible: string[] = [];
      const hidden: string[] = [];
      for (const h of hdrs) {
        if (res.headers.get(h) !== null) {
          visible.push(h);
        } else {
          hidden.push(h);
        }
      }
      update(14, {
        status: hidden.length > 0 ? "fail" : "pass",
        detail: `Visible: ${visible.join(", ") || "none"} | Hidden/Missing: ${hidden.join(", ") || "none"}`,
      });
    } catch (err) {
      update(14, {
        status: "fail",
        detail: err instanceof Error ? err.message : "CORS/Network failure",
      });
    }

    setRunning(false);
  }, [isProd, probes]);

  if (isProd) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>This page is only available in development mode.</p>
      </div>
    );
  }

  const statusIcon: Record<string, string> = {
    pending: "⏳",
    running: "🔄",
    pass: "✅",
    fail: "❌",
    skip: "⏭️",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8" dir="ltr">
      <h1 className="text-2xl font-bold mb-2">Booking API Integration Proof</h1>
      <p className="text-sm text-gray-500 mb-6">
        Phase 8A — Live connectivity probe against{" "}
        <code className="text-blue-400">
          {process.env.NEXT_PUBLIC_CASHER_API_BASE_URL ?? "NOT SET"}
        </code>
      </p>

      <button
        onClick={runProbes}
        disabled={running}
        className="mb-6 px-6 py-2 bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-500 transition"
      >
        {running ? "Running..." : "Run Probes"}
      </button>

      <div className="space-y-2 max-w-3xl">
        {probes.map((p, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              p.status === "pass"
                ? "border-green-800 bg-green-950/30"
                : p.status === "fail"
                ? "border-red-800 bg-red-950/30"
                : p.status === "skip"
                ? "border-gray-800 bg-gray-900/30"
                : "border-gray-800 bg-gray-900/50"
            }`}
          >
            <span className="text-lg flex-shrink-0">{statusIcon[p.status]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{p.step}</p>
              {p.detail && (
                <p className="text-xs text-gray-400 mt-0.5 break-all">{p.detail}</p>
              )}
            </div>
            {p.durationMs != null && (
              <span className="text-xs text-gray-500 flex-shrink-0">{p.durationMs}ms</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg bg-yellow-950/30 border border-yellow-800 max-w-3xl">
        <p className="text-sm text-yellow-300 font-medium">
          Mutation steps (10-12, 14) are skipped.
        </p>
        <p className="text-xs text-yellow-500 mt-1">
          Create/cancel proof against live backend will occur in Phase 8D with controlled
          smoke data. Do not create real customer bookings from this probe.
        </p>
      </div>
    </div>
  );
}
