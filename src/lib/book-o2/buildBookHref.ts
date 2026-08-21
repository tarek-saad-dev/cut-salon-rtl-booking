/** Canonical /book intent URLs. */

export function buildBookHref(intent: {
  mode?: "nearest" | "barber" | "branch" | "intent";
  empId?: number | null;
  branch?: string | null;
  serviceIds?: number[];
}): string {
  const params = new URLSearchParams();
  const empId =
    intent.empId != null && Number.isFinite(intent.empId) && intent.empId > 0
      ? intent.empId
      : null;

  if (empId) {
    params.set("mode", "barber");
    params.set("empId", String(empId));
  } else if (intent.mode === "nearest") {
    params.set("mode", "nearest");
  } else if (intent.mode === "branch") {
    params.set("mode", "branch");
  } else if (intent.mode === "barber") {
    params.set("mode", "barber");
  }

  if (intent.branch) params.set("branch", intent.branch);
  if (intent.serviceIds?.length) {
    params.set("services", intent.serviceIds.join(","));
  }
  const q = params.toString();
  return q ? `/book?${q}` : "/book";
}
