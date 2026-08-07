"use client";

import { useEffect, useState } from "react";
import { BookTimeWaiting } from "@/components/book/BookTimeWaiting";

type BookDelayedWaitingOverlayProps = {
  busy: boolean;
  /** Avoid flash on fast responses. Mutations can use a shorter delay. */
  delayMs?: number;
  lang?: "ar" | "en";
  tone?: "slots" | "confirm";
  label: string;
  /** `absolute` needs a positioned ancestor; `fixed` covers the viewport. */
  variant?: "absolute" | "fixed";
  className?: string;
};

/**
 * Blur freeze + CUT waiting animation, shown only after `delayMs` while `busy`.
 */
export function BookDelayedWaitingOverlay({
  busy,
  delayMs = 750,
  lang = "ar",
  tone = "slots",
  label,
  variant = "absolute",
  className = "",
}: BookDelayedWaitingOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), Math.max(0, delayMs));
    return () => window.clearTimeout(id);
  }, [busy, delayMs]);

  if (!visible) return null;

  return (
    <div
      className={`${
        variant === "fixed" ? "fixed" : "absolute"
      } inset-0 z-[55] flex items-center justify-center bg-cut-soft-ivory/60 px-4 backdrop-blur-md ${className}`}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={label}
    >
      <div className="w-full max-w-md rounded-3xl border border-cut-black/10 bg-cut-soft-ivory/95 px-2 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
        <BookTimeWaiting lang={lang} tone={tone} label={label} compact />
      </div>
    </div>
  );
}
