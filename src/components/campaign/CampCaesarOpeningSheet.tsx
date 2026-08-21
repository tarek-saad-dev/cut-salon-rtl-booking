"use client";

import { ArrowRight, Sparkles, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { CampaignConfig } from "@/config/campaigns";
import { useLanguage } from "@/context/LanguageContext";
import CampaignCelebration from "./CampaignCelebration";

interface CampCaesarOpeningSheetProps {
  config: CampaignConfig;
  open: boolean;
  onExplore: () => void;
  onBook: () => void;
  onContinue: () => void;
  onClose: () => void;
  isMobile: boolean;
}

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function OpeningContent({
  config,
  onExplore,
  onBook,
  onContinue,
  onClose,
  showCelebration,
}: {
  config: CampaignConfig;
  onExplore: () => void;
  onBook: () => void;
  onContinue: () => void;
  onClose: () => void;
  showCelebration: boolean;
}) {
  const { isArabic, lang } = useLanguage();
  const reduced = useReducedMotion();
  const invite = config.inviteLine[lang] ?? config.inviteLine.en;
  const bookLabel = config.bookCta[lang] ?? config.bookCta.en;

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <CampaignCelebration active={showCelebration} />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 end-3 z-20 flex items-center justify-center w-10 h-10 rounded-full
          bg-cut-black/60 border border-cut-bronze/25 text-cut-ivory/80
          hover:bg-cut-espresso hover:text-cut-ivory transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Media / festive header plane */}
      <div className="relative h-[26%] min-h-[96px] flex-shrink-0 overflow-hidden bg-cut-espresso">
        {config.branchImage ? (
          <img
            src={config.branchImage}
            alt=""
            className="w-full h-full object-cover opacity-80"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-end justify-center pb-4"
            style={{
              background:
                "linear-gradient(160deg, rgba(23,4,6,0.95) 0%, rgba(5,5,5,0.9) 50%, rgba(74,0,15,0.35) 100%)",
            }}
          >
            <div className="absolute inset-0 cut-grain opacity-40 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(164,136,121,0.18),transparent_55%)]" />
            {!reduced && (
              <motion.div
                className="absolute inset-0 campaign-shimmer opacity-40"
                aria-hidden
              />
            )}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-cut-black to-transparent" />

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.15 }}
          className="absolute inset-x-0 bottom-3 flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cut-bronze/40 bg-cut-black/55 px-3 py-1 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-cut-warm-beige" />
            <span className="font-display text-[10px] font-bold tracking-[0.22em] text-cut-warm-beige">
              {config.eyebrow}
            </span>
          </span>
        </motion.div>
      </div>

      <motion.div
        className="flex-1 flex flex-col items-center text-center px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        variants={stagger}
        initial={reduced ? false : "hidden"}
        animate="show"
      >
        <motion.h2
          variants={rise}
          className="font-display text-[1.85rem] sm:text-[2.15rem] font-black tracking-[0.16em] text-cut-ivory leading-none"
        >
          {config.title}
        </motion.h2>

        <motion.p
          variants={rise}
          className="mt-2 font-display text-xs font-semibold tracking-[0.32em] text-cut-bronze"
        >
          {config.status}
        </motion.p>

        <motion.div variants={rise} className="mt-4 mb-1 relative">
          <motion.p
            className={`text-4xl sm:text-5xl font-bold text-gold-gradient leading-none tracking-tight ${
              isArabic ? "font-heading" : "font-editorial"
            }`}
            initial={reduced ? false : { scale: 0.72, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.28 }}
          >
            {config.offer}
          </motion.p>

          {!reduced && (
            <motion.span
              className="pointer-events-none absolute -inset-x-6 -inset-y-3 rounded-full bg-cut-bronze/10 blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.45, 0.2] }}
              transition={{ duration: 1.8, delay: 0.4, ease: "easeInOut" }}
              aria-hidden
            />
          )}

          <motion.p
            variants={rise}
            className="mt-1.5 font-display text-sm font-semibold tracking-[0.28em] text-cut-warm-beige/90"
          >
            {config.offerDescription}
          </motion.p>
        </motion.div>

        <motion.p
          variants={rise}
          className={`mt-3 max-w-[20rem] text-[13px] sm:text-sm leading-relaxed text-cut-ivory/75 ${
            isArabic ? "font-heading" : "font-editorial font-medium"
          }`}
        >
          {invite}
        </motion.p>

        <motion.p
          variants={rise}
          className="mt-2 text-[10px] tracking-wider text-cut-ivory/40 uppercase"
        >
          {isArabic ? "فرع كامب شيزار فقط · الزيارة الأولى" : "Camp Caesar branch only · First visit"}
        </motion.p>

        <motion.div variants={rise} className="mt-auto w-full max-w-sm space-y-2.5 pt-5">
          <motion.button
            type="button"
            onClick={onBook}
            whileHover={reduced ? undefined : { scale: 1.02 }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            animate={
              reduced
                ? undefined
                : {
                    boxShadow: [
                      "0 0 0 rgba(210,183,163,0)",
                      "0 0 22px rgba(210,183,163,0.35)",
                      "0 0 10px rgba(210,183,163,0.18)",
                    ],
                  }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="group relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
              bg-cut-ivory text-cut-black font-heading font-bold text-sm
              hover:bg-cut-warm-beige active:scale-[0.98] transition-colors"
          >
            {!reduced && (
              <span
                className="pointer-events-none absolute inset-0 campaign-shimmer opacity-50"
                aria-hidden
              />
            )}
            <span className="relative z-[1] flex items-center gap-2">
              {bookLabel}
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  isArabic
                    ? "rotate-180 group-hover:-translate-x-0.5"
                    : "group-hover:translate-x-0.5"
                }`}
              />
            </span>
          </motion.button>

          <button
            type="button"
            onClick={onExplore}
            className="w-full py-2.5 text-xs font-heading font-semibold tracking-wide text-cut-warm-beige/80
              border border-cut-bronze/30 rounded-xl hover:bg-cut-warm-beige/5 hover:text-cut-ivory transition-colors"
          >
            {isArabic ? "اكتشف كامب شيزار" : "Explore Camp Caesar"}
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full py-1.5 text-xs text-cut-ivory/40 hover:text-cut-ivory/65 transition-colors tracking-wide"
          >
            {isArabic ? "متابعة إلى CUT" : "Continue to CUT"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function CampCaesarOpeningSheet({
  config,
  open,
  onExplore,
  onBook,
  onContinue,
  onClose,
  isMobile,
}: CampCaesarOpeningSheetProps) {
  if (!open) return null;

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Camp Caesar grand opening"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-[71] rounded-t-2xl border-t border-cut-bronze/25
            bg-cut-black shadow-[0_-8px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ height: "min(68vh, 560px)", maxHeight: "calc(100dvh - 3rem)" }}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-cut-bronze/30 flex-shrink-0" />
          <OpeningContent
            config={config}
            onExplore={onExplore}
            onBook={onBook}
            onContinue={onContinue}
            onClose={onClose}
            showCelebration
          />
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Camp Caesar grand opening"
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,420px)] max-h-[85vh]
          -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cut-bronze/25
          bg-cut-black shadow-cut-glow-strong overflow-hidden"
        style={{ height: "min(620px, 88vh)" }}
      >
        <OpeningContent
          config={config}
          onExplore={onExplore}
          onBook={onBook}
          onContinue={onContinue}
          onClose={onClose}
          showCelebration
        />
      </motion.div>
    </>
  );
}
