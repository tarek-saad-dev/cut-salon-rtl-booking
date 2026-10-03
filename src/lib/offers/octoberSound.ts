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

  function ramp(param: AudioParam, start: number, points: readonly (readonly [number, number])[]) {
    param.setValueAtTime(points[0][1], start + points[0][0]);
    for (const [at, value] of points.slice(1)) param.linearRampToValueAtTime(value, start + at);
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

    if (slot === "opening") {
      // Radio static → distant rumble + soft swell → the rumble becomes a clipper buzz.
      const staticNoise = noiseSource();
      const radio = audio.createBiquadFilter();
      radio.type = "bandpass";
      radio.frequency.value = 1700;
      radio.Q.value = 0.8;
      const staticGain = audio.createGain();
      ramp(staticGain.gain, now, [[0, 0], [1.2, 0.045], [3.6, 0.03], [5, 0]]);
      staticNoise.connect(radio).connect(staticGain).connect(out);

      const rumble = audio.createOscillator();
      rumble.type = "sine";
      rumble.frequency.value = 41;
      const rumbleGain = audio.createGain();
      ramp(rumbleGain.gain, now, [[0, 0], [2, 0.22], [4.2, 0.2], [5.6, 0]]);
      rumble.connect(rumbleGain).connect(out);

      const swell = audio.createOscillator();
      swell.type = "triangle";
      swell.frequency.value = 110;
      const swellFifth = audio.createOscillator();
      swellFifth.type = "triangle";
      swellFifth.frequency.value = 164.8;
      const warm = audio.createBiquadFilter();
      warm.type = "lowpass";
      warm.frequency.value = 800;
      const swellGain = audio.createGain();
      ramp(swellGain.gain, now, [[0, 0], [2, 0], [4, 0.05], [5.4, 0]]);
      swell.connect(warm);
      swellFifth.connect(warm);
      warm.connect(swellGain).connect(out);

      const buzz = audio.createOscillator();
      buzz.type = "sawtooth";
      buzz.frequency.setValueAtTime(41, now);
      buzz.frequency.setValueAtTime(41, now + 4.2);
      buzz.frequency.exponentialRampToValueAtTime(118, now + 5.6);
      const buzzTone = audio.createBiquadFilter();
      buzzTone.type = "bandpass";
      buzzTone.frequency.value = 1400;
      buzzTone.Q.value = 1.4;
      const buzzGain = audio.createGain();
      ramp(buzzGain.gain, now, [[0, 0], [4.2, 0], [5.6, 0.07], [6.2, 0.07]]);
      buzz.connect(buzzTone).connect(buzzGain).connect(out);

      return voiceOf([staticNoise, rumble, swell, swellFifth, buzz], out, now + 6.4);
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
      end = envelope(gain, 0.08, 0.05, 1.6);
      const motor = audio.createOscillator();
      motor.type = "sawtooth";
      motor.frequency.value = 118;
      const motorTone = audio.createBiquadFilter();
      motorTone.type = "bandpass";
      motorTone.frequency.value = 1400;
      motorTone.Q.value = 1.4;
      const motorGain = audio.createGain();
      ramp(motorGain.gain, now, [[0, 0.07], [1.2, 0.05], [1.7, 0]]);
      motor.connect(motorTone).connect(motorGain).connect(out);
      extra.push(motor);
    } else if (slot === "razor") {
      filter.type = "bandpass";
      filter.Q.value = 1.4;
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(5200, now + 0.5);
      end = envelope(gain, 0.12, 0.22, 0.35);
      for (const [freq, at] of [[2350, 0.42], [3120, 0.46]] as const) {
        const ping = audio.createOscillator();
        ping.type = "sine";
        ping.frequency.value = freq;
        const pingGain = audio.createGain();
        envelope(pingGain, 0.045, 0.004, 0.9, at);
        ping.connect(pingGain).connect(out);
        extra.push(ping);
      }
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
