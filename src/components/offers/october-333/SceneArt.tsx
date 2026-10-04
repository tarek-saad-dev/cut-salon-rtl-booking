"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { OctoberSceneId } from "@/config/octoberOffer";
import { segment } from "./motion";
import styles from "./experience.module.css";

const JAW_PATH = "M40 70 C 46 150, 78 214, 150 236 C 222 214, 254 150, 260 70";
const MOUSTACHE_PATH = "M104 132 C 124 120, 140 122, 150 130 C 160 122, 176 120, 196 132";

/** Built-in cinematic art used while a scene has no uploaded video/poster. */
export function SceneArt({ id, local, still }: { id: OctoberSceneId; local: MotionValue<number>; still: boolean }) {
  const drift = useTransform(local, (l) => (still ? "0%" : `${-l * 12}%`));
  const cutLine = useTransform(local, (l) => (still ? "58%" : `${72 - segment(l, 0.1, 0.9) * 30}%`));
  const draw = useTransform(local, (l) => (still ? 1 : segment(l, 0.14, 0.55)));
  const glow = useTransform(local, (l) => (still ? 0.6 : segment(l, 0.45, 0.7) * 0.6));

  if (id === "haircut") {
    return (
      <div className={`${styles.art} ${styles.artHaircut}`}>
        <motion.div className={styles.strands} style={{ x: drift }} />
        <div className={styles.fade} />
        <motion.div className={styles.bladeLight} style={{ top: cutLine }} />
      </div>
    );
  }

  if (id === "beard") {
    return (
      <div className={`${styles.art} ${styles.artBeard}`}>
        <motion.div className={styles.beardGlow} style={{ opacity: glow }} />
        <svg className={styles.beardSvg} viewBox="0 0 300 260" fill="none">
          <line x1="150" y1="20" x2="150" y2="250" className={styles.symmetryAxis} />
          <motion.path d={JAW_PATH} className={styles.beardLine} style={{ pathLength: draw }} />
          <motion.path d={MOUSTACHE_PATH} className={styles.beardLine} style={{ pathLength: draw }} />
        </svg>
      </div>
    );
  }

  if (id === "oil-bath") {
    return (
      <div className={`${styles.art} ${styles.artOil}`}>
        <motion.div className={styles.caustic} style={{ x: drift }} />
        <div className={styles.causticAlt} />
        <div className={styles.oilSheen} />
      </div>
    );
  }

  return (
    <div className={`${styles.art} ${styles.artSkin}`}>
      <motion.div className={styles.mist} style={{ x: drift }} />
      <div className={styles.cleanLight} />
    </div>
  );
}
