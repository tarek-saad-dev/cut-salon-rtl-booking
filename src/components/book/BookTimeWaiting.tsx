"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors } from "lucide-react";

type BookTimeWaitingProps = {
  label: string;
  lang?: "ar" | "en";
  /** Compact for slots loading under the date strip. */
  compact?: boolean;
  /** Waiting copy tone — confirm uses booking-confirm jokes. */
  tone?: "slots" | "confirm";
};

function StraightRazor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M10 34c0 0 2.5-8 8-12l14-10c2-1.4 4.8-.8 6 1.4 1.2 2.2.4 4.9-1.7 6.1L22.5 29.5C18 32.5 12.5 34 10 34Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M34 14.5l4.5-3.2c1.4-1 3.4-.5 4.2 1 .8 1.5.2 3.4-1.3 4.2L37 19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 33.5c2.5 1.5 5.5 1.2 8-.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="11" cy="35.5" r="2.2" fill="currentColor" />
    </svg>
  );
}

function CutMark({ small }: { small?: boolean }) {
  return (
    <div className="select-none text-center">
      <div className="flex items-center justify-center gap-0.5">
        <span className={`${small ? "text-xs" : "text-sm"} font-black tracking-widest text-cut-bronze`}>
          —
        </span>
        <div>
          <p
            className={`font-brand font-black leading-none tracking-[0.18em] text-cut-black ${
              small ? "text-base" : "text-lg"
            }`}
          >
            CUT
          </p>
          <p
            className={`-mt-0.5 font-semibold tracking-[0.4em] text-cut-burgundy ${
              small ? "text-[6px]" : "text-[7px]"
            }`}
          >
            SALON
          </p>
        </div>
        <span className={`${small ? "text-xs" : "text-sm"} font-black tracking-widest text-cut-bronze`}>
          —
        </span>
      </div>
    </div>
  );
}

/** Mouse path — zip around the playground. */
const MOUSE_X = ["8%", "72%", "58%", "12%", "78%", "40%", "8%"];
const MOUSE_Y = ["12%", "18%", "62%", "58%", "42%", "8%", "12%"];
const MOUSE_ROT = [0, 18, -12, 8, -20, 10, 0];

/** Cat 1 (scissors) — same route, always a beat behind. */
const CAT1_X = ["8%", "8%", "72%", "58%", "12%", "78%", "40%", "8%"];
const CAT1_Y = ["12%", "12%", "18%", "62%", "58%", "42%", "8%", "12%"];

/** Cat 2 (razor) — cuts across / ambushes from the other side. */
const CAT2_X = ["78%", "20%", "70%", "18%", "62%", "10%", "78%"];
const CAT2_Y = ["58%", "48%", "10%", "20%", "62%", "40%", "58%"];

const QUIPS_AR = [
  "والله دقيقة وهرد عليك… بس دقيقة بس والله.",
  "ثواني… بشوفلك ميعاد حلو.",
  "استنى… بندورلك على أحلى سلات في اليوم.",
  "مش هتطول… بس خلينا نرتب الكرسي الأول.",
  "دقيقة واحدة… المقص لسه بيلحق اللوجو.",
  "هوه… لقيتلك حاجة، ثواني أكد.",
  "والله بنحاول، بس السيستم بيقلع زي الزبون المتأخر.",
  "قربنا… متقلقش، مش هنفوتك الميعاد.",
  "بس لحظة… بنشوف مين فاضي ومين بيعمل ستايل.",
  "كمان ثواني… ونجيبلك المواعيد على طبق من ذهب.",
];

const QUIPS_EN = [
  "One sec, I swear… just one sec, wallahi.",
  "Hang on… hunting you a sweet time slot.",
  "Almost there… lining up the nicest openings.",
  "Won’t be long… just fixing the chair first.",
  "One minute… scissors are still chasing the logo.",
  "Ooh, found something — confirming real quick.",
  "Trying hard… the system’s slower than a late client.",
  "Nearly done — we won’t let the good slot slip.",
  "One moment… checking who’s free and who’s styling.",
  "Just a sec… serving your times on a silver tray.",
];

const QUIPS_CONFIRM_AR = [
  "والله دقيقة وبأكدلك الحجز… بس دقيقة بس والله.",
  "ثواني… بنقفللك الميعاد قبل ما حد يسبقه.",
  "استنى… بنكتب اسمك في الكرسي الذهبي.",
  "قربنا… المقص لسه بيلاحق اللوجو وأحنا بنأكد.",
  "هوه… الحجز على وشك يتثبت، ثواني.",
  "مش هتطول… بنسلّم الحجز للموسى عشان يمضيه.",
];

