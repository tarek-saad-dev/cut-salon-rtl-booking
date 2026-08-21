"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface CampaignCelebrationProps {
  active: boolean;
}

const PARTICLE_COUNT = 18;

function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function CampaignCelebration({ active }: CampaignCelebrationProps) {
  const reduced = usePrefersReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: 8 + Math.random() * 84,
        delay: Math.random() * 0.6,
        size: 2 + Math.random() * 3,
        drift: -20 - Math.random() * 40,
      })),
    [],
  );

  if (!active || reduced) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-[1]"
      aria-hidden="true"
    >
      {/* Soft light sweep */}
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-l from-transparent via-cut-warm-beige/12 to-transparent"
        initial={{ right: "-40%", opacity: 0 }}
        animate={{ right: "140%", opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Bronze particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-cut-bronze/70"
          style={{
            left: `${p.x}%`,
            bottom: "12%",
            width: p.size,
            height: p.size,
            boxShadow: "0 0 6px rgba(164,136,121,0.5)",
          }}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.9, 0], y: p.drift, scale: [0.5, 1, 0.3] }}
          transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
        />
      ))}

      {/* Subtle top glow */}
      <motion.div
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cut-bronze/10 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.2] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
  );
}
