export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Normalized progress of `value` through [start, end]. */
export const segment = (value: number, start: number, end: number) => clamp01((value - start) / (end - start));

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
