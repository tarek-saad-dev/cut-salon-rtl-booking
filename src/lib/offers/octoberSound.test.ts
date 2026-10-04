import { describe, expect, it, vi } from "vitest";
import { OCTOBER_SOUND_SLOTS } from "@/config/octoberOffer";
import { createSoundManager, MAX_ONE_SHOTS, OCTOBER_SOUND_STORAGE_KEY } from "./octoberSound";

function param() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}

function node() {
  const n = {
    connect: vi.fn((target: unknown) => target),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    gain: param(),
    frequency: param(),
    Q: param(),
    type: "",
    buffer: null as unknown,
    loop: false,
  };
  return n;
}

function fakeContext() {
  return {
    state: "suspended" as AudioContextState,
    currentTime: 0,
    sampleRate: 100,
    destination: {},
    resume: vi.fn(async function (this: { state: AudioContextState }) {
      this.state = "running";
    }),
    suspend: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    createGain: vi.fn(node),
    createOscillator: vi.fn(node),
    createBiquadFilter: vi.fn(node),
    createBufferSource: vi.fn(node),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(100) })),
    decodeAudioData: vi.fn(async () => ({})),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function memoryStorage() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
}

describe("October sound manager", () => {
  it("stays silent and creates no audio context until unlocked", async () => {
    const createContext = vi.fn(() => fakeContext() as unknown as AudioContext);
    const manager = createSoundManager({ createContext, storage: memoryStorage() });
    manager.setEnabled(true);
    manager.play("reveal");
    await flush();
    expect(createContext).not.toHaveBeenCalled();
  });

  it("falls back to synthesized cues without fetching missing assets", async () => {
    const ctx = fakeContext();
    const fetcher = vi.fn();
    const manager = createSoundManager({
      createContext: () => ctx as unknown as AudioContext,
      resolveUrl: () => undefined,
      fetcher,
      storage: memoryStorage(),
    });
    await manager.unlock();
    manager.setEnabled(true);
    for (const slot of OCTOBER_SOUND_SLOTS) expect(() => manager.play(slot)).not.toThrow();
    await flush();
    expect(fetcher).not.toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
  });

  it("layers one-shots instead of cutting the previous one off", async () => {
    const ctx = fakeContext();
    const gains: ReturnType<typeof node>[] = [];
    ctx.createGain = vi.fn(() => {
      const n = node();
      gains.push(n);
      return n;
    });
    const manager = createSoundManager({ createContext: () => ctx as unknown as AudioContext, resolveUrl: () => undefined, storage: memoryStorage() });
    await manager.unlock();
    manager.setEnabled(true);
    manager.play("riser");
    await flush();
    const afterRiser = gains.length;
    manager.play("reveal");
    await flush();
    expect(gains.length).toBeGreaterThan(afterRiser);
    expect(gains.some((g) => g.gain.setTargetAtTime.mock.calls.length > 0)).toBe(false);
  });

  it("caps simultaneous one-shots", async () => {
    const ctx = fakeContext();
    const gains: ReturnType<typeof node>[] = [];
    ctx.createGain = vi.fn(() => {
      const n = node();
      gains.push(n);
      return n;
    });
    const manager = createSoundManager({ createContext: () => ctx as unknown as AudioContext, resolveUrl: () => undefined, storage: memoryStorage() });
    await manager.unlock();
    manager.setEnabled(true);
    for (let i = 0; i < MAX_ONE_SHOTS + 3; i++) manager.play("tick");
    await flush();
    const silenced = gains.filter((g) => g.gain.setTargetAtTime.mock.calls.length > 0);
    expect(silenced).toHaveLength(3);
  });

  it("keeps a single ambience bed and swaps it when the chapter changes", async () => {
    const ctx = fakeContext();
    const manager = createSoundManager({ createContext: () => ctx as unknown as AudioContext, resolveUrl: () => undefined, storage: memoryStorage() });
    await manager.unlock();
    manager.setEnabled(true);
    expect(manager.ambient()).toBeNull();
    manager.play("warm-air");
    await flush();
    expect(manager.ambient()).toBe("warm-air");
    const sourcesBefore = ctx.createBufferSource.mock.calls.length;
    manager.play("warm-air");
    await flush();
    expect(ctx.createBufferSource.mock.calls.length).toBe(sourcesBefore);
    manager.play("spa-air");
    await flush();
    expect(manager.ambient()).toBe("spa-air");
    manager.stopAmbient();
    expect(manager.ambient()).toBeNull();
  });

  it("survives a failing asset request", async () => {
    const ctx = fakeContext();
    const manager = createSoundManager({
      createContext: () => ctx as unknown as AudioContext,
      resolveUrl: (file) => `/media/${file}`,
      fetcher: vi.fn(async () => new Response(null, { status: 404 })),
      storage: memoryStorage(),
    });
    await manager.unlock();
    manager.setEnabled(true);
    expect(() => manager.play("reveal")).not.toThrow();
    await flush();
    await flush();
    expect(ctx.decodeAudioData).not.toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it("persists the toggle for the session and notifies subscribers", () => {
    const storage = memoryStorage();
    const manager = createSoundManager({ createContext: () => null, storage });
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.setEnabled(true);
    expect(storage.getItem(OCTOBER_SOUND_STORAGE_KEY)).toBe("on");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(createSoundManager({ createContext: () => null, storage }).isEnabled()).toBe(true);
    manager.setEnabled(false);
    expect(storage.getItem(OCTOBER_SOUND_STORAGE_KEY)).toBe("off");
  });

  it("plays nothing while muted", async () => {
    const ctx = fakeContext();
    const manager = createSoundManager({ createContext: () => ctx as unknown as AudioContext, resolveUrl: () => undefined, storage: memoryStorage() });
    await manager.unlock();
    manager.play("reveal");
    await flush();
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });
});
