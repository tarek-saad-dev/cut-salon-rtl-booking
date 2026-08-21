const STORAGE_KEY = "cut-book-draft";

export type BookFlowProfessional =
  | { kind: "nearest" }
  | {
      kind: "specific";
      id: number;
      name: string;
      image: string | null;
      role: string;
      serviceIds?: number[];
    };

export type BookFlowCustomer = {
  phone: string;
  name?: string | null;
  clientId?: number | null;
  found?: boolean;
};

export type BookFlowAppointment = {
  date: string;
  time: string;
  empId?: number | null;
  dayOffset?: number | null;
  branchCode?: string | null;
  branchName?: string | null;
  barberName?: string | null;
};

export type BookFlowDraft = {
  branchCode: string;
  visit: "individual" | "group";
  serviceIds: number[];
  professional?: BookFlowProfessional | null;
  customer?: BookFlowCustomer | null;
  appointment?: BookFlowAppointment | null;
  /** Promo / referral code from review step (UI; passed as booking note). */
  promoCode?: string | null;
  /** Barber-first multi-branch scope (mirrors BookingModal). */
  availabilityScope?: "all_branches" | "specific_branch" | null;
};

export function saveBookFlowDraft(draft: BookFlowDraft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readBookFlowDraft(): BookFlowDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookFlowDraft;
    if (!parsed?.branchCode || !Array.isArray(parsed.serviceIds)) return null;
    return {
      branchCode: String(parsed.branchCode),
      visit: parsed.visit === "group" ? "group" : "individual",
      serviceIds: parsed.serviceIds.map(Number).filter((id) => Number.isFinite(id) && id > 0),
      professional: normalizeProfessional(parsed.professional),
      customer: normalizeCustomer(parsed.customer),
      appointment: normalizeAppointment(parsed.appointment),
      promoCode: normalizePromoCode(parsed.promoCode),
      availabilityScope:
        parsed.availabilityScope === "all_branches" ||
        parsed.availabilityScope === "specific_branch"
          ? parsed.availabilityScope
          : null,
    };
  } catch {
    return null;
  }
}

function normalizeProfessional(value: BookFlowDraft["professional"]): BookFlowProfessional | null {
  if (!value || typeof value !== "object") return null;
  if (value.kind === "nearest") return { kind: "nearest" };
  if (value.kind === "specific" && Number.isFinite(value.id) && value.id > 0) {
    return {
      kind: "specific",
      id: Number(value.id),
      name: String(value.name || ""),
      image: value.image ?? null,
      role: String(value.role || ""),
      serviceIds: Array.isArray(value.serviceIds)
        ? value.serviceIds.map(Number).filter((id) => Number.isFinite(id))
        : undefined,
    };
  }
  return null;
}

function normalizeCustomer(value: BookFlowDraft["customer"]): BookFlowCustomer | null {
  if (!value || typeof value !== "object") return null;
  const phone = String(value.phone || "").replace(/\D/g, "");
  if (phone.length < 8) return null;
  return {
    phone,
    name: value.name ? String(value.name) : null,
    clientId: typeof value.clientId === "number" ? value.clientId : null,
    found: Boolean(value.found),
  };
}

function normalizeAppointment(value: BookFlowDraft["appointment"]): BookFlowAppointment | null {
  if (!value || typeof value !== "object") return null;
  const date = String(value.date || "");
  const time = String(value.time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) return null;
  return {
    date,
    time,
    empId: typeof value.empId === "number" ? value.empId : null,
    dayOffset: typeof value.dayOffset === "number" ? value.dayOffset : null,
    branchCode: value.branchCode ? String(value.branchCode) : null,
    branchName: value.branchName ? String(value.branchName) : null,
    barberName: value.barberName ? String(value.barberName) : null,
  };
}

function normalizePromoCode(value: BookFlowDraft["promoCode"]): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().slice(0, 40);
  return code || null;
}

export function clearBookFlowDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
