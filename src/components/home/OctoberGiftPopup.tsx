"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { octoberOffer } from "@/config/octoberOffer";
import styles from "./octoberGift.module.css";

export const OCTOBER_GIFT_HREF = "/offers/october-333";
export const OCTOBER_GIFT_DISMISS_KEY = "cut_october_gift_dismissed";
export const OCTOBER_GIFT_TIMING = {
  /** Lets the hero settle before the card slides in. */
  showAfterMs: 1400,
  /** Lid lifts and light escapes before the screen transition. */
  openMs: 650,
  /** Full-screen transition length before navigating. */
  leaveMs: 1150,
} as const;

/** Last moment the gift is offered: end of the campaign's final day in Cairo. */
const OFFER_ENDS_AT = new Date(`${octoberOffer.endsOn}T23:59:59+03:00`).getTime();

const COPY = {
  ar: {
    region: "هدية أكتوبر",
    eyebrow: "هدية أكتوبر من CUT",
    title: "احصل على عرض أكتوبر",
    hint: "افتح الصندوق واكتشف هديتك",
    open: "افتح الهدية",
    dismiss: "إخفاء",
    transition: "احتفال أكتوبر",
  },
  en: {
    region: "October gift",
    eyebrow: "An October gift from CUT",
    title: "Get the October offer",
    hint: "Open the box to reveal your gift",
    open: "Open the gift",
    dismiss: "Dismiss",
    transition: "احتفال أكتوبر",
  },
} as const;

type Phase = "hidden" | "shown" | "opening" | "leaving";

function wasDismissed() {
  try {
    return sessionStorage.getItem(OCTOBER_GIFT_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export default function OctoberGiftPopup() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { lang } = useLanguage();
  const copy = COPY[lang] ?? COPY.ar;
  const [phase, setPhase] = useState<Phase>("hidden");
  const [origin, setOrigin] = useState({ x: 50, y: 85 });
  const boxRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const pending = timers.current;
    if (Date.now() <= OFFER_ENDS_AT && !wasDismissed()) {
      routerRef.current.prefetch?.(OCTOBER_GIFT_HREF);
      pending.push(window.setTimeout(() => setPhase("shown"), OCTOBER_GIFT_TIMING.showAfterMs));
    }
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(OCTOBER_GIFT_DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setPhase("hidden");
  }, []);

  const open = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      if (phase !== "shown") return;
      if (reduced) {
        routerRef.current.push(OCTOBER_GIFT_HREF);
        return;
      }
      const rect = boxRef.current?.getBoundingClientRect();
      if (rect && window.innerWidth && window.innerHeight) {
        setOrigin({
          x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
          y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
        });
      }
      setPhase("opening");
      timers.current.push(
        window.setTimeout(() => setPhase("leaving"), OCTOBER_GIFT_TIMING.openMs),
        window.setTimeout(
          () => routerRef.current.push(OCTOBER_GIFT_HREF),
          OCTOBER_GIFT_TIMING.openMs + OCTOBER_GIFT_TIMING.leaveMs,
        ),
      );
    },
    [phase, reduced],
  );

  const opened = phase === "opening" || phase === "leaving";
  const at = `${origin.x}% ${origin.y}%`;

  return (
    <>
      <AnimatePresence>
        {phase !== "hidden" && (
          <motion.aside
            key="october-gift"
            aria-label={copy.region}
            className={styles.dock}
            data-october-gift
            data-phase={phase}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.96 }}
            transition={{ duration: reduced ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.card}>
              <span className={styles.sheen} aria-hidden="true" />
              {!opened && (
                <button type="button" className={styles.close} onClick={dismiss} aria-label={copy.dismiss}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <a href={OCTOBER_GIFT_HREF} className={styles.action} onClick={open} aria-label={`${copy.title} — ${copy.open}`}>
                <span ref={boxRef} className={styles.boxWrap} data-opened={opened || undefined} aria-hidden="true">
                  <span className={styles.burst} />
                  <GiftBox opened={opened} reduced={Boolean(reduced)} />
                </span>
                <span className={styles.text}>
                  <span className={styles.eyebrow}>{copy.eyebrow}</span>
                  <span className={styles.title}>{copy.title}</span>
                  <span className={styles.hint}>{copy.hint}</span>
                </span>
                <span className={styles.cta}>{copy.open}</span>
              </a>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "leaving" && (
          <motion.div
            key="october-gift-transition"
            className={styles.curtain}
            data-october-gift-transition
            aria-hidden="true"
            initial={{ clipPath: `circle(0% at ${at})` }}
            animate={{ clipPath: `circle(150% at ${at})` }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            style={{ ["--gift-x" as string]: `${origin.x}%`, ["--gift-y" as string]: `${origin.y}%` }}
          >
            <span className={styles.curtainGlow} />
            <motion.span
              className={styles.barTop}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className={styles.barBottom}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className={styles.curtainTitle}
              lang="ar"
              initial={{ opacity: 0, letterSpacing: "0.3em", filter: "blur(8px)" }}
              animate={{ opacity: [0, 1, 1, 0], letterSpacing: "0.04em", filter: "blur(0px)" }}
              transition={{ delay: 0.3, duration: 0.85, times: [0, 0.35, 0.75, 1] }}
            >
              {copy.transition}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function GiftBox({ opened, reduced }: { opened: boolean; reduced: boolean }) {
  return (
    <svg className={styles.box} viewBox="0 0 64 64" focusable="false">
      <defs>
        <linearGradient id="gift-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b0a1d" />
          <stop offset="1" stopColor="#2f050c" />
        </linearGradient>
        <linearGradient id="gift-ribbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d98a" />
          <stop offset="1" stopColor="#b8892b" />
        </linearGradient>
      </defs>
      <rect x="10" y="30" width="44" height="28" rx="3" fill="url(#gift-body)" />
      <rect x="29" y="30" width="6" height="28" fill="url(#gift-ribbon)" />
      <motion.g
        initial={false}
        animate={opened && !reduced ? { y: -18, rotate: -16, opacity: 0.0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: "20%", originY: "100%" }}
      >
        <rect x="7" y="21" width="50" height="11" rx="2.5" fill="#7d0f25" />
        <rect x="29" y="21" width="6" height="11" fill="url(#gift-ribbon)" />
        <path d="M32 21c-3-7-12-9-12-3 0 3 6 3 12 3Z" fill="url(#gift-ribbon)" />
        <path d="M32 21c3-7 12-9 12-3 0 3-6 3-12 3Z" fill="url(#gift-ribbon)" />
      </motion.g>
    </svg>
  );
}
