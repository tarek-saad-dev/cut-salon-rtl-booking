"use client";

import { useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { OctoberSceneId, ResolvedSceneFrame } from "@/config/octoberOffer";
import { easeInOut, easeOut, segment } from "./motion";
import styles from "./experience.module.css";

type Reveal = "side" | "up" | "circle" | "mist";
type Side = "start" | "end";

interface CardPlan {
  side: Side;
  reveal: Reveal;
}

/** Each service gets its own composition so the four chapters don't feel templated. */
const LAYOUTS: Record<OctoberSceneId, readonly [CardPlan, CardPlan]> = {
  haircut: [
    { side: "end", reveal: "side" },
    { side: "start", reveal: "up" },
  ],
  beard: [
    { side: "start", reveal: "side" },
    { side: "end", reveal: "side" },
  ],
  "oil-bath": [
    { side: "end", reveal: "circle" },
    { side: "start", reveal: "up" },
  ],
  skincare: [
    { side: "start", reveal: "mist" },
    { side: "end", reveal: "up" },
  ],
};

/** Card A enters at ~0.24, card B at ~0.40; both clear for the final hero frame at ~0.64. */
const CARD_WINDOWS = [
  { enter: 0.22, settle: 0.34, exit: 0.62 },
  { enter: 0.38, settle: 0.5, exit: 0.66 },
] as const;
const CARD_EXIT_SPAN = 0.08;

export const FINAL_FRAME_WINDOW = { enter: 0.64, settle: 0.78 } as const;

function clipFor(reveal: Reveal, side: Side, e: number) {
  const hidden = (1 - e) * 100;
  if (reveal === "side") return side === "end" ? `inset(0 0 0 ${hidden}%)` : `inset(0 ${hidden}% 0 0)`;
  if (reveal === "up") return `inset(${hidden}% 0 0 0)`;
  if (reveal === "circle") return `circle(${e * 75}% at 50% 50%)`;
  return "inset(0 0 0 0)";
}

interface SceneGalleryProps {
  sceneId: OctoberSceneId;
  frames: readonly ResolvedSceneFrame[];
  local: MotionValue<number>;
  /** Current or adjacent chapter: allowed to request images. */
  near: boolean;
  lite: boolean;
}

/** Floating detail cards over the hero: frames[1] and frames[2] of the scene. */
export function SceneGallery({ sceneId, frames, local, near, lite }: SceneGalleryProps) {
  const details = frames.slice(1, 3);
  const plans = LAYOUTS[sceneId];
  return (
    <div className={styles.gallery} aria-hidden="true">
      {details.map((frame, i) =>
        lite && i > 0 ? null : (
          <GalleryCard key={frame.file} sceneId={sceneId} frame={frame} index={i} plan={plans[i]} local={local} near={near} />
        ),
      )}
    </div>
  );
}

function GalleryCard({
  sceneId,
  frame,
  index,
  plan,
  local,
  near,
}: {
  sceneId: OctoberSceneId;
  frame: ResolvedSceneFrame;
  index: number;
  plan: CardPlan;
  local: MotionValue<number>;
  near: boolean;
}) {
  const w = CARD_WINDOWS[index];
  const clipPath = useTransform(local, (l) => clipFor(plan.reveal, plan.side, easeInOut(segment(l, w.enter, w.settle))));
  const opacity = useTransform(local, (l) => {
    const enter = plan.reveal === "mist" ? segment(l, w.enter, w.settle) : l >= w.enter ? 1 : 0;
    return enter * (1 - segment(l, w.exit, w.exit + CARD_EXIT_SPAN));
  });
  const direction = plan.side === "end" ? 1 : -1;
  const x = useTransform(local, (l) => `${segment(l, w.exit, w.exit + CARD_EXIT_SPAN) * 10 * direction}vw`);
  const y = useTransform(local, (l) => `${(0.5 - l) * 18 + (plan.reveal === "mist" ? (1 - easeOut(segment(l, w.enter, w.settle))) * 24 : 0)}px`);
  const imageScale = useTransform(local, (l) => 1.14 - segment(l, w.enter, w.exit) * 0.12);

  return (
    <motion.figure
      className={styles.galleryCard}
      data-slot={index === 0 ? "a" : "b"}
      data-side={plan.side}
      style={{ clipPath, opacity, x, y }}
    >
      <CardMedia sceneId={sceneId} frame={frame} near={near} scale={imageScale} />
      <figcaption className={styles.galleryCaption}>{frame.caption}</figcaption>
    </motion.figure>
  );
}

function CardMedia({
  sceneId,
  frame,
  near,
  scale,
}: {
  sceneId: OctoberSceneId;
  frame: ResolvedSceneFrame;
  near: boolean;
  scale?: MotionValue<number>;
}) {
  const [failed, setFailed] = useState(false);
  if (!frame.src || failed) return <span className={`${styles.galleryPanel} ${styles[`panel-${sceneId}`]}`} data-fallback />;
  if (!near) return <span className={`${styles.galleryPanel} ${styles[`panel-${sceneId}`]}`} />;
  return (
    <motion.img
      className={styles.galleryImage}
      src={frame.src}
      alt={frame.alt}
      decoding="async"
      style={scale ? { scale } : undefined}
      onError={() => setFailed(true)}
    />
  );
}

/** The scene settles on its best shot: frames[3] crossfades over the hero when it exists. */
export function FinalFrame({ frame, local, near }: { frame?: ResolvedSceneFrame; local: MotionValue<number>; near: boolean }) {
  const opacity = useTransform(local, (l) => easeInOut(segment(l, FINAL_FRAME_WINDOW.enter, FINAL_FRAME_WINDOW.settle)));
  const scale = useTransform(local, (l) => 1.08 - segment(l, FINAL_FRAME_WINDOW.enter, 1) * 0.08);
  const [failed, setFailed] = useState(false);
  if (!frame?.src || failed || !near) return null;
  return (
    <motion.img
      className={styles.finalFrame}
      src={frame.src}
      alt=""
      decoding="async"
      style={{ opacity, scale }}
      onError={() => setFailed(true)}
    />
  );
}

/** Reduced motion: the two detail frames as still cards, no movement. */
export function SceneGalleryStill({ sceneId, frames }: { sceneId: OctoberSceneId; frames: readonly ResolvedSceneFrame[] }) {
  return (
    <div className={`${styles.gallery} ${styles.galleryStill}`} aria-hidden="true">
      {frames.slice(1, 3).map((frame, i) => (
        <figure key={frame.file} className={styles.galleryCard} data-slot={i === 0 ? "a" : "b"} data-side={LAYOUTS[sceneId][i].side}>
          <CardMedia sceneId={sceneId} frame={frame} near />
          <figcaption className={styles.galleryCaption}>{frame.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
