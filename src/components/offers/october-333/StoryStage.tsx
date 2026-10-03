"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { OCTOBER_SCENES, octoberMediaUrl, type OctoberScene } from "@/config/octoberOffer";
import { SceneArt } from "./SceneArt";
import { SceneMedia } from "./SceneMedia";
import { easeInOut, easeOut, segment } from "./motion";
import styles from "./experience.module.css";

interface ServiceSceneProps {
  scene: OctoberScene;
  zIndex: number;
  local: MotionValue<number>;
  visibility: MotionValue<string>;
  active: boolean;
  near: boolean;
  lite: boolean;
  allowVideo: boolean;
}

export function ServiceScene({ scene, zIndex, local, visibility, active, near, lite, allowVideo }: ServiceSceneProps) {
  const depth = lite ? 0.4 : 1;

  const clipPath = useTransform(local, (l) => {
    if (scene.id === "haircut") {
      const e = easeInOut(segment(l, 0, 0.16));
      return `inset(${(1 - e) * 50}% 0 ${(1 - e) * 50}% 0)`;
    }
    if (scene.id === "beard") return `inset(0 0 0 ${(1 - easeInOut(segment(l, 0, 0.2))) * 100}%)`;
    if (scene.id === "oil-bath") return `circle(${easeOut(segment(l, 0.1, 0.28)) * 150}% at 50% 56%)`;
    return "inset(0 0 0 0)";
  });
  const contentOpacity = useTransform(local, (l) => (scene.id === "skincare" ? segment(l, 0.1, 0.2) : 1));

  const mediaScale = useTransform(local, (l) => 1 + (0.18 - segment(l, 0, 1) * 0.16) * depth);
  const mediaY = useTransform(local, (l) => `${(0.5 - segment(l, 0, 1)) * 8 * depth}%`);

  const textStart = scene.id === "skincare" ? 0.34 : scene.id === "oil-bath" ? 0.28 : 0.16;
  const numberOpacity = useTransform(local, (l) => segment(l, textStart, textStart + 0.12));
  const numberX = useTransform(local, (l) => `${(1 - easeOut(segment(l, textStart, textStart + 0.22))) * 18 * depth}vw`);
  const titleY = useTransform(local, (l) => `${(1 - easeOut(segment(l, textStart + 0.04, textStart + 0.18))) * 110}%`);
  const lineOpacity = useTransform(local, (l) => segment(l, textStart + 0.14, textStart + 0.26));
  const lineY = useTransform(local, (l) => `${(1 - segment(l, textStart + 0.14, textStart + 0.3)) * 16 * depth}px`);

  return (
    <motion.article className={styles.scene} style={{ zIndex, visibility }} aria-labelledby={`scene-${scene.id}`}>
      <motion.div className={`${styles.sceneContent} ${styles[`tone-${scene.id}`]}`} style={{ clipPath, opacity: contentOpacity }}>
        <motion.div className={styles.mediaFrame} style={{ scale: mediaScale, y: mediaY }}>
          <SceneMedia
            video={octoberMediaUrl(scene.video)}
            poster={octoberMediaUrl(scene.poster)}
            active={active}
            near={near}
            allowVideo={allowVideo}
            slotName={scene.video}
            fallback={<SceneArt id={scene.id} local={local} still={false} />}
          />
        </motion.div>
        <div className={styles.sceneShade} />

        <div className={styles.sceneCopy}>
          <motion.span className={styles.sceneNumber} dir="ltr" style={{ opacity: numberOpacity, x: numberX }} aria-hidden="true">
            {scene.number}
          </motion.span>
          <div className={styles.titleMask}>
            <motion.h2 id={`scene-${scene.id}`} className={styles.sceneTitle} dir="ltr" lang="en" style={{ y: titleY }}>
              {scene.title}
            </motion.h2>
          </div>
          <motion.p className={styles.sceneLine} style={{ opacity: lineOpacity, y: lineY }}>
            {scene.line}
          </motion.p>
        </div>
      </motion.div>

      <SceneEntry scene={scene} local={local} />
    </motion.article>
  );
}