const QUIPS_CONFIRM_EN = [
  "One sec — locking in your booking, wallahi.",
  "Hang on… sealing the slot before anyone snags it.",
  "Almost… writing your name on the golden chair.",
  "Nearly there… scissors chase the logo while we confirm.",
  "Ooh — booking’s about to stick. One moment.",
  "Won’t be long… handing it to the razor for a stamp.",
];

export function BookTimeWaiting({
  label,
  lang = "ar",
  compact = false,
  tone = "slots",
}: BookTimeWaitingProps) {
  const quips =
    tone === "confirm"
      ? lang === "ar"
        ? QUIPS_CONFIRM_AR
        : QUIPS_CONFIRM_EN
      : lang === "ar"
        ? QUIPS_AR
        : QUIPS_EN;
  const [quipIndex, setQuipIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQuipIndex((i) => (i + 1) % quips.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [quips.length]);

  const icon = compact ? "h-8 w-8" : "h-9 w-9";
  const stageClass = useMemo(
    () =>
      compact
        ? "relative h-36 w-full max-w-sm overflow-hidden rounded-2xl border border-cut-black/8 bg-cut-warm-paper/40"
        : "relative h-44 w-full max-w-md overflow-hidden rounded-2xl border border-cut-black/8 bg-cut-warm-paper/40",
    [compact],
  );

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-10" : "px-5 py-14"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={stageClass}>
        {/* Floor shadow track */}
        <div className="pointer-events-none absolute inset-x-4 bottom-3 h-10 rounded-[100%] bg-cut-burgundy/5 blur-md" />

        {/* Dust puffs when someone "skids" */}
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-cut-bronze/70"
            style={{ left: `${15 + i * 22}%`, top: `${30 + (i % 3) * 18}%` }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.3, 1.4, 0.2], y: [0, -10, -2] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.45,
              ease: "easeOut",
            }}
          />
        ))}

        {/* CAT: scissors chasing */}
        <motion.div
          className="absolute z-10 text-cut-burgundy drop-shadow-sm"
          animate={{ left: CAT1_X, top: CAT1_Y, rotate: [12, 25, -10, 30, 5, -15, 12] }}
          transition={{
            duration: 5.2,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.14, 0.32, 0.48, 0.64, 0.82, 1],
          }}
          style={{ left: CAT1_X[0], top: CAT1_Y[0] }}
        >
          <motion.div
            animate={{ scaleY: [1, 0.82, 1, 0.88, 1], rotate: [0, -8, 0, 8, 0] }}
            transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
          >
            <Scissors className={icon} strokeWidth={1.85} />
          </motion.div>
        </motion.div>

        {/* CAT: razor cutting across */}
        <motion.div
          className="absolute z-10 text-cut-black drop-shadow-sm"
          animate={{
            left: CAT2_X,
            top: CAT2_Y,
            rotate: [-25, 15, -30, 20, -10, 28, -25],
            scaleX: [1, 1, -1, -1, 1, 1, 1],
          }}
          transition={{
            duration: 4.6,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.16, 0.34, 0.52, 0.7, 0.86, 1],
          }}
          style={{ left: CAT2_X[0], top: CAT2_Y[0] }}
        >
          <StraightRazor className={icon} />
        </motion.div>

        {/* MOUSE: logo fleeing */}
        <motion.div
          className="absolute z-20"
          animate={{
            left: MOUSE_X,
            top: MOUSE_Y,
            rotate: MOUSE_ROT,
            scale: [1, 0.96, 1.04, 0.98, 1.05, 0.97, 1],
          }}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.16, 0.34, 0.5, 0.68, 0.84, 1],
          }}
          style={{ left: MOUSE_X[0], top: MOUSE_Y[0] }}
        >
          <motion.div
            className="rounded-xl border border-cut-black/10 bg-cut-ivory px-2.5 py-1.5 shadow-[0_6px_18px_rgba(74,0,15,0.14)]"
            animate={{ y: [0, -3, 0, -2, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
          >
            <CutMark small={compact} />
          </motion.div>
          {/* sweat drop when "almost caught" */}
          <motion.span
            className="absolute -end-1 -top-1 text-[10px] text-cut-burgundy"
            animate={{ opacity: [0, 1, 0], y: [0, 6, 10] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
          >
            •
          </motion.span>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={quipIndex}
          className="mt-4 min-h-[3.25rem] max-w-sm px-2 text-[13px] font-medium leading-6 text-cut-burgundy/85"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {quips[quipIndex]}
        </motion.p>
      </AnimatePresence>

      <motion.p
        className="mt-1.5 max-w-xs text-sm font-medium text-cut-black/55"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.p>
    </div>
  );
}
