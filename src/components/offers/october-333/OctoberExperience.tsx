"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  OCTOBER_BRANCHES,
  OCTOBER_SCENES,
  octoberMediaUrl,
  octoberOffer as offer,
} from "@/config/octoberOffer";
import { getOctoberSound } from "@/lib/offers/octoberSound";
import { SceneMedia } from "./SceneMedia";
import { StoryStage, StoryStatic } from "./StoryStage";
import { PriceReveal, PriceRevealStatic } from "./PriceReveal";
import styles from "./experience.module.css";

const ROUTE_CLASS = "cut-cinematic-route";

function useDeviceProfile() {
  const [profile, setProfile] = useState({ lite: false, allowVideo: true });
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const saveData = !!nav.connection?.saveData;
    setProfile({
      lite: saveData || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2,
      allowVideo: !saveData,
    });
  }, []);
  return profile;
}

function useSoundEnabled() {
  const sound = getOctoberSound();
  return useSyncExternalStore(sound.subscribe, sound.isEnabled, () => false);
}

export function OctoberExperience() {
  const reduced = !!useReducedMotion();
  const { lite, allowVideo } = useDeviceProfile();
  const soundOn = useSoundEnabled();

  useEffect(() => {
    document.documentElement.classList.add(ROUTE_CLASS);
    return () => document.documentElement.classList.remove(ROUTE_CLASS);
  }, []);

  useEffect(() => {
    const sound = getOctoberSound();
    // A session that already opted in still needs a fresh gesture before audio may start.
    const resume = () => {
      if (sound.isEnabled()) void sound.unlock();
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      sound.stopAll();
    };
  }, []);

  const enableSound = useCallback(async () => {
    const sound = getOctoberSound();
    await sound.unlock();
    sound.setEnabled(true);
    sound.prefetch(["intro", "clipper", "transition"]);
  }, []);

  const start = useCallback(async () => {
    await enableSound();
    getOctoberSound().play("intro");
    const story = document.getElementById("october-story");
    if (!story) return;
    const top = story.getBoundingClientRect().top + window.scrollY + (reduced ? 0 : window.innerHeight * 0.8);
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }, [enableSound, reduced]);

  const toggleSound = useCallback(() => {
    const sound = getOctoberSound();
    if (sound.isEnabled()) sound.setEnabled(false);
    else void enableSound();
  }, [enableSound]);

  const onSceneChange = useCallback((index: number) => {
    const sound = getOctoberSound();
    const scene = OCTOBER_SCENES[index];
    if (!scene) {
      sound.stopAmbient();
      return;
    }
    if (index < 2) sound.stopAmbient();
    sound.play(scene.sound);
    const next = OCTOBER_SCENES[index + 1];
    sound.prefetch(next ? [next.sound] : ["reveal"]);
  }, []);

  const onImpact = useCallback(() => getOctoberSound().play("reveal"), []);

  return (
    <main className={styles.experience} dir="rtl" lang="ar">
      <header className={styles.topBar}>
        <Link href="/" className={styles.wordmark} aria-label="CUT Salon — الرئيسية">
          CUT<span>SALON</span>
        </Link>
        <button
          type="button"
          className={styles.soundToggle}
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "إيقاف الصوت" : "تشغيل الصوت"}
        >
          <span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span>
        </button>
      </header>

      <Intro reduced={reduced} allowVideo={allowVideo} onStart={start} />

      {reduced ? <StoryStatic allowVideo={allowVideo} /> : <StoryStage lite={lite} allowVideo={allowVideo} onSceneChange={onSceneChange} />}

      {reduced ? <PriceRevealStatic /> : <PriceReveal onImpact={onImpact} />}

      <HowItWorks reduced={reduced} />
      <Branches />

      <footer className={styles.footer}>
        <p>الدفع وتفعيل العرض داخل فروع CUT فقط. لا يوجد دفع أو حجز للعرض أونلاين. تطبق شروط العرض.</p>
        <p dir="ltr">© {new Date().getFullYear()} CUT Salon</p>
      </footer>
    </main>
  );
}

