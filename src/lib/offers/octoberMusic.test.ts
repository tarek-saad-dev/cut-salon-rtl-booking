import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MUSIC_DRIFT_TOLERANCE_MS, createMusicController } from "./octoberMusic";

class FakeAudio {
  src = "";
  preload = "";
  currentTime = 0;
  volume = 1;
  muted = false;
  paused = true;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => {
    if (name === "src") this.src = "";
  });
}

let audio: FakeAudio;
const create = (startAt = 0) => {
  audio = new FakeAudio();
  return createMusicController({
    src: "/audio/oct.mp3",
    volume: 0.6,
    startAt,
    createAudio: () => audio as unknown as HTMLAudioElement,
  });
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("October music controller", () => {
  it("does not touch the network or play until asked", () => {
    const music = create();
    expect(audio.src).toBe("");
    music.play(0);
    expect(audio.src).toBe("/audio/oct.mp3");
    expect(audio.preload).toBe("metadata");
    expect(audio.play).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(audio.volume).toBeCloseTo(0.6);
  });

  it("pauses without losing the position and resumes at the film time", () => {
    const music = create();
    music.play(0);
    audio.currentTime = 4.1;
    music.pause();
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(4.1);

    music.play(12_000);
    expect(audio.currentTime).toBe(12);
    expect(audio.paused).toBe(false);
  });

  it("only seeks when the drift is meaningful", () => {
    const music = create();
    music.play(0);
    audio.currentTime = 10 + (MUSIC_DRIFT_TOLERANCE_MS - 100) / 1000;
    music.sync(10_000);
    expect(audio.currentTime).toBeCloseTo(10.25);
    audio.currentTime = 11;
    music.sync(10_000);
    expect(audio.currentTime).toBe(10);
  });

  it("offsets film time by the track start position", () => {
    const music = create(8);
    music.play(2_000);
    expect(audio.currentTime).toBe(10);
  });

  it("mutes without pausing", () => {
    const music = create();
    music.play(0);
    music.setMuted(true);
    expect(audio.muted).toBe(true);
    expect(audio.paused).toBe(false);
    expect(music.isPlaying()).toBe(true);
  });

  it("fades out, then pauses; playing again cancels the fade", () => {
    const music = create();
    music.play(0);
    vi.advanceTimersByTime(300);
    music.fadeOut(400);
    expect(music.isPlaying()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(audio.volume).toBeLessThan(0.6);
    expect(audio.paused).toBe(false);
    vi.advanceTimersByTime(250);
    expect(audio.volume).toBe(0);
    expect(audio.paused).toBe(true);

    music.play(30_000);
    music.fadeOut(400);
    vi.advanceTimersByTime(100);
    music.play(30_100);
    vi.advanceTimersByTime(600);
    expect(audio.paused).toBe(false);
    expect(audio.volume).toBeCloseTo(0.6);
  });

  it("uses a Web Audio gain route for volume when available", () => {
    const gain = { value: 1, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
    audio = new FakeAudio();
    const music = createMusicController({
      createAudio: () => audio as unknown as HTMLAudioElement,
      connect: () => ({ gain: gain as unknown as AudioParam, now: () => 5 }),
      volume: 0.6,
    });
    music.play(0);
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.6, 5.25);
    music.fadeOut(400);
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 5.4);
    expect(audio.volume).toBe(1);
  });

  it("releases the element on dispose", () => {
    const music = create();
    music.play(0);
    music.dispose();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe("");
    music.play(0);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });
});
