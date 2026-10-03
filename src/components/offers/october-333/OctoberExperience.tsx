"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  OCTOBER_CHAPTERS,
  OCTOBER_SCENES,
  type OctoberChapterId,
  type OctoberSoundSlot,
} from "@/config/octoberOffer";
import { getOctoberSound } from "@/lib/offers/octoberSound";
import { CinematicStage } from "./CinematicStage";
import { Conversion } from "./Conversion";
import { OpeningStatic } from "./OpeningScene";
import { PriceRevealStatic } from "./PriceReveal";
import { StoryStatic } from "./StoryStage";
import { useCinematicTimeline } from "./useCinematicTimeline";
import styles from "./experience.module.css";

const OFFER_INDEX = OCTOBER_CHAPTERS.length - 1;
const CHAPTER_SOUND: Partial<Record<OctoberChapterId, OctoberSoundSlot>> = {
  opening: "opening",
  ...Object.fromEntries(OCTOBER_SCENES.map((scene) => [scene.id, scene.sound])),
};
const AMBIENT_CHAPTERS = new Set<OctoberChapterId>(["oil-bath", "skincare"]);
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);
const DRAG_PX = 12;
const PROGRAMMATIC_TIMEOUT_MS = 2500;

function useDeviceProfile() {
  const [profile, setProfile] = useState({ lite: false, allowVideo: true });
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const saveData = !!nav.connection?.saveData;
    setProfile({
      lite: saveData || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2,
      allowVideo: !saveData,
    });
  }, []);
  return profile;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Server snapshot is `false` so hydration matches the server markup before switching. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function useSoundEnabled() {
  const sound = getOctoberSound();
  return useSyncExternalStore(sound.subscribe, sound.isEnabled, () => false);
}

/** Sound control shared by both modes; remembers an explicit mute before the start tap. */
function useSoundControl() {
  const soundOn = useSoundEnabled();
  const mutedByUser = useRef(false);

  const enableForStart = useCallback(async () => {
    const sound = getOctoberSound();
    await sound.unlock();
    if (!mutedByUser.current) sound.setEnabled(true);
  }, []);

  const toggle = useCallback(() => {
    const sound = getOctoberSound();
    if (sound.isEnabled()) {
      mutedByUser.current = true;
      sound.setEnabled(false);
    } else {
      mutedByUser.current = false;
      void sound.unlock().then(() => sound.setEnabled(true));
    }
  }, []);

  useEffect(() => () => getOctoberSound().stopAll(), []);

  return { soundOn, enableForStart, toggle };
}

export function OctoberExperience() {
  const reduced = usePrefersReducedMotion();
  const profile = useDeviceProfile();
  return (
    <main className={styles.experience} dir="rtl" lang="ar">
      {reduced ? <StaticExperience allowVideo={profile.allowVideo} /> : <CinematicExperience {...profile} />}
    </main>
  );
}

function TopBar({ soundOn, onToggle }: { soundOn: boolean; onToggle: () => void }) {
  return (
    <header className={styles.topBar}>
      <Link href="/" className={styles.wordmark} aria-label="CUT Salon — الرئيسية">
        CUT<span>SALON</span>
      </Link>
      <button
        type="button"
        className={styles.soundToggle}
        onClick={onToggle}
        aria-pressed={soundOn}
        aria-label={soundOn ? "إيقاف الصوت" : "تشغيل الصوت"}
        data-cinema-control
      >
        <span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span>
      </button>
    </header>
  );
}

