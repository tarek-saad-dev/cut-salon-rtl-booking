import {
  OCTOBER_SOUNDS,
  octoberMediaUrl,
  type OctoberSoundConfig,
  type OctoberSoundSlot,
} from "@/config/octoberOffer";

export const OCTOBER_SOUND_STORAGE_KEY = "cut:october-experience:sound";

export interface SoundManager {
  isEnabled(): boolean;
  subscribe(listener: () => void): () => void;
  /** Must be called from a user gesture handler. */
  unlock(): Promise<void>;
  setEnabled(enabled: boolean): void;
  play(slot: OctoberSoundSlot): void;
  prefetch(slots: readonly OctoberSoundSlot[]): void;
  stopAmbient(): void;
  stopAll(): void;
  dispose(): void;
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
  let shot: Voice | null = null;
  let ambient: { slot: OctoberSoundSlot; voice: Voice } | null = null;
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

  function envelope(gain: GainNode, peak: number, attack: number, release: number, at = 0) {
    const t = ctx!.currentTime + at;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    return t + attack + release;
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

  function voiceOf(nodes: AudioScheduledSourceNode[], out: GainNode, end: number): Voice {
    nodes.forEach((node) => {
      node.start();
      node.stop(end + 0.05);
    });
    return {
      stop(fade = 0.08) {
        const t = ctx?.currentTime ?? 0;
        try {
          out.gain.cancelScheduledValues(t);
          out.gain.setTargetAtTime(0.0001, t, fade / 3);
          nodes.forEach((node) => node.stop(t + fade + 0.02));
        } catch {
          /* already stopped */
        }
      },
    };
  }

  /** Quiet synthesized stand-ins used until real assets are uploaded. */
  function synthesize(slot: OctoberSoundSlot): Voice | null {
    const audio = ctx!;
    const out = audio.createGain();
    out.connect(master!);
    const now = audio.currentTime;

    if (slot === "reveal") {
      const sub = audio.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(92, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 1.4);
      const subGain = audio.createGain();
      const end = envelope(subGain, 0.9, 0.012, 1.6);
      sub.connect(subGain).connect(out);
      const click = noiseSource();
      const lowpass = audio.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 900;
      const clickGain = audio.createGain();
      envelope(clickGain, 0.35, 0.004, 0.14);
      click.connect(lowpass).connect(clickGain).connect(out);
      return voiceOf([sub, click], out, end);
    }

    if (slot === "intro") {
      const low = audio.createOscillator();
      const fifth = audio.createOscillator();
      low.type = "sine";
      fifth.type = "sine";
      low.frequency.value = 55;
      fifth.frequency.value = 82.4;
      const toneGain = audio.createGain();
      const end = envelope(toneGain, 0.22, 1.4, 1.8);
      low.connect(toneGain);
      fifth.connect(toneGain);
      toneGain.connect(out);
      const air = noiseSource();
      const band = audio.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 1.2;
      band.frequency.setValueAtTime(300, now);
      band.frequency.exponentialRampToValueAtTime(3200, now + 1.6);
      const airGain = audio.createGain();
      envelope(airGain, 0.05, 1.5, 1);
      air.connect(band).connect(airGain).connect(out);
      return voiceOf([low, fifth, air], out, end);
    }

    const source = noiseSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.connect(filter).connect(gain).connect(out);
    const extra: AudioScheduledSourceNode[] = [];
    let end: number;

    if (slot === "clipper") {
      filter.type = "bandpass";
      filter.frequency.value = 3400;
      filter.Q.value = 3;
      end = envelope(gain, 0.12, 0.05, 0.55);
      const buzz = audio.createOscillator();
      buzz.frequency.value = 58;
      const depth = audio.createGain();
      depth.gain.value = 0.06;
      buzz.connect(depth).connect(gain.gain);
      extra.push(buzz);
    } else if (slot === "transition") {
      filter.type = "bandpass";
      filter.Q.value = 1.4;
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.exponentialRampToValueAtTime(4200, now + 0.55);
      end = envelope(gain, 0.16, 0.28, 0.4);
    } else if (slot === "oil") {
      filter.type = "lowpass";
      filter.frequency.value = 500;
      end = envelope(gain, 0.03, 0.4, 1.2);
      const drop = audio.createOscillator();
      drop.type = "sine";
      drop.frequency.setValueAtTime(720, now);
      drop.frequency.exponentialRampToValueAtTime(190, now + 0.22);
      const dropGain = audio.createGain();
      envelope(dropGain, 0.16, 0.008, 0.3);
      drop.connect(dropGain).connect(out);
      extra.push(drop);
    } else {
      filter.type = "highpass";
      filter.frequency.value = 2600;
      end = envelope(gain, 0.06, 0.9, 1.6);
    }
    return voiceOf([source, ...extra], out, end);
  }

  function playBuffer(buffer: AudioBuffer, config: OctoberSoundConfig): Voice {
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
    };
  }

  function stopAll() {
    shot?.stop();
    shot = null;
    ambient?.voice.stop();
    ambient = null;
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
      if (config.loop && ambient?.slot === slot) return;
      void load(slot).then((buffer) => {
        if (!ready()) return;
        try {
          if (config.loop && buffer) {
            ambient?.voice.stop(1.2);
            ambient = { slot, voice: playBuffer(buffer, config) };
            return;
          }
          shot?.stop(0.35);
          shot = buffer ? playBuffer(buffer, config) : synthesize(slot);
        } catch {
          /* never let audio break the page */
        }
      });
    },
    prefetch(slots) {
      if (ctx) slots.forEach((slot) => void load(slot));
    },
    stopAmbient() {
      ambient?.voice.stop(1.4);
      ambient = null;
    },
    stopAll,
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
