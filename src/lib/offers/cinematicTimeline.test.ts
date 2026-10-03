import { describe, expect, it, vi } from "vitest";
import { CinematicTimeline, SETTLE_MS, type TimelineChapter } from "./cinematicTimeline";

const chapters: TimelineChapter[] = [
  { id: "a", duration: 1000, settleAt: 1 },
  { id: "b", duration: 2000, settleAt: 0.5, cues: [{ at: 0.5, id: "hit" }] },
  { id: "end", duration: 0 },
];

function run(timeline: CinematicTimeline, ms: number, from = 0, step = 16) {
  let t = from;
  timeline.tick(t);
  while (t < from + ms) {
    t = Math.min(from + ms, t + step);
    timeline.tick(t);
  }
  return t;
}

describe("CinematicTimeline", () => {
  it("plays chapters by duration and ends on the terminal chapter", () => {
    const chapter = vi.fn();
    const status = vi.fn();
    const timeline = new CinematicTimeline(chapters, { chapter, status });
    timeline.start();
    expect(chapter).toHaveBeenLastCalledWith(0, 0, "start");
    expect(timeline.status).toBe("playing");

    run(timeline, 1000);
    expect(timeline.index).toBe(1);
    expect(chapter).toHaveBeenLastCalledWith(1, 0, "auto");

    run(timeline, 2000, 2000);
    expect(timeline.index).toBe(2);
    expect(timeline.status).toBe("ended");
    expect(status).toHaveBeenLastCalledWith("ended");
  });

  it("fires cues once when progress crosses them", () => {
    const cue = vi.fn();
    const timeline = new CinematicTimeline(chapters, { cue });
    timeline.start();
    run(timeline, 1000);
    run(timeline, 1100, 2000);
    expect(cue).toHaveBeenCalledTimes(1);
    expect(cue).toHaveBeenCalledWith("hit", 1);
  });

  it("freezes on pause and resumes from the same point", () => {
    const timeline = new CinematicTimeline(chapters);
    timeline.start();
    run(timeline, 500);
    timeline.pause();
    const frozen = timeline.progress;
    run(timeline, 5000, 1000);
    expect(timeline.progress).toBe(frozen);
    expect(timeline.status).toBe("paused");

    timeline.resume();
    run(timeline, 250, 7000);
    expect(timeline.index).toBe(0);
    expect(timeline.progress).toBeCloseTo(0.75, 1);
  });

  it("caps long frame gaps so a hidden tab cannot jump scenes", () => {
    const timeline = new CinematicTimeline(chapters);
    timeline.start();
    timeline.tick(0);
    timeline.tick(60_000);
    expect(timeline.index).toBe(0);
    expect(timeline.progress).toBeCloseTo(0.1);
  });

  it("skips straight to the terminal chapter", () => {
    const chapter = vi.fn();
    const timeline = new CinematicTimeline(chapters, { chapter });
    timeline.start();
    timeline.skip();
    expect(timeline.index).toBe(2);
    expect(timeline.status).toBe("ended");
    expect(chapter).toHaveBeenLastCalledWith(2, 0, "skip");
  });

  it("settles manually navigated chapters without autoplay", () => {
    const timeline = new CinematicTimeline(chapters);
    timeline.start();
    timeline.settle(1);
    expect(timeline.status).toBe("paused");
    expect(timeline.active).toBe(true);
    run(timeline, SETTLE_MS);
    expect(timeline.index).toBe(1);
    expect(timeline.progress).toBe(0.5);
    expect(timeline.active).toBe(false);
  });

  it("keeps an idle timeline idle while the visitor browses", () => {
    const timeline = new CinematicTimeline(chapters);
    timeline.settle(1);
    expect(timeline.status).toBe("idle");
    timeline.resume();
    expect(timeline.status).toBe("playing");
    expect(timeline.index).toBe(1);
  });

  it("returns to paused when scrolling back from the end", () => {
    const timeline = new CinematicTimeline(chapters);
    timeline.skip();
    timeline.settle(1);
    expect(timeline.status).toBe("paused");
  });
});
