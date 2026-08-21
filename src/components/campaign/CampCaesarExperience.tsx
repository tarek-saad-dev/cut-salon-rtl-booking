"use client";

import { ArrowLeft, Calendar, MapPin, X } from "lucide-react";
import { motion } from "framer-motion";
import type { CampaignConfig } from "@/config/campaigns";
import { trackCampaignEvent } from "@/lib/campaignAnalytics";
import CampaignCelebration from "./CampaignCelebration";

interface CampCaesarExperienceProps {
  config: CampaignConfig;
  open: boolean;
  onClose: () => void;
  onBook: () => void;
  isMobile: boolean;
}

function ExperienceBody({
  config,
  onClose,
  onBook,
  onDirections,
}: {
  config: CampaignConfig;
  onClose: () => void;
  onBook: () => void;
  onDirections: () => void;
}) {
  return (
    <div className="relative flex flex-col h-full overflow-y-auto overscroll-contain" dir="ltr">
      <CampaignCelebration active />

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

      {/* Hero visual */}
      <div className="relative min-h-[180px] sm:min-h-[200px] flex-shrink-0 overflow-hidden bg-cut-espresso">
        {config.branchImage ? (
          <img src={config.branchImage} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div
            className="w-full h-full min-h-[180px]"
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(164,136,121,0.2), transparent 50%), linear-gradient(180deg, #170406 0%, #050505 100%)",
            }}
          >
            <div className="absolute inset-0 cut-grain opacity-30 pointer-events-none" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cut-black via-cut-black/40 to-transparent" />
        <div className="absolute bottom-5 inset-x-0 text-center px-4">
          {config.brandLabel && (
            <p className="cut-editorial-label mb-1 opacity-80">{config.brandLabel}</p>
          )}
          <h2 className="font-display text-3xl font-black tracking-[0.2em] text-cut-ivory">
            {config.title}
          </h2>
          <p className="mt-1 font-display text-xs tracking-[0.35em] text-cut-bronze">{config.status}</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="text-center mb-8">
          <p className="font-editorial text-5xl font-bold text-gold-gradient leading-none tracking-tight">
            {config.offer}
          </p>
          <p className="mt-2 font-display text-sm font-semibold tracking-[0.25em] text-cut-warm-beige">
            {config.offerDescription}
          </p>
          <p className="mt-2 text-[10px] text-cut-ivory/40 uppercase tracking-wider">
            Camp Caesar branch only · First visit
          </p>
        </div>

        {/* Location */}
        <div className="cut-card-editorial p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cut-bronze/10 border border-cut-bronze/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-cut-bronze" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-cut-ivory text-sm font-bold mb-0.5">Camp Caesar, Alexandria</p>
              <p className="text-cut-ivory/55 text-xs leading-relaxed">
                Our newest CUT location — same premium grooming experience, new neighborhood.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onBook}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
              bg-cut-ivory text-cut-black font-heading font-bold text-sm
              hover:bg-cut-warm-beige active:scale-[0.98] transition-all"
          >
            <Calendar className="w-4 h-4" />
            BOOK CAMP CAESAR
          </button>

          <button
            type="button"
            onClick={onDirections}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
              border border-cut-bronze/35 text-cut-ivory font-heading font-bold text-sm
              hover:bg-cut-bronze/10 active:scale-[0.98] transition-all"
          >
            <MapPin className="w-4 h-4 text-cut-bronze" />
            GET DIRECTIONS
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampCaesarExperience({
  config,
  open,
  onClose,
  onBook,
  isMobile,
}: CampCaesarExperienceProps) {
  if (!open) return null;

  const handleDirections = () => {
    trackCampaignEvent("camp_caesar_location_click", { source: "experience" });
    window.open(config.locationUrl, "_blank", "noopener,noreferrer");
  };

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Explore Camp Caesar"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 34 }}
          className="fixed inset-0 z-[76] bg-cut-black flex flex-col"
        >
          <div className="flex items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 border-b border-cut-bronze/15">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-cut-ivory/60 hover:text-cut-ivory text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ExperienceBody
              config={config}
              onClose={onClose}
              onBook={onBook}
              onDirections={handleDirections}
            />
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Explore Camp Caesar"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed left-1/2 top-1/2 z-[76] w-[min(94vw,480px)] max-h-[90vh]
          -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cut-bronze/25
          bg-cut-black shadow-cut-glow-strong overflow-hidden flex flex-col"
      >
        <ExperienceBody
          config={config}
          onClose={onClose}
          onBook={onBook}
          onDirections={handleDirections}
        />
      </motion.div>
    </>
  );
}
