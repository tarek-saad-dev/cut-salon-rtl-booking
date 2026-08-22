const BRANCH_FALLBACK_LABELS: Record<string, { ar: string; en: string }> = {
  GLEEM: { ar: "جليم", en: "Gleem" },
  CAMP_CAESAR: { ar: "كامب شيزار", en: "Camp Caesar" },
};

/** Display name for booking hero when a branch is locked in the URL / session. */
export function resolveBookBranchHeroLabel(
  branchCode: string | null | undefined,
  branchName: string | null | undefined,
  lang: "ar" | "en",
): string | undefined {
  const code = branchCode?.trim();
  if (!code) return undefined;

  const name = branchName?.trim();
  if (name && name.toUpperCase() !== code.toUpperCase()) return name;

  const fallback = BRANCH_FALLBACK_LABELS[code.toUpperCase()];
  if (fallback) return fallback[lang];

  return name || code;
}
