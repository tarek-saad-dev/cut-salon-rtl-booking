"use client";

import { useEffect, useState, useCallback } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  delay: number;
  duration: number;
  shape: "circle" | "rect" | "star";
}

const GOLD_PALETTE = [
  "#D4AF37",
  "#E7C766",
  "#C8A96A",
  "#B88916",
  "#F5D060",
  "#9F7A18",
  "#FFD700",
  "#DAA520",
];

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(5, 95),
    y: randomBetween(-10, 40),
    size: randomBetween(4, 10),
    color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
    rotation: randomBetween(0, 360),
    delay: randomBetween(0, 0.5),
    duration: randomBetween(1.2, 2.5),
    shape: (["circle", "rect", "star"] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface ConfettiBurstProps {
  trigger: number; // increment to fire again
  particleCount?: number;
}

const ConfettiBurst = ({ trigger, particleCount = 50 }: ConfettiBurstProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  const fire = useCallback(() => {
    setParticles(generateParticles(particleCount));
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [particleCount]);

  useEffect(() => {
    if (trigger > 0) {
      return fire();
    }
  }, [trigger, fire]);

  if (!visible || particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes confetti-sway {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(15px); }
          75% { transform: translateX(-15px); }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards, confetti-sway ${p.duration * 0.5}s ease-in-out ${p.delay}s infinite`,
          }}
        >
          {p.shape === "circle" ? (
            <div
              style={{
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ) : p.shape === "rect" ? (
            <div
              style={{
                width: p.size,
                height: p.size * 0.6,
                borderRadius: 1,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ) : (
            <svg
              width={p.size}
              height={p.size}
              viewBox="0 0 24 24"
              fill={p.color}
              style={{ transform: `rotate(${p.rotation}deg)` }}
            >
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConfettiBurst;
