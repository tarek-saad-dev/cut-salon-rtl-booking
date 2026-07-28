"use client";

import { useState } from "react";

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

export function BarberInitialsPlaceholder({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initials = initialsFromName(name || "?");
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(229,188,134,0.14),rgba(255,255,255,0.02)_50%,rgba(0,0,0,0.85))] ${className}`}
      aria-hidden={false}
      role="img"
      aria-label={name}
    >
      <div className="w-2/5 max-w-16 aspect-square rounded-full border border-cut-gold/30 bg-black/40 flex items-center justify-center mb-1">
        <span className="text-cut-gold text-[clamp(0.75rem,2.5vw,1.25rem)] font-black font-heading">
          {initials}
        </span>
      </div>
      <span className="text-cut-gold/40 text-[8px] tracking-[0.25em] font-bold">CUT SALON</span>
    </div>
  );
}

/**
 * Barber photo from Public Booking API (`imageUrl || photoUrl`).
 * Falls back to initials when URL is missing or fails to load.
 */
export default function BarberPhoto({
  src,
  name,
  className = "w-full h-full object-cover object-top",
  imgClassName,
  loading = "lazy",
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
  /** Extra classes applied only to the <img> */
  imgClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  const photo = src?.trim() || null;

  if (!photo || failed) {
    return <BarberInitialsPlaceholder name={name} className={className} />;
  }

  return (
    <img
      src={photo}
      alt={name}
      loading={loading}
      referrerPolicy="no-referrer"
      className={imgClassName ?? className}
      onError={() => setFailed(true)}
    />
  );
}
