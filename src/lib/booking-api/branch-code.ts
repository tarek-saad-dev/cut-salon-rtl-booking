/** Canonical branch identity: uppercase trimmed code. Language-neutral. */
export function normalizeBranchCode(code: string | null | undefined): string {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

export function branchCodesEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeBranchCode(a);
  const right = normalizeBranchCode(b);
  return Boolean(left) && left === right;
}
