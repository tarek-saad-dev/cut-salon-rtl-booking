import { OCTOBER_MUSIC } from "@/config/octoberOffer";
import type { MediaRoute } from "./octoberSound";

/** Playback within this distance of the film position is left alone to avoid audible jumps. */
export const MUSIC_DRIFT_TOLERANCE_MS = 350;
const FADE_IN_MS = 250;
const FADE_STEP_MS = 40;
const DUCK_IN_MS = 90;
const DUCK_OUT_MS = 700;

export interface MusicController {
  /**
   * Starts or continues the track at film time `atMs`, at the film volume. Without `atMs` it resumes
   * where it is, at the current target volume. Call from a user gesture.
   */
  play(atMs?: number): void;
  /** Pauses and keeps the position. */
  pause(): void;
  /** Re-aligns with the film only when the drift is meaningful. */
  sync(atMs: number): void;
  /** Silences without pausing, so the track stays aligned with the film. */
  setMuted(muted: boolean): void;
  /** Moves the persistent target volume to `level` over `ms` and keeps playing there. */
  fadeTo(level: number, ms: number): void;
  /** Dips to `depth` × the target volume for `holdMs` so a hero effect reads, then breathes back. */
  duck(depth: number, holdMs: number): void;
  /** True while the track should be running (muted counts; paused does not). */
  isPlaying(): boolean;
  dispose(): void;
}

export interface MusicControllerOptions {
  src?: string;
  volume?: number;
  /** Track position (seconds) at film time 0. */
  startAt?: number;
  createAudio?: () => HTMLAudioElement;
  /** Optional Web Audio route; `audio.volume` is read-only on iOS, a gain node is not. */
  connect?: (element: HTMLAudioElement) => MediaRoute | null;
}

/** One persistent `<audio>` element for the campaign soundtrack; the master timeline drives it. */
export function createMusicController(options: MusicControllerOptions = {}): MusicController {
  const src = options.src ?? OCTOBER_MUSIC.src;
  const volume = options.volume ?? OCTOBER_MUSIC.volume;
  const startAt = options.startAt ?? OCTOBER_MUSIC.startAt;
  const createAudio = options.createAudio ?? (() => new Audio());

  let element: HTMLAudioElement | null = null;
  let route: MediaRoute | null | undefined;
  let playing = false;
  let muted = false;
  let disposed = false;
  let level = volume;
  let fadeStep = 0;
  let duckRelease = 0;

  function audio() {
    if (!element && !disposed) {
      element = createAudio();
      element.preload = "metadata";
      element.src = src;
    }
    return element;
  }

  function routeFor(el: HTMLAudioElement) {
    if (route === undefined) {
      try {
        route = options.connect?.(el) ?? null;
      } catch {
        route = null;
      }
    }
    return route;
  }

  function clearFade() {
    window.clearInterval(fadeStep);
    window.clearTimeout(duckRelease);
    fadeStep = 0;
    duckRelease = 0;
  }

  function setLevel(target: number, ms: number) {
    const el = element;
    if (!el) return;
    window.clearInterval(fadeStep);
    const r = route;
    if (r) {
      el.volume = 1;
      const t = r.now();
      r.gain.cancelScheduledValues(t);
      r.gain.setValueAtTime(r.gain.value, t);
      r.gain.linearRampToValueAtTime(target, t + ms / 1000);
      return;
    }
    if (ms <= 0) {
      el.volume = target;
      return;
    }
    const from = el.volume;
    const began = Date.now();
    fadeStep = window.setInterval(() => {
      const k = Math.min(1, (Date.now() - began) / ms);
      el.volume = from + (target - from) * k;
      if (k >= 1) window.clearInterval(fadeStep);
    }, FADE_STEP_MS);
  }

  function align(el: HTMLAudioElement, atMs: number) {
    const target = startAt + atMs / 1000;
    if (Math.abs(el.currentTime - target) * 1000 <= MUSIC_DRIFT_TOLERANCE_MS) return;
    try {
      el.currentTime = target;
    } catch {
      /* not seekable yet; the next sync retries */
    }
  }

  return {
    play(atMs) {
      const el = audio();
      if (!el) return;
      routeFor(el);
      clearFade();
      const wasPaused = el.paused;
      playing = true;
      el.muted = muted;
      if (atMs !== undefined) {
        level = volume;
        align(el, atMs);
      }
      if (wasPaused) setLevel(0, 0);
      setLevel(level, FADE_IN_MS);
      try {
        void el.play()?.catch(() => {});
      } catch {
        /* playback unavailable; the film works silently */
      }
    },
    pause() {
      playing = false;
      clearFade();
      element?.pause();
    },
    sync(atMs) {
      if (playing && element) align(element, atMs);
    },
    setMuted(next) {
      muted = next;
      if (element) element.muted = next;
    },
    fadeTo(target, ms) {
      if (target === level) return;
      level = target;
      if (!playing || !element) return;
      clearFade();
      setLevel(target, ms);
    },
    duck(depth, holdMs) {
      if (!playing || !element) return;
      window.clearTimeout(duckRelease);
      setLevel(level * depth, DUCK_IN_MS);
      duckRelease = window.setTimeout(() => {
        if (playing) setLevel(level, DUCK_OUT_MS);
      }, DUCK_IN_MS + holdMs);
    },
    isPlaying: () => playing,
    dispose() {
      disposed = true;
      playing = false;
      clearFade();
      const el = element;
      element = null;
      if (!el) return;
      try {
        el.pause();
        el.removeAttribute("src");
        el.load();
      } catch {
        /* already released */
      }
    },
  };
}
