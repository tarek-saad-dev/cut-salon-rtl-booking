export type TimelineStatus = "idle" | "playing" | "paused" | "ended";
export type ChapterChangeCause = "start" | "auto" | "manual" | "skip";

export interface TimelineCue {
  /** Chapter progress (0..1) at which the cue fires. */
  at: number;
  id: string;
}

export interface TimelineChapter {
  id: string;
  /** Milliseconds. The last chapter is a terminal resting state and is never timed. */
  duration: number;
  /** Progress a chapter animates to when reached by manual navigation. */
  settleAt?: number;
  cues?: readonly TimelineCue[];
}

export interface TimelineEvents {
  progress?(progress: number, index: number): void;
  chapter?(index: number, previous: number, cause: ChapterChangeCause): void;
  status?(status: TimelineStatus): void;
  cue?(id: string, index: number): void;
}

/** Duration of a full 0→1 progress sweep while settling after manual navigation. */
export const SETTLE_MS = 1400;
const MAX_FRAME_MS = 100;

/**
 * Deterministic master clock for the cinematic experience.
 * Owns the current chapter, its progress and the play state; time only
 * advances through `tick`, so tests can drive it without real frames.
 */
export class CinematicTimeline {
  index = 0;
  progress = 0;
  status: TimelineStatus = "idle";
  private settleTarget: number | null = null;
  private last: number | null = null;

  constructor(
    readonly chapters: readonly TimelineChapter[],
    private readonly events: TimelineEvents = {},
  ) {}

  get lastIndex() {
    return this.chapters.length - 1;
  }

  get chapter() {
    return this.chapters[this.index];
  }

  /** True while frames are needed (playing or settling). */
  get active() {
    return this.status === "playing" || this.settleTarget !== null;
  }

  start() {
    this.settleTarget = null;
    this.last = null;
    this.enter(0, 0, "start");
    this.setStatus("playing");
  }

  /** Continues from the current chapter and progress. */
  resume() {
    if (this.index >= this.lastIndex) return this.start();
    this.settleTarget = null;
    this.last = null;
    this.setStatus("playing");
  }

  pause() {
    this.last = null;
    if (this.status === "playing") this.setStatus("paused");
  }

  next() {
    if (this.index < this.lastIndex) this.settle(this.index + 1);
  }

  previous() {
    if (this.index > 0) this.settle(this.index - 1);
  }

  skip() {
    this.settleTarget = null;
    this.last = null;
    if (this.index !== this.lastIndex) this.enter(this.lastIndex, 0, "skip");
    this.setStatus("ended");
  }

  /** Manual navigation: jump to a chapter and animate it to its resting state. */
  settle(index: number, target?: number) {
    const clamped = Math.max(0, Math.min(this.lastIndex, index));
    if (this.status === "playing") this.setStatus("paused");
    if (this.status === "ended" && clamped < this.lastIndex) this.setStatus("paused");
    this.last = null;

    if (clamped === this.lastIndex) {
      this.settleTarget = null;
      if (clamped !== this.index) this.enter(clamped, 0, "manual");
      return;
    }

    const goal = target ?? this.chapters[clamped].settleAt ?? 1;
    if (clamped !== this.index) {
      // Moving backwards has no previous scene underneath, so skip the entry transition.
      this.enter(clamped, clamped < this.index ? Math.min(goal, 0.22) : 0, "manual");
    }
    this.settleTarget = goal > this.progress ? goal : null;
  }

  tick(now: number) {
    const dt = this.last === null ? 0 : Math.min(now - this.last, MAX_FRAME_MS);
    this.last = now;
    if (dt <= 0) return;

    if (this.status === "playing") {
      this.advance(dt / this.chapter.duration);
    } else if (this.settleTarget !== null) {
      const goal = this.settleTarget;
      const next = Math.min(goal, this.progress + dt / SETTLE_MS);
      if (next >= goal) this.settleTarget = null;
      this.setProgress(next);
    }
  }

  /** Forget the frame clock (e.g. when the frame loop stops). */
  resetClock() {
    this.last = null;
  }

  private advance(delta: number) {
    const next = this.progress + delta;
    if (next < 1) {
      this.setProgress(next);
      return;
    }
    this.setProgress(1);
    if (this.index + 1 >= this.lastIndex) {
      this.enter(this.lastIndex, 0, "auto");
      this.setStatus("ended");
    } else {
      this.enter(this.index + 1, 0, "auto");
    }
  }

  private setProgress(value: number) {
    const previous = this.progress;
    this.progress = value;
    for (const cue of this.chapter.cues ?? []) {
      if (cue.at > previous && cue.at <= value) this.events.cue?.(cue.id, this.index);
    }
    this.events.progress?.(value, this.index);
  }

  private enter(index: number, progress: number, cause: ChapterChangeCause) {
    const previous = this.index;
    this.index = index;
    this.progress = progress;
    this.events.chapter?.(index, previous, cause);
    this.events.progress?.(progress, index);
  }

  private setStatus(status: TimelineStatus) {
    if (status === this.status) return;
    this.status = status;
    this.events.status?.(status);
  }
}
