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

function StickyMan({ className }: { className?: string }) {
  // Fixed SVG paths only — never morph `d` (incompatible cubic morphs flood
  // the console with "Unexpected end of attribute" every animation frame).
  return (
    <svg viewBox="0 0 48 64" fill="none" className={className} aria-hidden>
      {/* head */}
      <circle cx="24" cy="10" r="7" stroke="currentColor" strokeWidth="2.4" />
      {/* body */}
      <path d="M24 17v20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* left arm — flail via rotate, fixed path */}
      <motion.g
        style={{ transformOrigin: "24px 26px" }}
        animate={{ rotate: [-28, 18, -28] }}
        transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M24 26c-7-2-11 2-14 8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </motion.g>
      {/* right arm */}
      <motion.g
        style={{ transformOrigin: "24px 26px" }}
        animate={{ rotate: [28, -18, 28] }}
        transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut", delay: 0.08 }}
      >
        <path
          d="M24 26c7-2 11 2 14 8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </motion.g>
      {/* left leg — run cycle via rotate, fixed path */}
      <motion.g
        style={{ transformOrigin: "24px 37px" }}
        animate={{ rotate: [22, -26, 22] }}
        transition={{ duration: 0.28, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M24 37c-5 6-7 14-6 20"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </motion.g>
      {/* right leg */}
      <motion.g
        style={{ transformOrigin: "24px 37px" }}
        animate={{ rotate: [-22, 26, -22] }}
        transition={{ duration: 0.28, repeat: Infinity, ease: "easeInOut", delay: 0.14 }}
      >
        <path
          d="M24 37c5 6 7 14 6 20"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/** Sticky Man flees — zip around the playground. */
const STICKY_X = ["8%", "72%", "58%", "12%", "78%", "40%", "8%"];
const STICKY_Y = ["12%", "18%", "62%", "58%", "42%", "8%", "12%"];
const STICKY_ROT = [0, 12, -10, 8, -16, 10, 0];
const STICKY_FLIP = [1, 1, -1, -1, 1, 1, 1];

/** Cat 1 (scissors) — same route, always a beat behind. */
const CAT1_X = ["8%", "8%", "72%", "58%", "12%", "78%", "40%", "8%"];
const CAT1_Y = ["12%", "12%", "18%", "62%", "58%", "42%", "8%", "12%"];

/** Cat 2 (razor) — cuts across / ambushes from the other side. */
const CAT2_X = ["78%", "20%", "70%", "18%", "62%", "10%", "78%"];
const CAT2_Y = ["58%", "48%", "10%", "20%", "62%", "40%", "58%"];

const QUIPS_AR = [
  "نجهّز لك أفضل المواعيد المتاحة…",
  "لحظة من فضلك… نرتّب اليوم بما يناسبك.",
  "ثوانٍ… نبحث عن أنسب موعد لك.",
  "اقتربنا… نختار موعدًا يناسب يومك.",
  "انتظر قليلًا… نراجع المواعيد المتاحة في الفرع.",
  "قريبًا… ستظهر المواعيد أمامك.",
  "ثوانٍ… نبحث لك عن موعد مناسب.",
  "لن يطول الأمر… نجهّز التفاصيل أولًا.",
  "دقيقة واحدة… Sticky Man يركض والمقص خلفه!",
  "وجدنا خيارًا مناسبًا… نؤكده الآن.",
  "نعمل على الأمر… النظام يستغرق لحظات إضافية.",
  "اقتربنا… لن نفوت عليك الموعد المناسب.",
  "لحظة… Sticky Man دار عند المرآة وسبقهم.",
  "ثوانٍ إضافية… ونعرض المواعيد بأجمل صورة.",
  "ثوانٍ… Sticky Man يهرب من المقص والموسى الآن.",
  "انتظر قليلًا… Sticky Man يتجاوز العمود وهم خلفه.",
  "دقيقة… Sticky Man يقول «لن تلحقوني!» ويكمل الجري.",
  "اقتربنا… Sticky Man لا يزال سابقًا بمسافة بسيطة.",
];

const QUIPS_EN = [
  "Preparing the best available times for you…",
  "One moment, please… arranging the day to suit you.",
  "Just a moment… finding the most suitable slot.",
  "Almost there… choosing a time that fits your day.",
  "Please wait… reviewing available appointments at the branch.",
  "Nearly ready… your times will appear shortly.",
  "One moment… looking for a suitable appointment.",
  "This won’t take long… preparing the details first.",
  "One minute… Sticky Man is sprinting — scissors on his tail!",
  "We found a good option… confirming it now.",
  "Working on it… the system needs a few extra moments.",
  "Almost there… we won’t let the right slot slip away.",
  "One moment… Sticky Man spun by the mirror and got ahead.",
  "Just a moment more… presenting your times beautifully.",
  "One moment… Sticky Man’s fleeing the scissors and razor.",
  "Please wait… Sticky Man just passed the pole — chase continues.",
  "A minute… Sticky Man says “you won’t catch me!” and keeps running.",
  "Almost… Sticky Man is still slightly ahead.",
];

const QUIPS_CONFIRM_AR = [
  "نثبّت حجزك الآن… لحظات من فضلك.",
  "لحظة… نؤكد الموعد قبل أن يتاح لغيرك.",
  "اقتربنا… نجهّز تأكيد الحجز.",
  "انتظر قليلًا… نراجع تفاصيل الموعد معك.",
  "قريبًا… سيتم تأكيد حجزك.",
  "ثوانٍ… نحجز الموعد قبل أن يسبقه أحد.",
  "لحظة… نسجّل اسمك على الموعد.",
  "اقتربنا… Sticky Man يركض والمقص خلفه ونحن نؤكد.",
  "الحجز على وشك الاكتمال… ثوانٍ.",
  "لن يطول… نُكمل إجراءات التأكيد.",
  "ثوانٍ… Sticky Man يسبقهم حتى يتأكد الحجز.",
  "انتظر… Sticky Man تجاوز الموسى بخطوة.",
  "اقتربنا… Sticky Man لا يزال في المقدمة أثناء التأكيد.",
];

const QUIPS_CONFIRM_EN = [
  "Confirming your booking now… a moment, please.",
  "One moment… securing the appointment before it’s taken.",
  "Almost there… preparing your confirmation.",
  "Please wait… reviewing your appointment details.",
  "Nearly ready… your booking is about to confirm.",
  "One moment… locking the slot before anyone else.",
  "A moment… recording your name on the appointment.",
  "Almost… Sticky Man runs while scissors chase — we confirm.",
  "Your booking is nearly complete… just seconds.",
  "This won’t take long… finishing confirmation.",
  "One moment… Sticky Man stays ahead until the booking locks.",
  "Please wait… Sticky Man just slipped past the razor.",
  "Almost… Sticky Man is still ahead while we confirm.",
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
  const stickySize = compact ? "h-11 w-8" : "h-14 w-10";
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

        {/* Sticky Man fleeing the scissors & razor */}
        <motion.div
          className="absolute z-20 text-cut-burgundy"
          animate={{
            left: STICKY_X,
            top: STICKY_Y,
            rotate: STICKY_ROT,
            scaleX: STICKY_FLIP,
          }}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.16, 0.34, 0.5, 0.68, 0.84, 1],
          }}
          style={{ left: STICKY_X[0], top: STICKY_Y[0] }}
        >
          <motion.div
            className="relative"
            animate={{ y: [0, -4, 0, -3, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <StickyMan className={stickySize} />
            <span className="absolute -end-1 -top-1 rounded border border-cut-black/15 bg-cut-ivory px-1 py-px text-[7px] font-black tracking-wider text-cut-black shadow-sm">
              CUT
            </span>
            <motion.span
              className="absolute -start-0.5 top-1 text-[11px] text-cut-burgundy"
              animate={{ opacity: [0, 1, 0], y: [0, 8, 14], x: [-2, -4, -2] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: 0.5 }}
            >
              •
            </motion.span>
          </motion.div>
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
