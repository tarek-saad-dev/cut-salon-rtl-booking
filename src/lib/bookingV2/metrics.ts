export type JourneyMark =
  | "book_now_click"
  | "modal_visible"
  | "bootstrap_ready"
  | "barber_selected"
  | "slots_visible"
  | "service_change"
  | "date_change"
  | "branch_change"
  | "confirm_click";

type JourneyState = {
  id: string;
  startedAt: number;
  marks: Partial<Record<JourneyMark, number>>;
  requestCount: number;
  zeroNetwork: {
    serviceChange: number;
    dateChange: number;
    loadedBranchChange: number;
  };
};

let active: JourneyState | null = null;

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function startBookingJourney(reason: string = "book_now"): string {
  const id = `bj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  active = {
    id,
    startedAt: now(),
    marks: { book_now_click: now() },
    requestCount: 0,
    zeroNetwork: { serviceChange: 0, dateChange: 0, loadedBranchChange: 0 },
  };
  log("start", { id, reason });
  return id;
}

export function markJourney(mark: JourneyMark): void {
  if (!active) return;
  if (active.marks[mark] == null) active.marks[mark] = now();
  const click = active.marks.book_now_click ?? active.startedAt;
  const delta = Math.round((active.marks[mark] ?? now()) - click);
  log("mark", { mark, msFromClick: delta, requestCount: active.requestCount });
}

export function trackBookingRequest(kind: "bootstrap" | "availability" | "other" = "other"): void {
  if (!active) return;
  active.requestCount += 1;
  log("request", { kind, requestCount: active.requestCount });
}

/** Distinguish cutover failures without logging customer/secrets payloads. */
export function trackBookingError(
  stage:
    | "bootstrap_failure"
    | "availability_failure"
    | "plan_failure"
    | "create_conflict"
    | "create_server_error"
    | "create_failure",
  detail?: { code?: string; httpStatus?: number; message?: string },
): void {
  const safe = {
    stage,
    code: detail?.code,
    httpStatus: detail?.httpStatus,
    message: detail?.message ? String(detail.message).slice(0, 160) : undefined,
  };
  if (typeof console !== "undefined") {
    console.error(`[booking-v2-error] ${stage}`, safe);
  }
  log("error", safe);
}

export function trackZeroNetwork(kind: "serviceChange" | "dateChange" | "loadedBranchChange"): void {
  if (!active) return;
  active.zeroNetwork[kind] += 1;
  log("zero-network", { kind, count: active.zeroNetwork[kind] });
}

export function getJourneySnapshot() {
  if (!active) return null;
  const click = active.marks.book_now_click ?? active.startedAt;
  const delta = (mark?: number) => (mark == null ? null : Math.round(mark - click));
  return {
    id: active.id,
    requestCount: active.requestCount,
    zeroNetwork: { ...active.zeroNetwork },
    timingsMs: {
      clickToModalVisible: delta(active.marks.modal_visible),
      modalToBootstrapReady: (() => {
        const a = active.marks.modal_visible;
        const b = active.marks.bootstrap_ready;
        if (a == null || b == null) return null;
        return Math.round(b - a);
      })(),
      barberToSlotsVisible: (() => {
        const a = active.marks.barber_selected;
        const b = active.marks.slots_visible;
        if (a == null || b == null) return null;
        return Math.round(b - a);
      })(),
      clickToConfirm: delta(active.marks.confirm_click),
    },
  };
}

export function endBookingJourney(): void {
  if (!active) return;
  log("end", getJourneySnapshot());
  active = null;
}

function log(event: string, payload: unknown): void {
  if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
    // Always emit structured metrics for C1 verification (cheap).
    console.info(`[booking-v2-metrics] ${event}`, payload);
  }
}
