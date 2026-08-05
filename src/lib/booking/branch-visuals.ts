/**
 * Frontend-only branch visual identity for multi-branch availability UI.
 * Colors communicate identity — never selection. Selection uses separate outline/check.
 * Do not place these colors in backend payloads.
 */

export type BranchVisualCode = "GLEEM" | "CAMP_CAESAR" | string;

export interface BranchVisualTokens {
  accent: string;
  softBackground: string;
  /** Short accessible label key hint — UI still uses i18n. */
  legendKey: "gleem" | "camp" | "neutral";
}

export const branchVisuals: Record<"GLEEM" | "CAMP_CAESAR", BranchVisualTokens> = {
  GLEEM: {
    accent: "#741D32",
    softBackground: "#F8E9ED",
    legendKey: "gleem",
  },
  CAMP_CAESAR: {
    accent: "#A97812",
    softBackground: "#FFF3D5",
    legendKey: "camp",
  },
};

const NEUTRAL: BranchVisualTokens = {
  accent: "#71717a",
  softBackground: "#f4f4f5",
  legendKey: "neutral",
};

export function getBranchVisual(branchCode?: string | null): BranchVisualTokens {
  const code = (branchCode ?? "").trim().toUpperCase();
  if (code === "GLEEM") return branchVisuals.GLEEM;
  if (code === "CAMP_CAESAR") return branchVisuals.CAMP_CAESAR;
  return NEUTRAL;
}

/** CSS custom properties for a branch identity surface. */
export function branchVisualStyle(
  branchCode?: string | null,
): Record<string, string> {
  const v = getBranchVisual(branchCode);
  return {
    "--branch-accent": v.accent,
    "--branch-soft-bg": v.softBackground,
  };
}

/** For day cells that belong to exactly one branch. */
export function singleBranchDayStyle(branchCode: string): Record<string, string> {
  return {
    ...branchVisualStyle(branchCode),
    backgroundColor: "var(--branch-soft-bg)",
  };
}
