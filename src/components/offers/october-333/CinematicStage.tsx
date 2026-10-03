"use client";

import { useTransform, type MotionValue } from "framer-motion";
import { OCTOBER_CHAPTERS, OCTOBER_SCENES } from "@/config/octoberOffer";
import { OpeningScene } from "./OpeningScene";
import { PriceScene } from "./PriceReveal";
import { SceneProgress, ServiceScene } from "./StoryStage";
import styles from "./experience.module.css";

const PRICE_INDEX = OCTOBER_CHAPTERS.findIndex((c) => c.id === "price");

interface CinematicStageProps {
  chapter: MotionValue<number>;
  progress: MotionValue<number>;
  /** Current chapter index (React state, for media loading and chrome). */
  index: number;
  started: boolean;
  hidden: boolean;
  lite: boolean;
  allowVideo: boolean;
  onStart: () => void;
}

/** Per-chapter progress: 1 once passed, the live value while current, -1 before. */
function useChapterLocal(chapter: MotionValue<number>, progress: MotionValue<number>, position: number) {
  const local = useTransform([chapter, progress], ([c, p]: number[]) => (position < c ? 1 : position === c ? p : -1));
  const visibility = useTransform([chapter, progress], ([c, p]: number[]) =>
    position === c || (position === c - 1 && p < 0.4) ? "visible" : "hidden",
  );
  return { local, visibility };
}

export function CinematicStage({ chapter, progress, index, started, hidden, lite, allowVideo, onStart }: CinematicStageProps) {
  const opening = useChapterLocal(chapter, progress, 0);
  const price = useChapterLocal(chapter, progress, PRICE_INDEX);
  const serviceIndex = index >= 1 && index <= OCTOBER_SCENES.length ? index - 1 : -1;

  return (
    <div className={styles.stage} data-hidden={hidden} aria-hidden={hidden || undefined}>
      <OpeningScene local={opening.local} visibility={opening.visibility} started={started} allowVideo={allowVideo} onStart={onStart} />
      {OCTOBER_SCENES.map((scene, i) => (
        <StageService
          key={scene.id}
          position={i + 1}
          chapter={chapter}
          progress={progress}
          index={index}
          lite={lite}
          allowVideo={allowVideo}
          sceneIndex={i}
        />
      ))}
      <PriceScene local={price.local} visibility={price.visibility} zIndex={PRICE_INDEX + 1} />
      <SceneProgress active={serviceIndex} progress={progress} />
    </div>
  );
}

function StageService({
  position,
  chapter,
  progress,
  index,
  lite,
  allowVideo,
  sceneIndex,
}: {
  position: number;
  chapter: MotionValue<number>;
  progress: MotionValue<number>;
  index: number;
  lite: boolean;
  allowVideo: boolean;
  sceneIndex: number;
}) {
  const { local, visibility } = useChapterLocal(chapter, progress, position);
  return (
    <ServiceScene
      scene={OCTOBER_SCENES[sceneIndex]}
      zIndex={position + 1}
      local={local}
      visibility={visibility}
      active={index === position}
      near={Math.abs(index - position) <= 1}
      lite={lite}
      allowVideo={allowVideo}
    />
  );
}
