/**
 * Session capability cache for dedicated barber availability aggregate APIs.
 * Avoids probing + compat fan-out on every booking when endpoints are known.
 */

export type AggregateAvailabilityCapability = "unknown" | "supported" | "unsupported";

let daysCapability: AggregateAvailabilityCapability = "unknown";
let slotsCapability: AggregateAvailabilityCapability = "unknown";

export function getAggregateDaysCapability(): AggregateAvailabilityCapability {
  return daysCapability;
}

export function getAggregateSlotsCapability(): AggregateAvailabilityCapability {
  return slotsCapability;
}

export function markAggregateDaysSupported(): void {
  daysCapability = "supported";
}

export function markAggregateDaysUnsupported(): void {
  daysCapability = "unsupported";
}

export function markAggregateSlotsSupported(): void {
  slotsCapability = "supported";
}

export function markAggregateSlotsUnsupported(): void {
  slotsCapability = "unsupported";
}

/** Wire scope for backend contract (UI keeps "all_branches"). */
export function toWireAvailabilityScope(
  scope: "all_branches" | "specific_branch",
): "all_public" | "specific_branch" {
  return scope === "all_branches" ? "all_public" : "specific_branch";
}

export function __resetAggregateCapabilityForTests(): void {
  daysCapability = "unknown";
  slotsCapability = "unknown";
}
