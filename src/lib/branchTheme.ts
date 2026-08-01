/**
 * Visual accents so Camp Caesar vs Gleem/Saba Pasha read clearly in booking UI.
 * Both stay in the classic Cut yellow family (no teal/bronze muddiness).
 * GLEEM → classic #D4AF37 · CAMP → hotter amber gold.
 */

export type BranchAccentKey = "gleem" | "camp" | "default";

export interface BranchAccent {
  key: BranchAccentKey;
  /** Short Arabic label for legend / chip */
  labelAr: string;
  /** Solid color swatch (inline style / CSS color) */
  swatch: string;
  tabSelected: string;
  tabIdle: string;
  chip: string;
  chipText: string;
  slotSelected: string;
  slotIdle: string;
  icon: string;
  softBg: string;
  border: string;
  dot: string;
}

const GLEEM: BranchAccent = {
  key: "gleem",
  labelAr: "سابا باشا",
  swatch: "#D4AF37",
  tabSelected: "bg-[#D4AF37] text-black border-[#D4AF37]",
  tabIdle:
    "bg-[#D4AF37]/10 text-[#8A7018] border-[#D4AF37]/30 hover:border-[#D4AF37]/60",
  chip: "bg-[#D4AF37]/20 border-[#D4AF37]/50",
  chipText: "text-[#5C4A0A]",
  slotSelected:
    "border-[#D4AF37] bg-[#D4AF37]/15 shadow-sm shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]/35",
  slotIdle:
    "border-[#D4AF37]/25 bg-white hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/[0.06]",
  icon: "text-[#D4AF37]",
  softBg: "bg-[#D4AF37]/15",
  border: "border-[#D4AF37]/40",
  dot: "bg-[#D4AF37]",
};

const CAMP: BranchAccent = {
  key: "camp",
  labelAr: "كامب شيزار",
  swatch: "#E8A317",
  tabSelected: "bg-[#E8A317] text-black border-[#E8A317]",
  tabIdle:
    "bg-[#E8A317]/10 text-[#9A6A0A] border-[#E8A317]/35 hover:border-[#E8A317]/65",
  chip: "bg-[#E8A317]/20 border-[#E8A317]/55",
  chipText: "text-[#6B4A08]",
  slotSelected:
    "border-[#E8A317] bg-[#E8A317]/15 shadow-sm shadow-[#E8A317]/20 ring-1 ring-[#E8A317]/35",
  slotIdle:
    "border-[#E8A317]/30 bg-white hover:border-[#E8A317]/60 hover:bg-[#E8A317]/[0.07]",
  icon: "text-[#E8A317]",
  softBg: "bg-[#E8A317]/15",
  border: "border-[#E8A317]/45",
  dot: "bg-[#E8A317]",
};

const DEFAULT: BranchAccent = {
  key: "default",
  labelAr: "فرع",
  swatch: "#D4AF37",
  tabSelected: "bg-[#D4AF37] text-black border-[#D4AF37]",
  tabIdle:
    "bg-white text-cut-black/70 border-[#D4AF37]/25 hover:border-[#D4AF37]/50",
  chip: "bg-[#D4AF37]/15 border-[#D4AF37]/35",
  chipText: "text-[#5C4A0A]",
  slotSelected: "border-[#D4AF37] bg-[#D4AF37]/15 shadow-sm",
  slotIdle: "border-[#D4AF37]/20 bg-white hover:border-[#D4AF37]/45",
  icon: "text-[#D4AF37]",
  softBg: "bg-[#D4AF37]/10",
  border: "border-[#D4AF37]/30",
  dot: "bg-[#D4AF37]",
};

export function resolveBranchAccentKey(
  branchCode?: string | null,
  branchName?: string | null,
): BranchAccentKey {
  const code = (branchCode ?? "").trim().toUpperCase();
  const name = (branchName ?? "").trim();

  if (code === "CAMP_CAESAR" || /كامب|شيزار|camp\s*c/i.test(name)) {
    return "camp";
  }

  if (code === "GLEEM" || /سابا|جليم|gleem|saba/i.test(name)) {
    return "gleem";
  }

  return "default";
}

export function getBranchAccent(
  branchCode?: string | null,
  branchName?: string | null,
): BranchAccent {
  const key = resolveBranchAccentKey(branchCode, branchName);
  if (key === "camp") return CAMP;
  if (key === "gleem") return GLEEM;
  return DEFAULT;
}
