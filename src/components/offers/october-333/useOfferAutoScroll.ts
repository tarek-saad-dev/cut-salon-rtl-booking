"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const OFFER_DRIFT = {
  delayMs: 1200,
  speedPxPerSec: 24,
} as const;

export type OfferDriftPhase = "idle" | "waiting" | "drifting" | "done";

const MAX_FRAME_MS = 50;
/** Any larger gap between where we left the page and where it is means someone else moved it. */
const POSITION_SLACK_PX = 3;
const DRAG_PX = 12;
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

interface OfferAutoScrollOptions {
  /** Document Y where the drift comes to rest, or null when the target is missing. */
  stopY: () => number | null;
  /** False while another scroll (the film landing on the offer) is still settling. */
  canMove: () => boolean;
  /** Document Y of the next block to bring into view when the hint is tapped. */
  nextY: () => number | null;
}

/**
 * One-shot discovery drift for the offer section: after a short pause the page creeps
 * downward until the branches come into view. Explicit input ends it for the rest of the visit.
 */
export function useOfferAutoScroll(options: OfferAutoScrollOptions) {
  const [phase, setPhase] = useState<OfferDriftPhase>("idle");
  const phaseRef = useRef<OfferDriftPhase>("idle");
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const teardownRef = useRef<() => void>(() => {});

  const setBoth = useCallback((next: OfferDriftPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const finish = useCallback(() => {
    teardownRef.current();
    teardownRef.current = () => {};
    if (phaseRef.current !== "idle") setBoth("done");
  }, [setBoth]);

  const arm = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    setBoth("waiting");

    let frame = 0;
    let settledSince: number | null = null;
    let last: number | null = null;
    let position = 0;
    let written = 0;
    let touch: { x: number; y: number } | null = null;
    let pointer: { x: number; y: number } | null = null;

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      const { canMove, stopY } = optionsRef.current;
      const y = window.scrollY;
      if (!canMove()) {
        settledSince = last = null;
        return;
      }
      settledSince ??= now;
      if (now - settledSince < OFFER_DRIFT.delayMs) return;
      if (phaseRef.current === "waiting") setBoth("drifting");
      if (last === null) {
        last = now;
        position = written = y;
        return;
      }
      if (Math.abs(y - written) > POSITION_SLACK_PX) return finish();
      const end = stopY();
      if (end === null || y >= end - 1) return finish();
      const dt = Math.min(now - last, MAX_FRAME_MS);
      last = now;
      position = Math.min(end, position + (OFFER_DRIFT.speedPxPerSec * dt) / 1000);
      const next = Math.round(position);
      if (next !== written) {
        written = next;
        window.scrollTo({ top: next, behavior: "instant" });
      }
    };

    const onWheel = () => finish();
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touch = t ? { x: t.clientX, y: t.clientY } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!touch || !t || Math.hypot(t.clientX - touch.x, t.clientY - touch.y) > 2) finish();
    };
    const onPointerDown = (e: PointerEvent) => {
      pointer = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointer && Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > DRAG_PX) finish();
    };
    const onPointerUp = () => (pointer = null);
    const onKey = (e: KeyboardEvent) => {
      if (!NAV_KEYS.has(e.key)) return;
      if (e.key === " " && (e.target as HTMLElement | null)?.closest?.("button, a, input, textarea")) return;
      finish();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("keydown", onKey);

    frame = requestAnimationFrame(step);

    teardownRef.current = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, setBoth]);

  /** Hint tap: the visitor takes over, so stop drifting and glide to the next block. */
  const nudge = useCallback(() => {
    finish();
    const y = optionsRef.current.nextY();
    if (y !== null) window.scrollTo({ top: y, behavior: "smooth" });
  }, [finish]);

  useEffect(() => () => teardownRef.current(), []);

  return { phase, arm, cancel: finish, nudge };
}
