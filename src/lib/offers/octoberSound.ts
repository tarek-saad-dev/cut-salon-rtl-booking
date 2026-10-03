import {
  OCTOBER_SOUNDS,
  octoberMediaUrl,
  type OctoberSoundConfig,
  type OctoberSoundSlot,
} from "@/config/octoberOffer";
import { SYNTH_RECIPES, type SynthLayer, type Sweep } from "./octoberSynth";

export const OCTOBER_SOUND_STORAGE_KEY = "cut:october-experience:sound";
/** Slot volume at which the synthesized stand-ins play at their designed level. */
const SYNTH_REFERENCE_VOLUME = 0.5;
/** Short cues may overlap (a snip over a clipper tail); beyond this the oldest is released. */
export const MAX_ONE_SHOTS = 6;

export interface SoundManager {
  isEnabled(): boolean;
  subscribe(listener: () => void): () => void;
  /** Must be called from a user gesture handler. */
  unlock(): Promise<void>;
  setEnabled(enabled: boolean): void;
  play(slot: OctoberSoundSlot): void;
  prefetch(slots: readonly OctoberSoundSlot[]): void;
  /** The looping ambience currently playing, if any. */
  ambient(): OctoberSoundSlot | null;
  stopAmbient(): void;
  /** Stops scene effects only; the campaign music is controlled separately. */
  stopAll(): void;
  /** Routes a media element through a gain node (volume automation that also works on iOS). */
  connectMedia(element: HTMLMediaElement): MediaRoute | null;
  dispose(): void;
}

export interface MediaRoute {
  gain: AudioParam;
  now(): number;
}

export interface SoundManagerOptions {
  sounds?: Record<OctoberSoundSlot, OctoberSoundConfig>;
  resolveUrl?: (file: string) => string | undefined;
  createContext?: () => AudioContext | null;
  fetcher?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
}

type Voice = { stop: (fadeSeconds?: number) => void };

function defaultContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

function safeStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function createSoundManager(options: SoundManagerOptions = {}): SoundManager {
  const sounds = options.sounds ?? OCTOBER_SOUNDS;
  const resolveUrl = options.resolveUrl ?? octoberMediaUrl;
  const createContext = options.createContext ?? defaultContext;
  const fetcher = options.fetcher ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const storage = options.storage === undefined ? safeStorage() : options.storage;

  const listeners = new Set<() => void>();
  const buffers = new Map<OctoberSoundSlot, Promise<AudioBuffer | null>>();
  let enabled = false;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let shots: { voice: Voice; end: number }[] = [];
  let ambience: { slot: OctoberSoundSlot; voice: Voice } | null = null;
  let disposed = false;

  try {
    enabled = storage?.getItem(OCTOBER_SOUND_STORAGE_KEY) === "on";
  } catch {
    enabled = false;
  }

  const emit = () => listeners.forEach((listener) => listener());

  function ensureContext(): AudioContext | null {
    if (ctx || disposed) return ctx;
    try {
      ctx = createContext();
      if (ctx) {
        master = ctx.createGain();
        master.gain.value = 1;
        master.connect(ctx.destination);
      }
    } catch {
      ctx = null;
      master = null;
    }
    return ctx;
  }

  const ready = () => enabled && !!ctx && !!master && ctx.state === "running";

  function load(slot: OctoberSoundSlot): Promise<AudioBuffer | null> {
    const cached = buffers.get(slot);
    if (cached) return cached;
    const url = resolveUrl(sounds[slot].file);
    const audio = ctx;
    const pending =
      !url || !audio
        ? Promise.resolve(null)
        : fetcher(url)
            .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error("missing"))))
            .then((data) => audio.decodeAudioData(data))
            .catch(() => null);
    if (url && audio) buffers.set(slot, pending);
    return pending;
  }

  function sweep(param: AudioParam, value: Sweep, start: number, end: number) {
    if (typeof value === "number") {
      param.setValueAtTime(value, start);
      return;
    }
    param.setValueAtTime(value[0], start);
    param.exponentialRampToValueAtTime(value[1], end);
  }

  function noiseSource(): AudioBufferSourceNode {
    const audio = ctx!;
    if (!noise) {
      noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = audio.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    return source;
  }

  /** Builds one layer; returns its source and the time it falls silent (Infinity when sustained). */
  function layer(spec: SynthLayer, out: GainNode, now: number, sustain: boolean) {
    const audio = ctx!;
    const start = now + (spec.at ?? 0);
    const end = start + spec.attack + (sustain ? 0 : spec.release);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    if (sustain) {
      gain.gain.linearRampToValueAtTime(spec.peak, start + spec.attack);
    } else {
      gain.gain.exponentialRampToValueAtTime(Math.max(spec.peak, 0.0002), start + spec.attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
    }

    let source: AudioScheduledSourceNode;
    let head: AudioNode;
    if (spec.kind === "noise") {
      source = noiseSource();
      const filter = audio.createBiquadFilter();
      filter.type = spec.filter;
      if (spec.q) filter.Q.value = spec.q;
      sweep(filter.frequency, spec.freq, start, end);
      source.connect(filter);
      head = filter;
    } else {
      const osc = audio.createOscillator();
      osc.type = spec.wave;
      sweep(osc.frequency, spec.freq, start, end);
      source = osc;
      head = osc;
      if (spec.filter) {
        const filter = audio.createBiquadFilter();
        filter.type = spec.filter.type;
        filter.frequency.value = spec.filter.freq;
        if (spec.filter.q) filter.Q.value = spec.filter.q;
        osc.connect(filter);
        head = filter;
      }
    }
    head.connect(gain).connect(out);
    source.start(start);
    if (!sustain) source.stop(end + 0.05);
    return { source, end: sustain ? Infinity : end };
  }

  /** Quiet synthesized stand-ins used until real assets are uploaded. */
  function synthesize(slot: OctoberSoundSlot): { voice: Voice; end: number } {
    const audio = ctx!;
    const recipe = SYNTH_RECIPES[slot];
    const sustain = !!recipe.sustain;
    const out = audio.createGain();
    out.gain.value = sounds[slot].volume / SYNTH_REFERENCE_VOLUME;
    out.connect(master!);
    const now = audio.currentTime;
    const built = recipe.layers.map((spec) => layer(spec, out, now, sustain));
    const end = Math.max(...built.map((b) => b.end));
    return {
      end,
      voice: {
        stop(fade = 0.08) {
          const t = ctx?.currentTime ?? 0;
          try {
            out.gain.cancelScheduledValues(t);
            out.gain.setTargetAtTime(0.0001, t, fade / 3);
            built.forEach((b) => b.source.stop(t + fade + 0.02));
          } catch {
            /* already stopped */
          }
        },
      },
    };
  }

  function playBuffer(buffer: AudioBuffer, config: OctoberSoundConfig): { voice: Voice; end: number } {
    const audio = ctx!;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.loop = !!config.loop;
    const out = audio.createGain();
    const t = audio.currentTime;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(config.volume, t + (config.loop ? 1.2 : 0.02));
    source.connect(out).connect(master!);
    source.start();
    return {
      end: config.loop ? Infinity : t + buffer.duration,
      voice: {
        stop(fade = 0.4) {
          const now = ctx?.currentTime ?? 0;
          try {
            out.gain.cancelScheduledValues(now);
            out.gain.setTargetAtTime(0.0001, now, fade / 3);
            source.stop(now + fade + 0.05);
          } catch {
            /* already stopped */
          }
        },
      },
    };
  }

  function addShot(shot: { voice: Voice; end: number }) {
    const now = ctx?.currentTime ?? 0;
    shots = shots.filter((s) => s.end > now);
    while (shots.length >= MAX_ONE_SHOTS) shots.shift()?.voice.stop(0.15);
    shots.push(shot);
  }

  function stopAmbient(fade = 1.4) {
    ambience?.voice.stop(fade);
    ambience = null;
  }

  function stopAll() {
    shots.forEach((s) => s.voice.stop());
    shots = [];
    stopAmbient(0.4);
  }

  const onVisibility = () => {
    if (!ctx) return;
    if (document.visibilityState === "hidden") void ctx.suspend().catch(() => {});
    else if (enabled) void ctx.resume().catch(() => {});
  };
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);

  return {
    isEnabled: () => enabled,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async unlock() {
      const audio = ensureContext();
      if (audio && audio.state === "suspended") {
        try {
          await audio.resume();
        } catch {
          /* audio stays unavailable; the experience works muted */
        }
      }
    },
    setEnabled(next) {
      if (enabled === next) return;
      enabled = next;
      try {
        storage?.setItem(OCTOBER_SOUND_STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* storage blocked */
      }
      if (!next) stopAll();
      emit();
    },
    play(slot) {
      if (!ready()) return;
      const config = sounds[slot];
      if (config.loop && ambience?.slot === slot) return;
      if (config.loop) {
        stopAmbient(1.2);
        ambience = { slot, voice: { stop: () => {} } };
      }
      const claim = ambience;
      void load(slot).then((buffer) => {
        if (!ready()) return;
        try {
          if (config.loop) {
            if (ambience !== claim) return;
            const built = buffer ? playBuffer(buffer, config) : synthesize(slot);
            ambience = { slot, voice: built.voice };
            return;
          }
          addShot(buffer ? playBuffer(buffer, config) : synthesize(slot));
        } catch {
          /* never let audio break the page */
        }
      });
    },
    prefetch(slots) {
      if (ctx) slots.forEach((slot) => void load(slot));
    },
    ambient: () => ambience?.slot ?? null,
    stopAmbient: () => stopAmbient(),
    stopAll,
    connectMedia(element) {
      const audio = ensureContext();
      if (!audio) return null;
      try {
        const source = audio.createMediaElementSource(element);
        const gain = audio.createGain();
        source.connect(gain).connect(audio.destination);
        return { gain: gain.gain, now: () => audio.currentTime };
      } catch {
        return null;
      }
    },
    dispose() {
      disposed = true;
      stopAll();
      listeners.clear();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
      void ctx?.close().catch(() => {});
      ctx = null;
      master = null;
    },
  };
}

let shared: SoundManager | null = null;

export function getOctoberSound(): SoundManager {
  shared ??= createSoundManager();
  return shared;
}

export function disposeOctoberSound() {
  shared?.dispose();
  shared = null;
}
