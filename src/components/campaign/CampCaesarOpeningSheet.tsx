"use client";

import { ArrowRight, X } from "lucide-react";
import { motion } from "framer-motion";
import type { CampaignConfig } from "@/config/campaigns";
import CampaignCelebration from "./CampaignCelebration";

interface CampCaesarOpeningSheetProps {
  config: CampaignConfig;
  open: boolean;
  onExplore: () => void;
  onContinue: () => void;
  onClose: () => void;
  isMobile: boolean;
}

function OpeningContent({
  config,
  onExplore,
  onContinue,
  onClose,
  showCelebration,
}: {
  config: CampaignConfig;
  onExplore: () => void;
  onContinue: () => void;
  onClose: () => void;
  showCelebration: boolean;
}) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden" dir="ltr">
      <CampaignCelebration active={showCelebration} />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 z-20 flex items-center justify-center w-10 h-10 rounded-full
          bg-cut-black/60 border border-cut-bronze/25 text-cut-ivory/80
          hover:bg-cut-espresso hover:text-cut-ivory transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Media placeholder — replace when branch asset is available */}
      <div className="relative h-[28%] min-h-[100px] flex-shrink-0 overflow-hidden bg-cut-espresso">
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(164,136,121,0.15),transparent_55%)]" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-cut-black to-transparent" />
      </div>

      <div className="flex-1 flex flex-col items-center text-center px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <span className="cut-editorial-label mb-2">{config.eyebrow}</span>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-[2rem] sm:text-[2.25rem] font-black tracking-[0.18em] text-cut-ivory leading-none"
        >
          {config.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-2 font-display text-xs font-semibold tracking-[0.35em] text-cut-bronze"
        >
          {config.status}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-5 mb-1"
        >
          <p className="font-display text-4xl sm:text-5xl font-black text-gold-gradient leading-none">
            {config.offer}
          </p>
          <p className="mt-1.5 font-display text-sm font-semibold tracking-[0.28em] text-cut-warm-beige/90">
            {config.offerDescription}
          </p>
          <p className="mt-2 text-[10px] tracking-wider text-cut-ivory/45 uppercase">
            Camp Caesar branch only
          </p>
        </motion.div>

        <div className="mt-auto w-full max-w-sm space-y-3 pt-6">
          <button
            type="button"
            onClick={onExplore}
            className="group w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
              bg-cut-ivory text-cut-black font-heading font-bold text-sm
              hover:bg-cut-warm-beige active:scale-[0.98] transition-all shadow-cut-glow"
          >
            EXPLORE CAMP CAESAR
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full py-2 text-xs text-cut-ivory/45 hover:text-cut-ivory/70 transition-colors tracking-wide"
          >
            Continue to CUT
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampCaesarOpeningSheet({
  config,
  open,
  onExplore,
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
          style={{ height: "min(62vh, 520px)", maxHeight: "calc(100dvh - 3rem)" }}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-cut-bronze/30 flex-shrink-0" />
          <OpeningContent
            config={config}
            onExplore={onExplore}
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
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,420px)] max-h-[85vh]
          -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cut-bronze/25
          bg-cut-black shadow-cut-glow-strong overflow-hidden"
        style={{ height: "min(580px, 85vh)" }}
      >
        <OpeningContent
          config={config}
          onExplore={onExplore}
          onContinue={onContinue}
          onClose={onClose}
          showCelebration
        />
      </motion.div>
    </>
  );
}
