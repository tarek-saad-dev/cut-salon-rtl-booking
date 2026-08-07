export type BookingMgmtSurface = "dark" | "brand";

/** Shared class tokens for booking-management UI (dark drawer vs brand /booking page). */
export const bookingMgmtSurface = {
  dark: {
    label: "text-cut-ivory/50",
    hint: "text-cut-ivory/30",
    input:
      "rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-cut-ivory outline-none placeholder:text-cut-ivory/35 focus:border-cut-gold/40",
    primaryBtn:
      "rounded-xl bg-cut-gold px-4 py-3 text-sm font-bold text-black transition hover:brightness-105 disabled:opacity-50",
    secondaryText: "text-cut-ivory/60",
    mutedText: "text-cut-ivory/40",
    errorBox:
      "rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300",
    errorMeta: "text-cut-ivory/30",
    skeleton: "rounded-xl border border-white/5 bg-[#0f0f0f] overflow-hidden animate-pulse",
    skeletonBar: "bg-white/5",
    card: {
      primary:
        "rounded-xl overflow-hidden border border-cut-gold/30 bg-gradient-to-b from-cut-gold/[0.07] to-[#0f0f0f] shadow-[0_0_24px_rgba(164,136,121,0.08)]",
      secondary: "rounded-xl overflow-hidden border border-cut-gold/15 bg-[#0f0f0f]",
      head: "flex items-center justify-between gap-2 border-b border-cut-gold/10 bg-cut-gold/5 px-4 py-2",
      headTitle: "text-xs font-bold text-cut-gold",
      code: "font-mono text-sm tracking-wide text-cut-ivory/90",
      copy: "inline-flex items-center gap-1 text-[11px] text-cut-ivory/50 hover:text-cut-gold",
      branch: "text-xs text-cut-ivory/50",
      meta: "text-sm text-cut-ivory/80",
      icon: "text-cut-gold",
      detail: "text-xs text-cut-ivory/60",
      price: "text-xs font-bold text-cut-gold",
      duration: "text-xs text-cut-ivory/40",
      overnight: "text-[11px] text-cut-gold/80",
      cancelOff: "text-center text-[11px] text-cut-ivory/30",
      cancelBlocked: "text-center text-[11px] text-cut-ivory/20",
    },
    listTitle: "text-xs font-bold text-cut-ivory/70",
    listCount:
      "rounded-full border border-cut-gold/20 bg-cut-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-cut-gold",
    chevron: "text-cut-ivory/30",
    compactLink:
      "flex items-center justify-between gap-3 rounded-xl border border-cut-gold/20 bg-cut-gold/[0.06] px-4 py-3 text-sm text-cut-ivory/80 transition-colors hover:border-cut-gold/40",
    compactIcon: "text-cut-gold",
  },
  brand: {
    label: "text-cut-black/55",
    hint: "text-cut-black/40",
    input:
      "rounded-xl border border-cut-black/15 bg-cut-ivory px-3 py-2.5 text-sm text-cut-black outline-none placeholder:text-cut-black/35 focus:border-cut-burgundy focus:ring-2 focus:ring-cut-burgundy/15",
    primaryBtn:
      "rounded-xl bg-cut-burgundy px-4 py-3 text-sm font-bold text-cut-ivory transition hover:bg-cut-burgundy-dark disabled:opacity-50",
    secondaryText: "text-cut-black/65",
    mutedText: "text-cut-black/45",
    errorBox:
      "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-800",
    errorMeta: "text-cut-black/40",
    skeleton:
      "overflow-hidden rounded-2xl border border-cut-burgundy/10 bg-cut-ivory animate-pulse shadow-[0_8px_30px_rgba(74,0,15,0.06)]",
    skeletonBar: "bg-cut-burgundy/10",
    card: {
      primary:
        "overflow-hidden rounded-2xl border border-cut-burgundy/20 bg-gradient-to-b from-cut-ivory to-cut-warm-paper/80 shadow-[0_12px_40px_rgba(74,0,15,0.1)] ring-1 ring-cut-burgundy/5",
      secondary:
        "overflow-hidden rounded-2xl border border-cut-black/10 bg-cut-ivory shadow-[0_8px_28px_rgba(74,0,15,0.06)]",
      head: "flex items-center justify-between gap-2 border-b border-cut-burgundy/10 bg-cut-burgundy/[0.06] px-4 py-2.5",
      headTitle: "text-xs font-bold text-cut-burgundy",
      code: "font-mono text-sm tracking-wide text-cut-black",
      copy: "inline-flex items-center gap-1 text-[11px] text-cut-black/45 hover:text-cut-burgundy",
      branch: "text-xs text-cut-black/50",
      meta: "text-sm text-cut-black/80",
      icon: "text-cut-burgundy",
      detail: "text-xs text-cut-black/55",
      price: "text-xs font-bold text-cut-burgundy",
      duration: "text-xs text-cut-black/40",
      overnight: "text-[11px] text-cut-burgundy/80",
      cancelOff: "text-center text-[11px] text-cut-black/40",
      cancelBlocked: "text-center text-[11px] text-cut-black/35",
    },
    listTitle: "text-xs font-bold text-cut-black/70",
    listCount:
      "rounded-full border border-cut-burgundy/20 bg-cut-burgundy/10 px-1.5 py-0.5 text-[10px] font-bold text-cut-burgundy",
    chevron: "text-cut-black/35",
    compactLink:
      "flex items-center justify-between gap-3 rounded-xl border border-cut-burgundy/20 bg-cut-burgundy/[0.06] px-4 py-3 text-sm text-cut-black/80 transition-colors hover:border-cut-burgundy/40",
    compactIcon: "text-cut-burgundy",
  },
} as const;
