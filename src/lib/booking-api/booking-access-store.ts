/**
 * Booking access token persistent storage.
 * Uses localStorage scoped by booking code.
 * XSS trade-off: tokens are accessible to any JS on the page.
 * This is acceptable because there is no httpOnly alternative for
 * a client-side SPA accessing a separate backend domain.
 */

import { normalizeBookingCode } from "./limits";

const KEY_PREFIX = "cut_bk_access:";
const INDEX_KEY = "cut_bk_access_index";

interface StoredBookingAccess {
  bookingCode: string;
  bookingAccessToken: string;
  savedAt: number;
  expiresAt: number | null;
}

function storageAvailable(): boolean {
  try {
    const t = "__storage_test__";
    localStorage.setItem(t, t);
    localStorage.removeItem(t);
    return true;
  } catch (e) {
    void e;
    return false;
  }
}

function normalizeCode(code: string): string {
  return normalizeBookingCode(code);
}

function getKey(code: string): string {
  return `${KEY_PREFIX}${normalizeCode(code)}`;
}

export function saveBookingAccess(params: {
  bookingCode: string;
  bookingAccessToken: string;
  expiresAt?: number | null;
}): void {
  if (!storageAvailable()) return;

  const code = normalizeCode(params.bookingCode);
  const entry: StoredBookingAccess = {
    bookingCode: code,
    bookingAccessToken: params.bookingAccessToken,
    savedAt: Date.now(),
    expiresAt: params.expiresAt ?? (Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  try {
    localStorage.setItem(getKey(code), JSON.stringify(entry));
    updateIndex(code);
  } catch (e) {
    void e;
    // Quota exceeded — silently fail
  }
}

export function getBookingAccess(code: string): StoredBookingAccess | null {
  if (!storageAvailable()) return null;

  try {
    const raw = localStorage.getItem(getKey(code));
    if (!raw) return null;
    const entry = JSON.parse(raw) as StoredBookingAccess;
    if (!entry.bookingAccessToken) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      removeBookingAccess(code);
      return null;
    }
    return entry;
  } catch (e) {
    void e;
    return null;
  }
}

export function removeBookingAccess(code: string): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(getKey(code));
    removeFromIndex(code);
  } catch (e) {
    void e;
  }
}

export function clearExpiredBookingAccess(): void {
  if (!storageAvailable()) return;

  try {
    const index = getIndex();
    const now = Date.now();
    for (const code of index) {
      const raw = localStorage.getItem(getKey(code));
      if (!raw) {
        removeFromIndex(code);
        continue;
      }
      try {
        const entry = JSON.parse(raw) as StoredBookingAccess;
        if (entry.expiresAt && now > entry.expiresAt) {
          localStorage.removeItem(getKey(code));
          removeFromIndex(code);
        }
      } catch {
        localStorage.removeItem(getKey(code));
        removeFromIndex(code);
      }
    }
  } catch (e) {
    void e;
  }
}

// ─── Index management ────────────────────────────────────────────────────────

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    void e;
    return [];
  }
}

function updateIndex(code: string): void {
  try {
    const index = getIndex();
    const normalized = normalizeCode(code);
    if (!index.includes(normalized)) {
      index.push(normalized);
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }
  } catch (e) {
    void e;
  }
}

function removeFromIndex(code: string): void {
  try {
    const index = getIndex();
    const normalized = normalizeCode(code);
    const filtered = index.filter((c) => c !== normalized);
    localStorage.setItem(INDEX_KEY, JSON.stringify(filtered));
  } catch (e) {
    void e;
  }
}

/** Only for testing */
export function _clearAllBookingAccess(): void {
  if (!storageAvailable()) return;
  try {
    const index = getIndex();
    for (const code of index) {
      localStorage.removeItem(getKey(code));
    }
    localStorage.removeItem(INDEX_KEY);
  } catch (e) {
    void e;
  }
}