/** Unclipped transition layers drawn above the previous scene. */
function SceneEntry({ scene, local }: { scene: OctoberScene; local: MotionValue<number> }) {
  const splitTop = useTransform(local, (l) => `${(1 - easeInOut(segment(l, 0, 0.16))) * 50}%`);
  const splitBottom = useTransform(local, (l) => `${50 + easeInOut(segment(l, 0, 0.16)) * 50}%`);
  const splitOpacity = useTransform(local, (l) => (l > 0 && l < 0.17 ? 1 : 0));

  const bladeX = useTransform(local, (l) => `${(1 - easeInOut(segment(l, 0, 0.2))) * 100}vw`);
  const bladeOpacity = useTransform(local, (l) => (l > 0 && l < 0.2 ? 1 : 0));

  const dropY = useTransform(local, (l) => `${-12 + easeInOut(segment(l, 0, 0.12)) * 66}dvh`);
  const dropOpacity = useTransform(local, (l) => (l > 0 && l < 0.13 ? 1 : 0));
  const rippleScale = useTransform(local, (l) => 0.2 + segment(l, 0.11, 0.28) * 3);
  const rippleOpacity = useTransform(local, (l) => (l > 0.11 ? 0.7 * (1 - segment(l, 0.11, 0.28)) : 0));

  const steamOpacity = useTransform(local, (l) => segment(l, 0, 0.14) * (1 - segment(l, 0.2, 0.38)));
  const steamY = useTransform(local, (l) => `${(1 - segment(l, 0, 0.38)) * 20}%`);

  if (scene.id === "haircut") {
    return (
      <div className={styles.entryLayer} aria-hidden="true">
        <motion.span className={styles.splitLine} style={{ top: splitTop, opacity: splitOpacity }} />
        <motion.span className={styles.splitLine} style={{ top: splitBottom, opacity: splitOpacity }} />
      </div>
    );
  }
  if (scene.id === "beard") {
    return (
      <motion.div className={styles.clipperBlade} style={{ x: bladeX, opacity: bladeOpacity }} aria-hidden="true">
        <span className={styles.clipperTeeth} />
      </motion.div>
    );
  }
  if (scene.id === "oil-bath") {
    return (
      <div className={styles.entryLayer} aria-hidden="true">
        <motion.span className={styles.oilDrop} style={{ y: dropY, opacity: dropOpacity }} />
        <motion.span className={styles.oilRipple} style={{ scale: rippleScale, opacity: rippleOpacity }} />
      </div>
    );
  }
  return (
    <motion.div className={styles.steam} style={{ opacity: steamOpacity, y: steamY }} aria-hidden="true">
      <span />
      <span />
      <span />
    </motion.div>
  );
}

/** 01 ━ 02 ━ 03 ━ 04; `active` is the service index or -1 outside the service chapters. */
export function SceneProgress({ active, progress }: { active: number; progress: MotionValue<number> }) {
  const fill = useTransform(progress, (p) => (active < 0 ? 0 : (active + p) / OCTOBER_SCENES.length));
  return (
    <nav className={styles.progress} aria-label="فصول التجربة" data-visible={active >= 0}>
      <ol>
        {OCTOBER_SCENES.map((scene, index) => (
          <li
            key={scene.id}
            className={index === active ? styles.progressActive : index < active ? styles.progressDone : undefined}
            aria-current={index === active ? "step" : undefined}
          >
            <span dir="ltr">{scene.number}</span>
            <span className="sr-only">{scene.label}</span>
          </li>
        ))}
      </ol>
      <motion.span className={styles.progressFill} style={{ scaleX: fill }} aria-hidden="true" />
    </nav>
  );
}

/** Reduced-motion story: one still scene per screen with gentle fades. */
export function StoryStatic({ allowVideo, onSceneEnter }: { allowVideo: boolean; onSceneEnter?: (scene: OctoberScene) => void }) {
  return (
    <section aria-label="أربع خدمات في تجربة واحدة">
      {OCTOBER_SCENES.map((scene) => (
        <StaticScene key={scene.id} scene={scene} allowVideo={allowVideo} onEnter={onSceneEnter} />
      ))}
    </section>
  );
}

function StaticScene({ scene, allowVideo, onEnter }: { scene: OctoberScene; allowVideo: boolean; onEnter?: (scene: OctoberScene) => void }) {
  const local = useMotionValue(0.6);
  return (
    <motion.article
      className={`${styles.staticScene} ${styles[`tone-${scene.id}`]}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ amount: 0.5, once: true }}
      transition={{ duration: 0.6 }}
      onViewportEnter={() => onEnter?.(scene)}
      aria-labelledby={`scene-${scene.id}`}
    >
      <div className={styles.mediaFrame}>
        <SceneMedia
          video={octoberMediaUrl(scene.video)}
          poster={octoberMediaUrl(scene.poster)}
          active={false}
          near
          allowVideo={allowVideo}
          slotName={scene.video}
          fallback={<SceneArt id={scene.id} local={local} still />}
        />
      </div>
      <div className={styles.sceneShade} />
      <div className={styles.sceneCopy}>
        <span className={styles.sceneNumber} dir="ltr" aria-hidden="true">
          {scene.number}
        </span>
        <h2 id={`scene-${scene.id}`} className={styles.sceneTitle} dir="ltr" lang="en">
          {scene.title}
        </h2>
        <p className={styles.sceneLine}>{scene.line}</p>
      </div>
    </motion.article>
  );
}
