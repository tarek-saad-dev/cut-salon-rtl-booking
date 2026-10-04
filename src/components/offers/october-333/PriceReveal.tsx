"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { OCTOBER_SCENES, PRICE_IMPACT_AT as IMPACT, octoberOffer as offer } from "@/config/octoberOffer";
import { easeOut, segment } from "./motion";
import styles from "./experience.module.css";

interface PriceSceneProps {
  local: MotionValue<number>;
  visibility: MotionValue<string>;
  zIndex: number;
}

/** Near-black climax: services one by one → gather → 720 struck → pause → 333. */
export function PriceScene({ local: q, visibility, zIndex }: PriceSceneProps) {
  const sceneOpacity = useTransform(q, (v) => segment(v, 0, 0.08));

  const gather = useTransform(q, (v) => easeOut(segment(v, 0.36, 0.44)));
  const listY = useTransform(gather, (g) => `${g * -30}dvh`);
  const listScale = useTransform(gather, (g) => 1 - g * 0.48);
  const listDim = useTransform(gather, (g) => 1 - g * 0.35);

  const valueOpacity = useTransform(q, (v) => segment(v, 0.42, 0.48));
  const strike = useTransform(q, (v) => easeOut(segment(v, 0.5, 0.56)));
  const oldDim = useTransform(q, (v) => 1 - segment(v, 0.58, IMPACT) * 0.55);

  const priceOpacity = useTransform(q, (v) => segment(v, IMPACT, IMPACT + 0.03));
  const priceScale = useTransform(q, (v) => 1.5 - easeOut(segment(v, IMPACT, IMPACT + 0.1)) * 0.5);
  const flash = useTransform(q, (v) => 0.55 * segment(v, IMPACT - 0.005, IMPACT + 0.01) * (1 - segment(v, IMPACT + 0.01, IMPACT + 0.12)));
  const closingOpacity = useTransform(q, (v) => segment(v, 0.76, 0.84));

  return (
    <motion.section className={`${styles.scene} ${styles.reveal}`} style={{ zIndex, visibility, opacity: sceneOpacity }} aria-labelledby="october-price">
      <motion.div className={styles.revealFlash} style={{ opacity: flash }} aria-hidden="true" />

      <div className={styles.revealListAnchor}>
        <motion.ul className={styles.revealList} style={{ y: listY, scale: listScale, opacity: listDim }}>
          {OCTOBER_SCENES.map((scene, index) => (
            <RevealService key={scene.id} q={q} index={index} title={scene.title} label={scene.label} />
          ))}
        </motion.ul>
      </div>

      <div className={styles.revealValue}>
        <motion.div style={{ opacity: valueOpacity }}>
          <p className={styles.revealOldLabel}>القيمة الأصلية</p>
          <motion.p className={styles.revealOld} style={{ opacity: oldDim }}>
            <del className={styles.revealOldText}>
              <span dir="ltr">{offer.originalPrice}</span> {offer.currency}
              <motion.span className={styles.strike} style={{ scaleX: strike }} aria-hidden="true" />
            </del>
          </motion.p>
        </motion.div>

        <motion.div className={styles.revealPrice} style={{ opacity: priceOpacity, scale: priceScale }}>
          <h2 id="october-price" className={styles.priceNumber}>
            <span dir="ltr">{offer.price}</span>
            <span className={styles.priceCurrency}>{offer.currency}</span>
          </h2>
        </motion.div>

        <motion.div className={styles.revealClosing} style={{ opacity: closingOpacity }}>
          <p className={styles.revealCampaign}>{offer.campaignName}</p>
          <p className={styles.revealTagline}>أربع خدمات. تجربة كاملة.</p>
        </motion.div>
      </div>
    </motion.section>
  );
}

function RevealService({ q, index, title, label }: { q: MotionValue<number>; index: number; title: string; label: string }) {
  const start = 0.08 + index * 0.07;
  const opacity = useTransform(q, (v) => segment(v, start, start + 0.05));
  const y = useTransform(q, (v) => `${(1 - easeOut(segment(v, start, start + 0.07))) * 28}px`);
  return (
    <motion.li className={styles.revealItem} style={{ opacity, y }}>
      <span dir="ltr" lang="en">{title}</span>
      <span className="sr-only">{label}</span>
    </motion.li>
  );
}

/** Reduced-motion reveal: the full result at once. */
export function PriceRevealStatic() {
  return (
    <section className={styles.revealStatic} aria-labelledby="october-price">
      <ul className={styles.revealList}>
        {OCTOBER_SCENES.map((scene) => (
          <li key={scene.id} className={styles.revealItem}>
            <span dir="ltr" lang="en">{scene.title}</span>
            <span className="sr-only">{scene.label}</span>
          </li>
        ))}
      </ul>
      <p className={styles.revealOldLabel}>القيمة الأصلية</p>
      <p className={styles.revealOld}>
        <del className={styles.revealOldText}>
          <span dir="ltr">{offer.originalPrice}</span> {offer.currency}
          <span className={styles.strike} aria-hidden="true" />
        </del>
      </p>
      <h2 id="october-price" className={styles.priceNumber}>
        <span dir="ltr">{offer.price}</span>
        <span className={styles.priceCurrency}>{offer.currency}</span>
      </h2>
      <p className={styles.revealCampaign}>{offer.campaignName}</p>
      <p className={styles.revealTagline}>أربع خدمات. تجربة كاملة.</p>
    </section>
  );
}
