"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BarberPhoto from "@/components/BarberPhoto";
import {
  resolveBarberDisplayName,
  resolveBarberPhotoUrl,
} from "@/lib/booking-api";
import type { BookingBarber } from "@/lib/publicBookingApi";

function BarberCard({
  barber,
  onViewTimes,
}: {
  barber: BookingBarber;
  onViewTimes: () => void;
}) {
  const name = resolveBarberDisplayName(barber, "en");
  return (
    <article className="group flex h-full flex-col border border-cut-bronze/25 bg-cut-soft-black transition duration-300 hover:-translate-y-1 hover:border-cut-bronze/55 hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      <div className="aspect-[4/5] overflow-hidden bg-cut-black">
        <BarberPhoto
          src={resolveBarberPhotoUrl(barber)}
          name={name}
          imgClassName="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-editorial text-3xl font-semibold tracking-tight">{name}</p>
        <p className="mt-2 text-sm text-cut-ivory/60">
          {barber.job || "CUT Salon Barber"}
        </p>
        <p className="mt-5 text-sm text-cut-warm-beige">Available — view live times</p>
        <button
          type="button"
          onClick={onViewTimes}
          className="mt-auto pt-6 text-left text-sm font-bold text-cut-ivory underline decoration-cut-bronze/70 underline-offset-8 transition hover:decoration-cut-warm-beige"
        >
          View Times
        </button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[420px] animate-pulse border border-cut-bronze/15 bg-cut-soft-black" />
  );
}

export default function EnglishBarbersRail({
  barbers,
  isLoading,
  onViewTimes,
}: {
  barbers: BookingBarber[];
  isLoading: boolean;
  onViewTimes: (barber: BookingBarber) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect, barbers.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const items = isLoading ? Array.from({ length: 4 }, () => null) : barbers;

  if (!isLoading && barbers.length === 0) {
    return (
      <p className="mt-10 max-w-xl text-sm leading-7 text-cut-ivory/60">
        No barbers are available for online booking right now.
      </p>
    );
  }

  return (
    <div className="mt-10">
      {/* Desktop / tablet: clean grid — no horizontal scrollbar */}
      <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((barber, index) =>
          barber ? (
            <BarberCard
              key={barber.id}
              barber={barber}
              onViewTimes={() => onViewTimes(barber)}
            />
          ) : (
            <SkeletonCard key={`skel-${index}`} />
          ),
        )}
      </div>

      {/* Mobile: Embla rail with fades + controls */}
      <div className="sm:hidden">
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-cut-black to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-cut-black to-transparent"
            aria-hidden
          />
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {items.map((barber, index) => (
                <div
                  key={barber ? barber.id : `skel-m-${index}`}
                  className="min-w-0 flex-[0_0_78%]"
                >
                  {barber ? (
                    <BarberCard
                      barber={barber}
                      onViewTimes={() => onViewTimes(barber)}
                    />
                  ) : (
                    <SkeletonCard />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={selectedIndex === 0}
            aria-label="Previous barber"
            className="flex h-10 w-10 items-center justify-center border border-cut-bronze/40 text-cut-warm-beige transition enabled:hover:bg-cut-burgundy/30 disabled:opacity-25"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Barbers">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === selectedIndex}
                aria-label={`Go to barber ${idx + 1}`}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === selectedIndex
                    ? "w-6 bg-cut-warm-beige"
                    : "w-1.5 bg-cut-ivory/20 hover:bg-cut-ivory/40"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={scrollNext}
            disabled={selectedIndex >= Math.max(scrollSnaps.length - 1, 0)}
            aria-label="Next barber"
            className="flex h-10 w-10 items-center justify-center border border-cut-bronze/40 text-cut-warm-beige transition enabled:hover:bg-cut-burgundy/30 disabled:opacity-25"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
