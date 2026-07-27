/**
 * Central request timeout policies.
 */

export const TIMEOUT_MS = {
  discovery: 15_000,
  /** Live available-days often takes 10–20s; keep headroom for cold starts. */
  availableDays: 35_000,
  slots: 15_000,
  checkSlot: 15_000,
  plan: 15_000,
  create: 20_000,
  cancel: 20_000,
  lookup: 15_000,
  upcoming: 15_000,
} as const;

export type TimeoutCategory = keyof typeof TIMEOUT_MS;

export function getTimeoutMs(category: TimeoutCategory): number {
  return TIMEOUT_MS[category];
}
