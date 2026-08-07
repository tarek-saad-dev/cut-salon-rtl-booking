"use client";

import { useState } from "react";
import Image from "next/image";
import { Scissors, Sparkles, Droplets, Paintbrush, HandHelping } from "lucide-react";
import type { ServiceVisual, ServiceVisualKey } from "@/lib/booking/service-visuals";

const ICONS: Record<ServiceVisualKey, typeof Scissors> = {
  haircut: Scissors,
  beard: Scissors,
  haircutBeard: Scissors,
  skincare: Droplets,
  masks: Sparkles,
  groom: Sparkles,
  hairCare: Paintbrush,
  comfort: HandHelping,
  neutral: Scissors,
};

interface BookingServiceImageProps {
  visual: ServiceVisual;
  alt: string;
  priority?: boolean;
  className?: string;
  /** aspect ratio box — default 16/10; ignored when fillContainer */
  aspectClassName?: string;
  /** Stretch to parent bounds (horizontal card media strip). */
  fillContainer?: boolean;
  sizes?: string;
}

export default function BookingServiceImage({
  visual,
  alt,
  priority = false,
  className = "",
  aspectClassName = "aspect-[16/10]",
  fillContainer = false,
  sizes = "(max-width: 768px) 90vw, 280px",
}: BookingServiceImageProps) {
  const [failed, setFailed] = useState(false);
  const Icon = ICONS[visual.iconHint] ?? Scissors;
  const showImage = Boolean(visual.image) && !failed;

  return (
    <div
      className={`relative overflow-hidden bg-[var(--booking-surface)] ${
        fillContainer ? "h-full w-full" : `w-full ${aspectClassName}`
      } ${className}`}
    >
      {showImage ? (
        <Image
          src={visual.image!}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: visual.focalPosition || "center" }}
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--booking-accent-soft)]"
          aria-hidden
        >
          <Icon className={`${fillContainer ? "h-6 w-6" : "h-8 w-8"} text-[var(--booking-accent)]`} />
        </div>
      )}
      {fillContainer ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[var(--booking-bg)]/25 via-transparent to-black/15"
        />
      ) : null}
    </div>
  );
}
