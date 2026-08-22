"use client";

type BookCompactProgressProps = {
  current: number;
  total: number;
};

/** Segment progress bar for compact mobile booking hero. */
export function BookCompactProgress({ current, total }: BookCompactProgressProps) {
  if (total <= 0) return null;

  return (
    <div
      className="flex items-center gap-1"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
            i < current ? "bg-cut-bronze" : "bg-cut-ivory/20"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}
