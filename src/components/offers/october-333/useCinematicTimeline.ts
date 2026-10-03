"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import {
  CinematicTimeline,
  type TimelineChapter,
  type TimelineEvents,
  type TimelineStatus,
} from "@/lib/offers/cinematicTimeline";

export interface CinematicTimelineHandle {
  index: number;
  status: TimelineStatus;
  /** Current chapter index, updated in the same frame as `progress`. */
  chapter: MotionValue<number>;
  /** Progress of the current chapter, 0..1. */
  progress: MotionValue<number>;
  start(): void;
  pause(): void;
  resume(): void;
  skip(): void;
  next(): void;
  previous(): void;
  settle(index: number, target?: number): void;
  current(): { index: number; status: TimelineStatus };
  /** Film time at the current position, in ms. */
  elapsedMs(): number;
}

/** React binding for the master timeline: one rAF loop, motion values for rendering. */
export function useCinematicTimeline(chapters: readonly TimelineChapter[], events: TimelineEvents): CinematicTimelineHandle {
  const chapter = useMotionValue(0);
  const progress = useMotionValue(0);
  const [snapshot, setSnapshot] = useState<{ index: number; status: TimelineStatus }>({ index: 0, status: "idle" });
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const wakeRef = useRef<() => void>(() => {});

  const timeline = useMemo(
    () =>
      new CinematicTimeline(chapters, {
        progress(value, index) {
          eventsRef.current.progress?.(value, index);
          progress.set(value);
        },
        chapter(index, previous, cause) {
          chapter.set(index);
          setSnapshot((s) => ({ ...s, index }));
          eventsRef.current.chapter?.(index, previous, cause);
        },
        status(status) {
          setSnapshot((s) => ({ ...s, status }));
          eventsRef.current.status?.(status);
        },
        cue(id, index) {
          eventsRef.current.cue?.(id, index);
        },
      }),
    [chapters, chapter, progress],
  );

  useEffect(() => {
    let frame = 0;
    const loop = (now: number) => {
      timeline.tick(now);
      if (timeline.active) {
        frame = requestAnimationFrame(loop);
      } else {
        frame = 0;
        timeline.resetClock();
      }
    };
    wakeRef.current = () => {
      if (!frame && timeline.active) frame = requestAnimationFrame(loop);
    };
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
  }, [timeline]);

  return useMemo(() => {
    const act =
      <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        fn(...args);
        wakeRef.current();
      };
    return {
      ...snapshot,
      chapter,
      progress,
      start: act(() => timeline.start()),
      pause: act(() => timeline.pause()),
      resume: act(() => timeline.resume()),
      skip: act(() => timeline.skip()),
      next: act(() => timeline.next()),
      previous: act(() => timeline.previous()),
      settle: act((index: number, target?: number) => timeline.settle(index, target)),
      current: () => ({ index: timeline.index, status: timeline.status }),
      elapsedMs: () => timeline.elapsedMs,
    };
  }, [snapshot, chapter, progress, timeline]);
}
