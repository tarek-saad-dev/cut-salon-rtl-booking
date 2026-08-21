"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CampaignCelebrationProps {
  active: boolean;
}

const DOT_COUNT = 22;
const SPARK_COUNT = 10;
const RIBBON_COUNT = 8;

export default function CampaignCelebration({ active }: CampaignCelebrationProps) {
  const reduced = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (!active) return;
    setBurstKey((k) => k + 1);
  }, [active]);

  const dots = useMemo(
    () =>
      Array.from({ length: DOT_COUNT }, (_, i) => ({
        id: i,
        x: 4 + Math.random() * 92,
        delay: 0.05 + Math.random() * 0.85,
        size: 2 + Math.random() * 3.5,
        drift: -28 - Math.random() * 70,
        driftX: (Math.random() - 0.5) * 36,
      })),
    [burstKey],
  );

  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => ({
        id: i,
        x: 18 + (i / SPARK_COUNT) * 64 + (Math.random() - 0.5) * 8,
        delay: 0.15 + i * 0.06,
        rotate: Math.random() * 40 - 20,
      })),
    [burstKey],
  );

  const ribbons = useMemo(
    () =>
      Array.from({ length: RIBBON_COUNT }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        delay: Math.random() * 0.5,
        w: 3 + Math.random() * 4,
        h: 10 + Math.random() * 14,
        rot: -40 + Math.random() * 80,
        color: i % 2 === 0 ? "rgba(210,183,163,0.85)" : "rgba(164,136,121,0.75)",
      })),
    [burstKey],
  );

  if (!active || reduced) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-[1]"
      aria-hidden="true"
    >
      {/* Soft light sweep */}
      <motion.div
        className="absolute inset-y-0 w-2/5 bg-gradient-to-l from-transparent via-cut-warm-beige/14 to-transparent"
        initial={{ right: "-45%", opacity: 0 }}
        animate={{ right: "145%", opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.35, ease: "easeInOut" }}
      />

      {/* Center joy pulse */}
      <motion.div
        className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cut-bronze/20 blur-2xl"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.55, 0.15], scale: [0.4, 1.25, 1] }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* Burst rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={`ring-${burstKey}-${i}`}
          className="absolute left-1/2 top-[42%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cut-warm-beige/35"
          initial={{ opacity: 0.55, scale: 0.35 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: 1.1, delay: 0.12 + i * 0.18, ease: "easeOut" }}
        />
      ))}

      {/* Rising bronze dots */}
      {dots.map((p) => (
        <motion.span
          key={`dot-${burstKey}-${p.id}`}
          className="absolute rounded-full bg-cut-bronze/80"
          style={{
            left: `${p.x}%`,
            bottom: "10%",
            width: p.size,
            height: p.size,
            boxShadow: "0 0 8px rgba(164,136,121,0.55)",
          }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 0],
            y: p.drift,
            x: p.driftX,
            scale: [0.4, 1.15, 0.25],
          }}
          transition={{ duration: 1.55, delay: p.delay, ease: "easeOut" }}
        />
      ))}

      {/* Falling ribbons */}
      {ribbons.map((r) => (
        <motion.span
          key={`ribbon-${burstKey}-${r.id}`}
          className="absolute rounded-[1px]"
          style={{
            left: `${r.x}%`,
            top: "-4%",
            width: r.w,
            height: r.h,
            background: r.color,
          }}
          initial={{ opacity: 0, y: 0, rotate: r.rot }}
          animate={{
            opacity: [0, 0.95, 0],
            y: ["0%", "118%"],
            rotate: r.rot + 120,
          }}
          transition={{ duration: 1.7, delay: r.delay, ease: [0.22, 0.61, 0.36, 1] }}
        />
      ))}

      {/* Spark flashes near offer */}
      {sparks.map((s) => (
        <motion.span
          key={`spark-${burstKey}-${s.id}`}
          className="absolute h-2 w-2 rounded-[1px] bg-cut-warm-beige"
          style={{
            left: `${s.x}%`,
            top: "48%",
            boxShadow: "0 0 10px rgba(210,183,163,0.7)",
          }}
          initial={{ opacity: 0, scale: 0, rotate: s.rotate }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.4, 0],
            y: [0, -18 - Math.random() * 20],
            rotate: s.rotate + 45,
          }}
          transition={{ duration: 0.9, delay: s.delay, ease: "easeOut" }}
        />
      ))}

      {/* Subtle top glow */}
      <motion.div
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cut-bronze/15 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.75, 0.25] }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
    </div>
  );
}
