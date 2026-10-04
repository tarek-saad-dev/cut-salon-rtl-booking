import { describe, expect, it } from "vitest";
import {
  MUSIC_FADE_CUE,
  OCTOBER_CHAPTER_AMBIENCE,
  OCTOBER_CHAPTERS,
  OCTOBER_SCENES,
  OCTOBER_SOUND_CUES,
  OCTOBER_SOUNDS,
  PRICE_IMPACT_AT,
  resolveSceneFrames,
  soundCueId,
  soundFromCue,
} from "./octoberOffer";

describe("October sound cue map", () => {
  it("only schedules known sounds strictly inside each chapter", () => {
    for (const [chapter, cues] of Object.entries(OCTOBER_SOUND_CUES)) {
      for (const cue of cues) {
        expect(OCTOBER_SOUNDS[cue.sound], `${chapter} → ${cue.sound}`).toBeDefined();
        expect(cue.at).toBeGreaterThan(0);
        expect(cue.at).toBeLessThan(1);
      }
    }
  });

  it("gives every story chapter several timed cues, with the 333 hit on the impact", () => {
    for (const chapter of OCTOBER_CHAPTERS.slice(0, -1)) {
      expect(OCTOBER_SOUND_CUES[chapter.id].length, chapter.id).toBeGreaterThanOrEqual(4);
    }
    expect(OCTOBER_SOUND_CUES.price).toContainEqual({ at: PRICE_IMPACT_AT, sound: "reveal" });
    expect(OCTOBER_SOUND_CUES.offer).toEqual([]);
  });

  it("feeds the cue map into the master timeline in time order", () => {
    for (const chapter of OCTOBER_CHAPTERS) {
      const cues = chapter.cues ?? [];
      const sounds = cues.map((cue) => soundFromCue(cue.id)).filter(Boolean);
      expect(sounds).toEqual(OCTOBER_SOUND_CUES[chapter.id].map((cue) => cue.sound));
      expect(cues.map((cue) => cue.at)).toEqual([...cues.map((cue) => cue.at)].sort((a, b) => a - b));
    }
    const price = OCTOBER_CHAPTERS.find((chapter) => chapter.id === "price")!;
    expect(price.cues!.some((cue) => cue.id === MUSIC_FADE_CUE)).toBe(true);
  });

  it("round-trips sound cue ids and ignores other cues", () => {
    expect(soundFromCue(soundCueId("snip"))).toBe("snip");
    expect(soundFromCue(MUSIC_FADE_CUE)).toBeNull();
    expect(soundFromCue("sfx:unknown")).toBeNull();
  });

  it("declares ambience only with looping sounds, and loops only as chapter ambience", () => {
    const ambience = new Set(Object.values(OCTOBER_CHAPTER_AMBIENCE));
    for (const slot of ambience) expect(OCTOBER_SOUNDS[slot!].loop).toBe(true);
    for (const [chapter, cues] of Object.entries(OCTOBER_SOUND_CUES)) {
      for (const cue of cues.filter((c) => OCTOBER_SOUNDS[c.sound].loop)) {
        expect(OCTOBER_CHAPTER_AMBIENCE[chapter as keyof typeof OCTOBER_CHAPTER_AMBIENCE]).toBe(cue.sound);
      }
    }
  });

  it("keeps the mix restrained: only the hero hit ducks the music", () => {
    const ducking = Object.entries(OCTOBER_SOUNDS).filter(([, config]) => config.duck);
    expect(ducking.map(([slot]) => slot)).toEqual(["reveal"]);
    for (const [slot, config] of Object.entries(OCTOBER_SOUNDS)) {
      expect(config.volume, slot).toBeLessThanOrEqual(slot === "reveal" ? 0.55 : 0.3);
    }
  });
});

describe("October scene frames", () => {
  it("defines four story frames per service with captions and alt text", () => {
    for (const scene of OCTOBER_SCENES) {
      expect(scene.frames).toHaveLength(4);
      expect(new Set(scene.frames.map((frame) => frame.file)).size).toBe(4);
      for (const frame of scene.frames) {
        expect(frame.file).toMatch(new RegExp(`^images/${scene.id}-\\d\\.webp$`));
        expect(frame.caption).not.toBe("");
        expect(frame.alt).not.toBe("");
      }
    }
  });

  it("resolves URLs only for frames listed as available", () => {
    const scene = OCTOBER_SCENES[0];
    const resolved = resolveSceneFrames(scene, new Set([scene.frames[1].file]));
    expect(resolved.map((frame) => frame.src)).toEqual([
      undefined,
      `/media/october-experience/${scene.frames[1].file}`,
      undefined,
      undefined,
    ]);
    expect(resolveSceneFrames(scene).every((frame) => frame.src === undefined)).toBe(true);
  });
});
