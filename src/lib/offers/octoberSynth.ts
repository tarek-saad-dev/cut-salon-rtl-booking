import type { OctoberSoundSlot } from "@/config/octoberOffer";

/** A fixed frequency, or an exponential sweep [from, to] across the layer's envelope. */
export type Sweep = number | readonly [number, number];

interface LayerBase {
  /** Offset from the cue, in seconds. */
  at?: number;
  peak: number;
  attack: number;
  /** Ignored for sustained (looping) recipes. */
  release: number;
}

export type SynthLayer =
  | (LayerBase & { kind: "noise"; filter: BiquadFilterType; freq: Sweep; q?: number })
  | (LayerBase & {
      kind: "tone";
      wave: OscillatorType;
      freq: Sweep;
      filter?: { type: BiquadFilterType; freq: number; q?: number };
    });

export interface SynthRecipe {
  layers: readonly SynthLayer[];
  /** Holds at peak until stopped (ambience loops). */
  sustain?: boolean;
}

const noise = (filter: BiquadFilterType, freq: Sweep, peak: number, attack: number, release: number, extra: { q?: number; at?: number } = {}): SynthLayer => ({
  kind: "noise",
  filter,
  freq,
  peak,
  attack,
  release,
  ...extra,
});

const tone = (
  wave: OscillatorType,
  freq: Sweep,
  peak: number,
  attack: number,
  release: number,
  extra: { at?: number; filter?: { type: BiquadFilterType; freq: number; q?: number } } = {},
): SynthLayer => ({ kind: "tone", wave, freq, peak, attack, release, ...extra });

/**
 * Placeholder sound design, synthesized so nothing copyrighted or downloaded is needed.
 * Peaks are deliberately small; slot volumes in OCTOBER_SOUNDS set the final mix.
 */
export const SYNTH_RECIPES: Record<OctoberSoundSlot, SynthRecipe> = {
  // Opening
  static: { layers: [noise("bandpass", 1700, 0.05, 0.5, 1.8, { q: 0.8 })] },
  swell: {
    layers: [
      tone("triangle", [110, 165], 0.05, 1.4, 1.2, { filter: { type: "lowpass", freq: 900 } }),
      tone("sine", 220, 0.02, 1.6, 1),
    ],
  },
  fabric: {
    layers: [noise("bandpass", [500, 1400], 0.05, 0.35, 0.7, { q: 0.6 }), noise("lowpass", 400, 0.03, 0.5, 0.6, { at: 0.1 })],
  },
  // Transitions
  whoosh: { layers: [noise("bandpass", [400, 2600], 0.07, 0.22, 0.3, { q: 1.2 })] },
  swipe: { layers: [noise("highpass", [1200, 5000], 0.08, 0.08, 0.25, { q: 0.7 })] },
  // Hair cut
  clipper: {
    layers: [
      noise("bandpass", 3400, 0.08, 0.05, 1.4, { q: 3 }),
      tone("sawtooth", 118, 0.06, 0.04, 1.5, { filter: { type: "bandpass", freq: 1400, q: 1.4 } }),
    ],
  },
  snip: {
    layers: [
      noise("highpass", 4200, 0.12, 0.003, 0.06),
      tone("sine", 3100, 0.04, 0.002, 0.12),
      noise("highpass", 5200, 0.08, 0.003, 0.05, { at: 0.07 }),
    ],
  },
  comb: { layers: [noise("bandpass", [2000, 3800], 0.05, 0.18, 0.25, { q: 2 })] },
  // Beard
  razor: {
    layers: [noise("bandpass", [600, 5200], 0.1, 0.22, 0.35, { q: 1.4 }), tone("sine", 2350, 0.04, 0.004, 0.8, { at: 0.42 })],
  },
  click: {
    layers: [
      tone("square", 1800, 0.05, 0.001, 0.04, { filter: { type: "highpass", freq: 1200 } }),
      tone("sine", 2600, 0.03, 0.001, 0.15, { at: 0.01 }),
    ],
  },
  tick: { layers: [tone("sine", 3400, 0.035, 0.002, 0.09)] },
  // Oil bath
  drop: { layers: [tone("sine", [720, 190], 0.16, 0.008, 0.3), noise("lowpass", 600, 0.03, 0.01, 0.25, { at: 0.02 })] },
  pour: { layers: [noise("lowpass", [700, 1100], 0.05, 0.3, 1.1, { q: 0.9 }), noise("bandpass", 1800, 0.015, 0.4, 0.9, { q: 4 })] },
  massage: { layers: [noise("lowpass", 350, 0.05, 0.4, 0.8), noise("lowpass", 300, 0.04, 0.35, 0.7, { at: 0.7 })] },
  towel: { layers: [noise("bandpass", [900, 500], 0.06, 0.12, 0.45, { q: 0.7 })] },
  "warm-air": { sustain: true, layers: [noise("lowpass", 450, 0.035, 1.2, 0), noise("bandpass", 900, 0.012, 1.6, 0, { q: 0.5 })] },
  // Skin care
  steam: { layers: [noise("highpass", [3500, 2400], 0.08, 0.25, 1.4)] },
  foam: { layers: [noise("bandpass", 3000, 0.03, 0.3, 0.8, { q: 2.5 }), noise("highpass", 6000, 0.015, 0.2, 0.7, { at: 0.1 })] },
  "spa-air": { sustain: true, layers: [noise("highpass", 2400, 0.012, 1.4, 0), noise("lowpass", 600, 0.02, 1.6, 0)] },
  shimmer: {
    layers: [
      tone("sine", 2093, 0.03, 0.01, 1.2),
      tone("sine", 2637, 0.025, 0.01, 1.1, { at: 0.06 }),
      tone("sine", 3136, 0.02, 0.01, 1, { at: 0.12 }),
    ],
  },
  // Price
  riser: {
    layers: [
      noise("bandpass", [300, 3200], 0.06, 1.1, 0.12, { q: 1.5 }),
      tone("sawtooth", [80, 160], 0.03, 1.1, 0.1, { filter: { type: "lowpass", freq: 700 } }),
    ],
  },
  reveal: { layers: [tone("sine", [92, 34], 0.9, 0.012, 1.6), noise("lowpass", 900, 0.35, 0.004, 0.14)] },
};