function Intro({ reduced, allowVideo, onStart }: { reduced: boolean; allowVideo: boolean; onStart: () => void }) {
  const step = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.3 : 1.1, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });
  const introVideo = octoberMediaUrl(offer.intro.video);

  return (
    <section className={styles.intro} aria-labelledby="october-title">
      {introVideo && (
        <div className={styles.introMedia}>
          <SceneMedia video={introVideo} active near allowVideo={allowVideo && !reduced} slotName={offer.intro.video} fallback={null} />
        </div>
      )}
      <div className={styles.introSweep} aria-hidden="true" />

      <div className={styles.introInner}>
        <motion.p className={styles.introLogo} dir="ltr" aria-hidden="true" {...step(0.2)}>
          CUT
        </motion.p>
        <motion.p className={styles.introLine} {...step(0.9)}>
          أكتوبر له مكانة خاصة.
        </motion.p>
        <motion.p className={styles.introLine} {...step(2.1)}>
          وفي CUT… بنحتفل بطريقتنا.
        </motion.p>
        <motion.h1 id="october-title" className={styles.introTitle} {...step(3.1)}>
          {offer.campaignName}
        </motion.h1>
        <motion.div className={styles.introActions} {...step(3.6)}>
          <button type="button" className={styles.startButton} onClick={onStart}>
            ابدأ التجربة
          </button>
          <span className={styles.introHint}>
            <span aria-hidden="true">🔊</span> تجربة بالصوت
          </span>
        </motion.div>
      </div>

      <motion.div className={styles.scrollCue} aria-hidden="true" {...step(4.2)}>
        <span />
      </motion.div>
    </section>
  );
}

const STEPS = ["زور أقرب فرع CUT", "فعّل العرض وادفع قيمته في الفرع", "استخدم خدماتك خلال شهر أكتوبر"] as const;

function HowItWorks({ reduced }: { reduced: boolean }) {
  const reveal = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 0.9, delay },
        };

  return (
    <section className={styles.how} aria-labelledby="october-how">
      <p className={styles.eyebrow} dir="ltr">HOW IT WORKS</p>
      <h2 id="october-how" className={styles.howTitle}>
        العرض يبدأ من <time dateTime={offer.startsOn}>{offer.startsLabel}</time>
      </h2>

      <ol className={styles.steps}>
        {STEPS.map((text, index) => (
          <motion.li key={text} {...reveal(index * 0.15)}>
            <span className={styles.stepNumber} dir="ltr">{`0${index + 1}`}</span>
            <span>{text}</span>
          </motion.li>
        ))}
      </ol>

      <motion.div className={styles.howNote} {...reveal(0.2)}>
        <p className={styles.howNoteLead}>مش لازم تستخدم الأربع خدمات في نفس الزيارة.</p>
        <p>بمجرد تفعيل العرض في الفرع، تقدر تستفيد من خدماته خلال أكتوبر وفق شروط العرض.</p>
      </motion.div>

      <p className={styles.howFine}>لا يوجد دفع أو شراء أونلاين — التفعيل والدفع داخل الفرع.</p>
    </section>
  );
}

function Branches() {
  return (
    <section className={styles.branches} aria-labelledby="october-branches">
      <h2 id="october-branches" className={styles.branchesTitle}>
        جاهز تبدأ التجربة؟
      </h2>

      <ul className={styles.branchList}>
        {OCTOBER_BRANCHES.map((branch) => (
          <li key={branch.code} className={styles.branch}>
            <p className={styles.branchTag}>{branch.tag}</p>
            <h3 className={styles.branchName}>{branch.name}</h3>
            <p className={styles.branchAddress}>{branch.address}</p>
            <div className={styles.branchActions}>
              <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.textButton}>
                افتح اللوكيشن
              </a>
              <Link href={branch.bookHref} className={styles.textButton}>
                احجز في الفرع ده
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.finalActions}>
        <Link href={offer.bookHref} className={styles.primaryButton}>
          احجز زيارتك لـ CUT
        </Link>
        <a href={offer.whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>
          اسألنا عن عرض أكتوبر
        </a>
      </div>
    </section>
  );
}
