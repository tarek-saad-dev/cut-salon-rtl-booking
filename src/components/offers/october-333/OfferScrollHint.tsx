"use client";

import styles from "./experience.module.css";

export const OFFER_HINT_LABEL = "كمّل";

/** Stays mounted after it first appears so it can fade out instead of vanishing. */
export function OfferScrollHint({ visible, onNudge }: { visible: boolean; onNudge: () => void }) {
  return (
    <button
      type="button"
      className={styles.scrollHint}
      data-visible={visible}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={onNudge}
      aria-label={OFFER_HINT_LABEL}
    >
      <svg className={styles.scrollHintArrow} viewBox="0 0 20 40" aria-hidden="true">
        <path d="M10 2v35M3 29l7 8 7-8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.scrollHintLabel} aria-hidden="true">
        {OFFER_HINT_LABEL}
      </span>
    </button>
  );
}
