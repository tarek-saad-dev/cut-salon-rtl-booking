"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { OCTOBER_SCENES, octoberMediaUrl, type OctoberScene } from "@/config/octoberOffer";
import { SceneArt } from "./SceneArt";
import { SceneMedia } from "./SceneMedia";
import { easeInOut, easeOut, segment } from "./motion";
import styles from "./experience.module.css";

const COUNT = OCTOBER_SCENES.length;

interface StoryStageProps {
  lite: boolean;
  allowVideo: boolean;
  /** -1 before the story, 0..3 for a scene, COUNT after it. */
  onSceneChange: (index: number) => void;
}

export function StoryStage({ lite, allowVideo, onSceneChange }: StoryStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value <= 0 ? -1 : value >= 1 ? COUNT : Math.min(COUNT - 1, Math.floor(value * COUNT));
    setActive((previous) => (previous === next ? previous : next));
  });

  useEffect(() => onSceneChange(active), [active, onSceneChange]);

  const focus = Math.min(COUNT - 1, Math.max(0, active));
  const fadeOut = useTransform(scrollYProgress, (p) => segment(p * COUNT - (COUNT - 1), 0.84, 1));
  const chromeOpacity = useTransform(fadeOut, (f) => 1 - f);

  return (
    <section id="october-story" ref={ref} className={styles.story} aria-label="أربع خدمات في تجربة واحدة">
      <div className={styles.stage}>
        {OCTOBER_SCENES.map((scene, index) => (
          <Scene
            key={scene.id}
            scene={scene}
            index={index}
            progress={scrollYProgress}
            active={active === index || (index === 0 && active === -1)}
            near={Math.abs(index - focus) <= 1 && active < COUNT}
            lite={lite}
            allowVideo={allowVideo}
          />
        ))}
        <motion.div className={styles.stageFade} style={{ opacity: fadeOut }} aria-hidden="true" />
        <motion.div style={{ opacity: chromeOpacity }}>
          <SceneProgress active={focus} progress={scrollYProgress} />
        </motion.div>
      </div>
    </section>
  );
}

interface SceneProps {
  scene: OctoberScene;
  index: number;
  progress: MotionValue<number>;
  active: boolean;
  near: boolean;
  lite: boolean;
  allowVideo: boolean;
}

function Scene({ scene, index, progress, active, near, lite, allowVideo }: SceneProps) {
  const local = useTransform(progress, (p) => p * COUNT - index);
  const last = index === COUNT - 1;
  const depth = lite ? 0.4 : 1;

  const visibility = useTransform(local, (l) => (l < -0.001 || l > (last ? 2 : 1.3) ? "hidden" : "visible"));

  const clipPath = useTransform(local, (l) => {
    if (scene.id === "beard") return `inset(0 0 0 ${(1 - easeInOut(segment(l, 0, 0.2))) * 100}%)`;
    if (scene.id === "oil-bath") return `circle(${easeOut(segment(l, 0.08, 0.26)) * 150}% at 50% 56%)`;
    return "inset(0 0 0 0)";
  });
  const contentOpacity = useTransform(local, (l) => (scene.id === "skincare" ? segment(l, 0.08, 0.18) : 1));
  const darkness = useTransform(local, (l) => (index === 0 ? 1 - segment(l, 0, 0.16) : 0));

  const mediaScale = useTransform(local, (l) => 1 + (0.16 - segment(l, 0, 1) * 0.14) * depth);
  const mediaY = useTransform(local, (l) => `${(0.5 - segment(l, 0, 1)) * 8 * depth}%`);

  const exit = (l: number) => 1 - segment(l, 0.82, 0.97);
  const numberOpacity = useTransform(local, (l) => segment(l, 0.18, 0.3) * exit(l));
  const numberX = useTransform(local, (l) => `${(1 - easeOut(segment(l, 0.18, 0.4))) * 18 * depth}vw`);
  const titleY = useTransform(local, (l) => `${(1 - easeOut(segment(l, 0.24, 0.4))) * 110}%`);
  const titleOpacity = useTransform(local, (l) => exit(l));
  const lineOpacity = useTransform(local, (l) => segment(l, 0.36, 0.48) * exit(l));
  const copyY = useTransform(local, (l) => `${(segment(l, 0.36, 0.5) * -1 - segment(l, 0.82, 0.97)) * 24 * depth}px`);

  return (
    <motion.article
      className={styles.scene}
      style={{ zIndex: index + 1, visibility }}
      aria-labelledby={`scene-${scene.id}`}
    >
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
            <motion.h2 id={`scene-${scene.id}`} className={styles.sceneTitle} dir="ltr" lang="en" style={{ y: titleY, opacity: titleOpacity }}>
              {scene.title}
            </motion.h2>
          </div>
          <motion.p className={styles.sceneLine} style={{ opacity: lineOpacity, y: copyY }}>
            {scene.line}
          </motion.p>
        </div>
        {index === 0 && <motion.div className={styles.darkness} style={{ opacity: darkness }} />}
      </motion.div>

      <SceneEntry scene={scene} local={local} />
    </motion.article>
  );
}

