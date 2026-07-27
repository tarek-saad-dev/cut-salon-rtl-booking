/**
 * Idempotency key management for booking mutations.
 * Ensures stable keys across retries, re-renders, and double-clicks.
 */

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createClientRequestId(): string {
  return generateUUID();
}

// ─── In-flight Mutation Tracking ─────────────────────────────────────────────

interface MutationEntry {
  id: string;
  createdAt: number;
}

const activeMutations = new Map<string, MutationEntry>();

/**
 * Get or create a stable idempotency key for a given operation.
 * The operationKey should uniquely identify the logical operation,
 * e.g. "create:GLEEM:2024-01-01:10:00" or "cancel:BK-ABC123".
 */
export function getOrCreateMutationId(operationKey: string): string {
  const existing = activeMutations.get(operationKey);
  if (existing) return existing.id;

  const id = createClientRequestId();
  activeMutations.set(operationKey, { id, createdAt: Date.now() });
  return id;
}

/**
 * Mark a mutation as completed. Called after confirmed success.
 */
export function completeMutationId(operationKey: string): void {
  activeMutations.delete(operationKey);
}

/**
 * Abandon a mutation (e.g. user changed selection).
 * A new key will be generated on the next attempt.
 */
export function abandonMutationId(operationKey: string): void {
  activeMutations.delete(operationKey);
}

/**
 * Check if a mutation is currently in-flight for the given operation.
 */
export function hasPendingMutation(operationKey: string): boolean {
  return activeMutations.has(operationKey);
}

/**
 * Get the existing mutation ID without creating one.
 */
export function getPendingMutationId(operationKey: string): string | null {
  return activeMutations.get(operationKey)?.id ?? null;
}

/**
 * Build the operation key for a create mutation.
 */
export function buildCreateOperationKey(params: {
  branchCode: string;
  date: string;
  time: string;
  serviceIds: number[];
  mode: string;
  empId?: number;
  dayOffset?: number;
}): string {
  const sids = [...params.serviceIds].sort().join(",");
  const emp = params.empId ?? "any";
  const dayOffset = params.dayOffset ?? 0;
  return `create:${params.branchCode}:${params.date}:${params.time}:${sids}:${params.mode}:${emp}:${dayOffset}`;
}

/**
 * Build the operation key for a cancel mutation.
 */
export function buildCancelOperationKey(bookingCode: string): string {
  return `cancel:${bookingCode}`;
}

/** Only for testing */
export function _clearAllMutations(): void {
  activeMutations.clear();
}
