const STORAGE_KEY = "cut-book-confirmation";

export type BookFlowConfirmation = {
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  branchName: string;
  branchCode?: string | null;
  barberName?: string | null;
  bookingCode?: string | null;
};

export function saveBookFlowConfirmation(data: BookFlowConfirmation) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readBookFlowConfirmation(): BookFlowConfirmation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookFlowConfirmation;
    if (!parsed?.date || !parsed?.time || !parsed?.branchName) return null;
    return {
      customerName: String(parsed.customerName || "").trim(),
      date: String(parsed.date),
      time: String(parsed.time),
      branchName: String(parsed.branchName),
      branchCode: parsed.branchCode ? String(parsed.branchCode) : null,
      barberName: parsed.barberName ? String(parsed.barberName) : null,
      bookingCode: parsed.bookingCode ? String(parsed.bookingCode) : null,
    };
  } catch {
    return null;
  }
}

export function clearBookFlowConfirmation() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
