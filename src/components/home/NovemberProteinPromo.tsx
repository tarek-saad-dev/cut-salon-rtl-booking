"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  isNovemberCampaignActive,
  novemberProteinOffer,
} from "@/config/novemberProteinOffer";
import styles from "./novemberProteinPromo.module.css";

export const NOVEMBER_PROMO_HREF = novemberProteinOffer.href;
export const NOVEMBER_PROMO_DISMISS_KEY = "cut_november_protein_promo_dismissed";
export const NOVEMBER_PROMO_TIMING = {
  showAfterMs: 1200,
} as const;

const COPY = {
  ar: {
    region: "عرض نوفمبر",
    brand: "CUT SALON",
    eyebrow: "سبيشال البروتين",
    title: "عرض نوفمبر",
    subtitle: "قص شعر · بروتين · فوط · ماسك عناية",
    priceValue: String(novemberProteinOffer.price),
    priceUnit: "جنيه",
    cta: "احجز العرض",
    dismiss: "إخفاء",
  },
  en: {
    region: "November offer",
    brand: "CUT SALON",
    eyebrow: "Protein Special",
    title: "November Offer",
    subtitle: "Haircut · Protein · Towels · Care Mask",
    priceValue: String(novemberProteinOffer.price),
    priceUnit: "EGP",
    cta: "Book the offer",
    dismiss: "Dismiss",
  },
} as const;

function wasDismissed() {
  try {
    return sessionStorage.getItem(NOVEMBER_PROMO_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Compact premium dock — primary monthly campaign on home (replaces October gift). */
export default function NovemberProteinPromo() {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang] ?? COPY.ar;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNovemberCampaignActive() || wasDismissed()) return;
    const timer = window.setTimeout(() => setVisible(true), NOVEMBER_PROMO_TIMING.showAfterMs);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(NOVEMBER_PROMO_DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.dock} role="region" aria-label={copy.region} lang={lang} dir={dir}>
      <div className={styles.card} data-november-promo data-lang={lang}>
        <div className={styles.glow} aria-hidden />
        <button type="button" className={styles.dismiss} onClick={dismiss} aria-label={copy.dismiss}>
          <X className="size-4" strokeWidth={2} />
        </button>

        <div className={styles.header}>
          <p className={styles.brand}>{copy.brand}</p>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
        </div>

        <h2 className={styles.title}>{copy.title}</h2>
        <p className={styles.subtitle}>{copy.subtitle}</p>

        <div className={styles.priceRow}>
          <strong className={styles.priceValue} dir="ltr">
            {copy.priceValue}
          </strong>
          <span className={styles.priceUnit}>{copy.priceUnit}</span>
        </div>

        <Link href={NOVEMBER_PROMO_HREF} className={styles.cta}>
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
