"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import { octoberMediaUrl, octoberOffer as offer } from "@/config/octoberOffer";
import { SceneMedia } from "./SceneMedia";
import { easeInOut, segment } from "./motion";
import styles from "./experience.module.css";

export const OPENING_LINES = {
  tribute: "أكتوبر… حكاية انتصار.",
  handoff: "وفي CUT… بنحتفل بطريقتنا.",
} as const;

interface OpeningSceneProps {
  local: MotionValue<number>;
  visibility: MotionValue<string>;
  started: boolean;
  allowVideo: boolean;
  onStart: () => void;
}

/** 0–2 s archival dark · 2–4 s restrained flag + tribute · 4–6 s handoff to CUT. */
export function OpeningScene({ local, visibility, started, allowVideo, onStart }: OpeningSceneProps) {
  const grain = useTransform(local, (l) => 0.1 + segment(l, 0, 0.2) * 0.35 - segment(l, 0.7, 1) * 0.25);
  const flagReveal = useTransform(local, (l) => {
    const e = easeInOut(segment(l, 0.3, 0.52));
    return `inset(${(1 - e) * 50}% 0 ${(1 - e) * 50}% 0)`;
  });
  const flagOpacity = useTransform(local, (l) => 0.9 - segment(l, 0.6, 0.8) * 0.72);
  const sweep = useTransform(local, (l) => `${-70 + segment(l, 0.34, 0.74) * 170}%`);
  const folds = useTransform(local, (l) => `${-segment(l, 0, 1) * 12}%`);
  const tribute = useTransform(local, (l) => segment(l, 0.38, 0.48) * (1 - segment(l, 0.6, 0.66)));
  const tributeY = useTransform(local, (l) => `${(1 - segment(l, 0.38, 0.5)) * 14}px`);
  const handoff = useTransform(local, (l) => segment(l, 0.66, 0.74));
  const handoffY = useTransform(local, (l) => `${(1 - segment(l, 0.66, 0.76)) * 14}px`);
  const title = useTransform(local, (l) => segment(l, 0.78, 0.86));
  const video = octoberMediaUrl(offer.opening.video);
  const poster = octoberMediaUrl(offer.opening.poster);

  return (
    <motion.section className={styles.scene} style={{ zIndex: 1, visibility }} aria-labelledby="october-title">
      <div className={styles.openingBase} />
      {(video || poster) && (
        <motion.div className={styles.openingMedia} style={{ opacity: flagOpacity }}>
          <SceneMedia video={video} poster={poster} active={started} near allowVideo={allowVideo} slotName={offer.opening.video} fallback={null} />
        </motion.div>
      )}
      {!video && !poster && (
        <motion.div className={styles.flag} style={{ clipPath: flagReveal, opacity: flagOpacity }} aria-hidden="true">
          <span className={styles.flagRed} />
          <span className={styles.flagWhite} />
          <span className={styles.flagBlack} />
          <motion.span className={styles.flagFolds} style={{ x: folds }} />
          <motion.span className={styles.flagSweep} style={{ x: sweep }} />
        </motion.div>
      )}
      <div className={styles.openingVignette} />
      <motion.div className={styles.grain} style={{ opacity: grain }} aria-hidden="true" />

      <div className={styles.openingCopy}>
        <motion.p className={styles.openingTribute} style={{ opacity: tribute, y: tributeY }}>
          {OPENING_LINES.tribute}
        </motion.p>
        <motion.p className={styles.openingHandoff} style={{ opacity: handoff, y: handoffY }}>
          {OPENING_LINES.handoff}
        </motion.p>
        <motion.h1 id="october-title" className={styles.openingTitle} style={{ opacity: title }}>
          {offer.campaignName}
        </motion.h1>
      </div>

      <AnimatePresence>
        {!started && (
          <motion.div
            className={styles.gate}
            initial={false}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <p className={styles.gateLogo} dir="ltr" aria-hidden="true">
              CUT
            </p>
            <p className={styles.gateTitle}>{offer.campaignName}</p>
            <button type="button" className={styles.startButton} onClick={onStart}>
              ابدأ التجربة
            </button>
            <p className={styles.gateHint}>
              <span aria-hidden="true">🔊</span> تجربة بالصوت · أقل من دقيقة
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/** Reduced-motion opening: everything readable at once. */
export function OpeningStatic({ onStart }: { onStart: () => void }) {
  return (
    <section className={`${styles.staticScene} ${styles.openingStatic}`} aria-labelledby="october-title">
      <div className={styles.openingBase} />
      <div className={`${styles.flag} ${styles.flagStill}`} aria-hidden="true">
        <span className={styles.flagRed} />
        <span className={styles.flagWhite} />
        <span className={styles.flagBlack} />
      </div>
      <div className={styles.openingVignette} />
      <div className={styles.openingCopy}>
        <p className={styles.openingTribute}>{OPENING_LINES.tribute}</p>
        <p className={styles.openingHandoff}>{OPENING_LINES.handoff}</p>
        <h1 id="october-title" className={styles.openingTitle}>
          {offer.campaignName}
        </h1>
        <button type="button" className={styles.startButton} onClick={onStart}>
          ابدأ التجربة
        </button>
      </div>
    </section>
  );
}
