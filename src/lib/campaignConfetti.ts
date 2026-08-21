import { CELEBRATION_COLORS } from "./campaignCelebrationSound";

export type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  spin: number;
  color: string;
  w: number;
  h: number;
  shape: "rect" | "circle" | "ribbon";
  burst: boolean;
};

export function generateConfetti(count = 32): ConfettiPiece[] {
  return Array.from({ length: count }, (_, id) => {
    const burst = id < 10;
    return {
      id,
      left: burst ? 38 + Math.random() * 24 : 2 + Math.random() * 96,
      delay: burst ? Math.random() * 0.12 : Math.random() * 0.35,
      duration: burst ? 1.1 + Math.random() * 0.45 : 1.45 + Math.random() * 0.65,
      drift: (Math.random() - 0.5) * (burst ? 38 : 28),
      rotate: Math.random() * 360,
      spin: (Math.random() - 0.5) * 720,
      color: CELEBRATION_COLORS[id % CELEBRATION_COLORS.length]!,
      w: burst ? 5 + Math.random() * 4 : 4 + Math.random() * 5,
      h: burst ? 8 + Math.random() * 6 : 6 + Math.random() * 8,
      shape: (["rect", "circle", "ribbon"] as const)[id % 3]!,
      burst,
    };
  });
}
