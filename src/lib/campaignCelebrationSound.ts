/** Premium opening chime — Web Audio, no asset file. */

const CELEBRATION_COLORS = [
  "#A48879",
  "#D2B7A3",
  "#FCF9ED",
  "#D4AF37",
  "#7A2E2E",
  "#E8C896",
] as const;

export { CELEBRATION_COLORS };

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let playedThisLoad = false;
let fallbackArmed = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

function playChime(ctx: AudioContext): void {
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  const notes = [
    { freq: 523.25, at: 0, dur: 0.35 },
    { freq: 659.25, at: 0.1, dur: 0.35 },
    { freq: 783.99, at: 0.2, dur: 0.55 },
  ];

  const start = ctx.currentTime;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq, start + note.at);
    gain.gain.setValueAtTime(0.0001, start + note.at);
    gain.gain.exponentialRampToValueAtTime(0.45, start + note.at + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start + note.at);
    osc.stop(start + note.at + note.dur + 0.05);
  }

  // Soft sparkle layer
  const sparkle = ctx.createOscillator();
  const sparkleGain = ctx.createGain();
  sparkle.type = "triangle";
  sparkle.frequency.setValueAtTime(1046.5, start + 0.15);
  sparkle.frequency.exponentialRampToValueAtTime(880, start + 0.55);
  sparkleGain.gain.setValueAtTime(0.0001, start + 0.15);
  sparkleGain.gain.exponentialRampToValueAtTime(0.08, start + 0.2);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(start + 0.15);
  sparkle.stop(start + 0.7);
}

async function tryPlay(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") return false;
    playChime(ctx);
    window.setTimeout(() => void ctx.close(), 1800);
    return true;
  } catch {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
    return false;
  }
}

function armFallbackPlay(): void {
  if (fallbackArmed || playedThisLoad) return;
  fallbackArmed = true;

  const onInteract = () => {
    if (playedThisLoad) return;
    void tryPlay().then((ok) => {
      if (ok) playedThisLoad = true;
    });
  };

  window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
  window.addEventListener("keydown", onInteract, { once: true });
}

/** Play once per page load. Falls back to first tap/click if autoplay is blocked. */
export function playCampaignCelebrationSound(): void {
  if (playedThisLoad || prefersReducedMotion()) return;

  void tryPlay().then((ok) => {
    if (ok) {
      playedThisLoad = true;
      return;
    }
    armFallbackPlay();
  });
}