function CinematicExperience({ lite, allowVideo }: { lite: boolean; allowVideo: boolean }) {
  const { soundOn, enableForStart, toggle } = useSoundControl();
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const [stageHidden, setStageHidden] = useState(false);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  /** Scroll events count as ours until the viewport reaches `target`; only explicit input cancels that early. */
  const programmatic = useRef<{ target: number | null; restY: number; timer: number }>({ target: null, restY: 0, timer: 0 });

  const releaseProgrammatic = useCallback(() => {
    const state = programmatic.current;
    window.clearTimeout(state.timer);
    state.target = null;
  }, []);

  const scrollToChapter = useCallback(
    (index: number) => {
      const anchor = anchors.current[index];
      if (!anchor) return;
      const state = programmatic.current;
      const top = Math.min(anchor.offsetTop, document.documentElement.scrollHeight - window.innerHeight);
      state.restY = top;
      if (Math.abs(window.scrollY - top) < 2) return;
      state.target = top;
      window.clearTimeout(state.timer);
      state.timer = window.setTimeout(() => (state.target = null), PROGRAMMATIC_TIMEOUT_MS);
      window.scrollTo({ top: anchor.offsetTop, behavior: "smooth" });
    },
    [],
  );

  const timeline = useCinematicTimeline(OCTOBER_CHAPTERS, {
    chapter(index, _previous, cause) {
      const sound = getOctoberSound();
      const id = OCTOBER_CHAPTERS[index].id;
      if (cause !== "manual") scrollToChapter(index);
      if (!AMBIENT_CHAPTERS.has(id)) sound.stopAmbient();
      const slot = CHAPTER_SOUND[id];
      if (slot && startedRef.current && (cause === "start" || cause === "auto")) sound.play(slot);
    },
    cue(id) {
      if (id === "reveal" && startedRef.current && timelineRef.current.current().status === "playing") {
        getOctoberSound().play("reveal");
      }
    },
  });
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  const chapterFromScroll = useCallback(() => {
    const els = anchors.current;
    const y = window.scrollY;
    const offer = els[OFFER_INDEX];
    if (offer && y >= offer.offsetTop - 2) return OFFER_INDEX;
    const probe = y + window.innerHeight * 0.5;
    let found = 0;
    for (let i = 0; i < OFFER_INDEX; i++) {
      const el = els[i];
      if (el && el.offsetTop <= probe) found = i;
    }
    return found;
  }, []);

  const updateStageHidden = useCallback(() => {
    const offer = anchors.current[OFFER_INDEX];
    setStageHidden(!!offer && window.scrollY >= offer.offsetTop + 1);
  }, []);

  /** The visitor took over: stop directing and let the current scene come to rest. */
  const interrupt = useCallback(() => {
    const tl = timelineRef.current;
    const { status, index } = tl.current();
    if (status !== "playing") return;
    getOctoberSound().stopAll();
    tl.settle(index);
  }, []);

  const syncFromScroll = useCallback(() => {
    const tl = timelineRef.current;
    const index = chapterFromScroll();
    if (index !== tl.current().index) tl.settle(index, index === 0 && !startedRef.current ? 0 : undefined);
  }, [chapterFromScroll]);

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    syncFromScroll();
    updateStageHidden();

    let touch: { x: number; y: number } | null = null;
    let pointer: { x: number; y: number } | null = null;

    const onScroll = () => {
      updateStageHidden();
      const state = programmatic.current;
      const y = window.scrollY;
      if (state.target !== null) {
        if (Math.abs(y - state.target) < 2) releaseProgrammatic();
        return;
      }
      if (Math.abs(y - state.restY) < 2) return;
      state.restY = y;
      interrupt();
      syncFromScroll();
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touch = t ? { x: t.clientX, y: t.clientY } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (touch && t && Math.hypot(t.clientX - touch.x, t.clientY - touch.y) > DRAG_PX) {
        touch = null;
        releaseProgrammatic();
        interrupt();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      pointer = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointer && Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > DRAG_PX) {
        pointer = null;
        releaseProgrammatic();
        interrupt();
      }
    };
    const onPointerUp = () => (pointer = null);
    const onWheel = () => {
      releaseProgrammatic();
      interrupt();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!NAV_KEYS.has(e.key)) return;
      if (e.key === " " && (e.target as HTMLElement | null)?.closest?.("button, a, input, textarea")) return;
      releaseProgrammatic();
      interrupt();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      history.scrollRestoration = previousRestoration;
      window.clearTimeout(programmatic.current.timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [interrupt, releaseProgrammatic, syncFromScroll, updateStageHidden]);

  const markStarted = () => {
    startedRef.current = true;
    setStarted(true);
  };

  const start = async () => {
    await enableForStart();
    markStarted();
    timeline.start();
  };

  const playPause = () => {
    if (timeline.status === "playing") {
      getOctoberSound().stopAll();
      timeline.pause();
      return;
    }
    void getOctoberSound().unlock();
    markStarted();
    scrollToChapter(timeline.index);
    timeline.resume();
  };

  const skip = () => {
    getOctoberSound().stopAll();
    timeline.skip();
    anchors.current[OFFER_INDEX]?.focus({ preventScroll: true });
  };

  const playing = timeline.status === "playing";
  const inStory = timeline.index < OFFER_INDEX;
  const showControls = inStory && (started || timeline.index > 0);
  const resumeLabel = timeline.status === "idle" ? "تشغيل التجربة" : "استكمال التجربة";

  return (
    <>
      <TopBar soundOn={soundOn} onToggle={toggle} />
      <CinematicStage
        chapter={timeline.chapter}
        progress={timeline.progress}
        index={timeline.index}
        started={started}
        hidden={stageHidden}
        lite={lite}
        allowVideo={allowVideo}
        onStart={start}
      />
      <div className={styles.anchors} aria-hidden="true">
        {OCTOBER_CHAPTERS.slice(0, OFFER_INDEX).map((chapter, i) => (
          <div key={chapter.id} ref={(el) => void (anchors.current[i] = el)} className={styles.anchor} data-chapter={chapter.id} />
        ))}
      </div>
      <Conversion ref={(el) => void (anchors.current[OFFER_INDEX] = el)} reduced={false} />

      {showControls && (
        <div className={styles.controls} data-cinema-control>
          <button
            type="button"
            className={playing ? styles.controlButton : styles.resumeChip}
            onClick={playPause}
            aria-label={playing ? "إيقاف مؤقت" : resumeLabel}
          >
            <span aria-hidden="true">{playing ? "⏸" : "▶"}</span>
            {!playing && <span aria-hidden="true">{resumeLabel}</span>}
          </button>
          <button type="button" className={styles.skipButton} onClick={skip}>
            تخطي
          </button>
        </div>
      )}
    </>
  );
}

function StaticExperience({ allowVideo }: { allowVideo: boolean }) {
  const { soundOn, enableForStart, toggle } = useSoundControl();
  const startedRef = useRef(false);

  const start = async () => {
    await enableForStart();
    startedRef.current = true;
    document.getElementById("october-static-story")?.scrollIntoView({ behavior: "auto" });
  };

  return (
    <>
      <TopBar soundOn={soundOn} onToggle={toggle} />
      <OpeningStatic onStart={start} />
      <div id="october-static-story">
        <StoryStatic
          allowVideo={allowVideo}
          onSceneEnter={(scene) => {
            if (startedRef.current) getOctoberSound().play(scene.sound);
          }}
        />
      </div>
      <PriceRevealStatic />
      <Conversion reduced />
    </>
  );
}