/** Unclipped transition layers drawn above the previous scene. */
function SceneEntry({ scene, local }: { scene: OctoberScene; local: MotionValue<number> }) {
  const bladeX = useTransform(local, (l) => `${(1 - easeInOut(segment(l, 0, 0.2))) * 100}vw`);
  const bladeOpacity = useTransform(local, (l) => (l > 0 && l < 0.2 ? 1 : 0));

  const dropY = useTransform(local, (l) => `${-12 + easeInOut(segment(l, 0, 0.1)) * 66}dvh`);
  const dropOpacity = useTransform(local, (l) => (l > 0 && l < 0.11 ? 1 : 0));
  const rippleScale = useTransform(local, (l) => 0.2 + segment(l, 0.09, 0.24) * 3);
  const rippleOpacity = useTransform(local, (l) => (l > 0.09 ? 0.7 * (1 - segment(l, 0.09, 0.24)) : 0));

  const steamOpacity = useTransform(local, (l) => segment(l, 0, 0.12) * (1 - segment(l, 0.16, 0.32)));
  const steamY = useTransform(local, (l) => `${(1 - segment(l, 0, 0.32)) * 20}%`);

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
  if (scene.id === "skincare") {
    return (
      <motion.div className={styles.steam} style={{ opacity: steamOpacity, y: steamY }} aria-hidden="true">
        <span />
        <span />
        <span />
      </motion.div>
    );
  }
  return null;
}

function SceneProgress({ active, progress }: { active: number; progress: MotionValue<number> }) {
  const fill = useTransform(progress, (p) => Math.max(0.02, p));
  return (
    <nav className={styles.progress} aria-label="فصول التجربة">
      <ol>
        {OCTOBER_SCENES.map((scene, index) => (
          <li key={scene.id} className={index === active ? styles.progressActive : index < active ? styles.progressDone : undefined} aria-current={index === active ? "step" : undefined}>
            <span dir="ltr">{scene.number}</span>
            <span className="sr-only">{scene.label}</span>
          </li>
        ))}
      </ol>
      <motion.span className={styles.progressFill} style={{ scaleX: fill }} aria-hidden="true" />
    </nav>
  );
}

/** Reduced-motion story: one still scene per screen with simple crossfades. */
export function StoryStatic({ allowVideo }: { allowVideo: boolean }) {
  return (
    <section id="october-story" aria-label="أربع خدمات في تجربة واحدة">
      {OCTOBER_SCENES.map((scene) => (
        <StaticScene key={scene.id} scene={scene} allowVideo={allowVideo} />
      ))}
    </section>
  );
}

function StaticScene({ scene, allowVideo }: { scene: OctoberScene; allowVideo: boolean }) {
  const local = useMotionValue(0.6);
  return (
    <motion.article
      className={`${styles.staticScene} ${styles[`tone-${scene.id}`]}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ amount: 0.4, once: true }}
      transition={{ duration: 0.6 }}
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
