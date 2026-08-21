"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { CelebrationVariant } from "@/hooks/useCampaignPageLoadCelebration";
import { generateConfetti } from "@/lib/campaignConfetti";

interface CampaignPageLoadCelebrationProps {
  active: boolean;
  variant: CelebrationVariant;
  loadKey: string;
}

function pieceStyle(p: ReturnType<typeof generateConfetti>[number]): CSSProperties {
  return {
    "--left": p.left,
    "--delay": `${p.delay}s`,
    "--dur": `${p.duration}s`,
    "--drift": p.drift,
    "--rot": p.rotate,
    "--spin": p.spin,
    "--color": p.color,
    "--w": `${p.w}px`,
    "--h": `${p.h}px`,
  } as CSSProperties;
}

/** Decorative, non-blocking page-load layer — CSS confetti + variant effects. */
export default function CampaignPageLoadCelebration({
  active,
  variant,
  loadKey,
}: CampaignPageLoadCelebrationProps) {
  const confetti = useMemo(() => generateConfetti(34), [loadKey]);

  if (!active) return null;

  return (
    <div
      className="campaign-page-celebration"
      data-variant={variant}
      aria-hidden="true"
    >
      <div className="campaign-page-celebration__color-wash" />
      <div className="campaign-page-celebration__glow" />
      <div className="campaign-page-celebration__burst-ring" />

      <div className="campaign-page-celebration__confetti">
        {confetti.map((p) => (
          <span
            key={p.id}
            className={`campaign-page-celebration__confetti-piece campaign-page-celebration__confetti-piece--${p.shape}${p.burst ? " is-burst" : ""}`}
            style={pieceStyle(p)}
          />
        ))}
      </div>

      {variant === "particles" && (
        <div className="campaign-page-celebration__particles">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="campaign-page-celebration__dot" style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      )}

      {variant === "sweep" && (
        <>
          <div className="campaign-page-celebration__sweep" />
          <div className="campaign-page-celebration__sparks">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="campaign-page-celebration__spark" style={{ "--i": i } as CSSProperties} />
            ))}
          </div>
        </>
      )}

      {variant === "fragments" && (
        <>
          <div className="campaign-page-celebration__shimmer-band" />
          <div className="campaign-page-celebration__fragments">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="campaign-page-celebration__fragment" style={{ "--i": i } as CSSProperties} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
