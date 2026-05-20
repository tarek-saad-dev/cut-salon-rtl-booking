"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Scissors, Clock, Zap } from "lucide-react";
import BookingModal, { type BarberBookingInfo, type BookingMode } from "./BookingModal";
import { getBookingBarbers, type BookingBarber } from "@/lib/publicBookingApi";

type DisplayBarber = BarberBookingInfo & { buttonText: string };

// ─── Local fallback data ───────────────────────────────────────────────────────
const LOCAL_IMAGE_MAP: Record<string, string> = {
  "محمد": "/barber-mohamed.jpg",
  "باسم": "/barber-bassem.jpg",
  "كريم": "/barber-kareem.jpg",
  "زياد": "/young-ziad.jpg",
  "ذياد": "/barber-ziad.jpg",
  "عمر": "/omar.png",
  "يوسف": "/yousef.jpg",
  "أحمد الصنايعي": "/ahmed.jpg",
  "احمد": "/ahmed.jpg",
};

const FALLBACK_BARBERS: DisplayBarber[] = [
  { name: "محمد", role: "حلاق", image: "/barber-mohamed.jpg", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع محمد" },
  { name: "باسم", role: "حلاق", image: "/barber-bassem.jpg", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع باسم" },
  { name: "كريم", role: "حلاق", image: "/barber-kareem.jpg", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع كريم" },
  { name: "زياد", role: "أخصائي العناية بالبشرة", image: "/young-ziad.jpg", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع زياد" },
  { name: "ذياد", role: "حلاق", image: "/barber-ziad.jpg", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع ذياد" },
  { name: "عمر", role: "حلاق", image: "/omar.png", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع عمر" },
  { name: "أحمد", role: "حلاق", image: "/ahmed.jpg", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع أحمد" },
];

const PLACEHOLDER_SENTINEL = "__placeholder__";

function apiToDisplay(b: BookingBarber): DisplayBarber {
  const localImage = LOCAL_IMAGE_MAP[b.name];
  const image = b.photoUrl && b.photoUrl.trim() !== "" ? b.photoUrl : (localImage ?? PLACEHOLDER_SENTINEL);
  return {
    id: b.id,
    name: b.name,
    role: b.job ?? "حلاق محترف",
    image,
    location: "Cut Salon · الإسكندرية",
    buttonText: `احجز مع ${b.name}`,
  };
}

/* ─── Luxury placeholder for missing images ─── */
const LuxuryPlaceholder = ({ name }: { name: string }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),rgba(255,255,255,0.02)_50%,rgba(0,0,0,0.85))]">
      <div className="w-16 h-16 rounded-full border border-[#D4AF37]/30 bg-black/40 flex items-center justify-center mb-2">
        <span className="text-[#D4AF37] text-xl font-black font-heading">{initials}</span>
      </div>
      <span className="text-[#D4AF37]/40 text-[10px] tracking-[0.3em] font-bold">CUT SALON</span>
    </div>
  );
};

/* ─── Skeleton card ─── */
const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={`rounded-2xl border border-[#D4AF37]/10 bg-[#111] overflow-hidden animate-pulse ${className ?? ""}`}>
    <div className="aspect-[3/4] bg-[#1a1a1a]" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-[#1a1a1a] rounded w-1/2 mx-auto" />
      <div className="h-3 bg-[#1a1a1a] rounded w-1/3 mx-auto" />
      <div className="h-10 bg-[#1a1a1a] rounded-xl" />
    </div>
  </div>
);

/* ─── Barber card ─── */
const BarberCard = ({
  barber,
  onSelect,
  isActive,
}: {
  barber: DisplayBarber;
  onSelect: () => void;
  isActive?: boolean;
}) => {
  const isMissing = barber.image === PLACEHOLDER_SENTINEL;
  return (
    <div className={`rounded-2xl border overflow-hidden group transition-all duration-300
      ${isActive
        ? "border-[#D4AF37]/40 shadow-[0_8px_40px_rgba(212,175,55,0.15)] scale-[1.02]"
        : "border-white/[0.08] hover:border-[#D4AF37]/30 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(212,175,55,0.1)]"
      } bg-[#0e0e0e]`}
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        {isMissing ? (
          <LuxuryPlaceholder name={barber.name} />
        ) : (
          <img src={barber.image} alt={barber.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; e.currentTarget.parentElement?.classList.add("placeholder-active"); }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
      </div>
      <div className="p-4 md:p-5 text-center -mt-2 relative z-10">
        <h3 className="font-heading text-lg md:text-xl font-bold text-white mb-0.5">{barber.name}</h3>
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Scissors className="w-3 h-3 text-[#D4AF37]" />
          <p className="text-[#D4AF37]/70 text-xs font-medium">{barber.role}</p>
        </div>
        <button
          onClick={onSelect}
          className="w-full py-2.5 rounded-xl font-heading font-bold text-sm text-[#050505] transition-all
            bg-gradient-to-l from-[#C8A96A] to-[#E5C07B]
            shadow-[0_4px_20px_rgba(212,175,55,0.2)]
            hover:shadow-[0_6px_28px_rgba(212,175,55,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          {barber.buttonText}
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   MAIN BARBERS SECTION
   ════════════════════════════════════════════ */
const NEAREST_PLACEHOLDER_BARBER: DisplayBarber = {
  name: "أقرب حلاق متاح",
  image: "/cutsalon.png",
  role: "أقرب حلاق متاح",
  location: "Cut Salon · الإسكندرية",
  buttonText: "احجز أقرب ميعاد",
};

const BarbersSection = () => {
  const [selectedBarber, setSelectedBarber] = useState<DisplayBarber | null>(null);
  const [bookingMode, setBookingMode] = useState<BookingMode | undefined>(undefined);
  const [barbers, setBarbers] = useState<DisplayBarber[]>(FALLBACK_BARBERS);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);

  // Listen for hero section booking events
  useEffect(() => {
    const handleBookNow = () => {
      // Open modal with first barber in normal mode (mode choice step)
      const first = barbers[0] ?? FALLBACK_BARBERS[0];
      setBookingMode(undefined);
      setSelectedBarber(first);
    };
    const handleBookNearest = () => {
      // Open modal directly in nearest mode, skip mode choice
      setBookingMode("nearest");
      setSelectedBarber(NEAREST_PLACEHOLDER_BARBER);
    };
    window.addEventListener("cut:book-now", handleBookNow);
    window.addEventListener("cut:book-nearest", handleBookNearest);
    return () => {
      window.removeEventListener("cut:book-now", handleBookNow);
      window.removeEventListener("cut:book-nearest", handleBookNearest);
    };
  }, [barbers]);

  useEffect(() => {
    getBookingBarbers()
      .then(res => {
        const bookable = res.barbers.filter(b => b.isBookableOnline);
        if (bookable.length > 0) setBarbers(bookable.map(apiToDisplay));
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setIsLoadingBarbers(false));
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    align: "start",
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => { emblaApi?.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { emblaApi?.scrollNext(); }, [emblaApi]);

  return (
    <section id="barbers" className="relative py-20 md:py-28 bg-[#050505] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[#D4AF37] font-heading font-bold text-sm tracking-widest mb-3">فريقنا</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white">
            اختَر <span className="text-gold-gradient">حلاقك المفضل</span>
          </h2>
        </div>

        {/* Nearest Available CTA */}
        <div className="max-w-2xl mx-auto mb-8">
          <button
            onClick={() => {
              setBookingMode("nearest");
              setSelectedBarber(NEAREST_PLACEHOLDER_BARBER);
            }}
            className="w-full rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/[0.08] to-[#0a0a0a]/80 backdrop-blur-sm p-5 md:p-6 transition-all duration-300 cursor-pointer hover:border-[#D4AF37]/40 hover:shadow-[0_0_32px_rgba(212,175,55,0.1)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/20 transition-colors">
                <Zap className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className="text-right flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-heading font-bold text-sm md:text-base">مش فارق معاك مين؟ احجز أقرب ميعاد</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20">أسرع</span>
                </div>
                <p className="text-zinc-500 text-xs md:text-sm">النظام يختارلك أقرب حلاق متاح وأقرب وقت</p>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 group-hover:bg-[#D4AF37]/20 transition-colors flex-shrink-0">
                <span className="text-[#D4AF37] font-bold text-xs">احجز الآن</span>
              </div>
            </div>
          </button>
        </div>

        {/* Booking notice — premium card */}
        <div className="max-w-2xl mx-auto mb-12 rounded-2xl border border-[#D4AF37]/15 bg-[#0a0a0a]/80 backdrop-blur-sm p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="text-right">
              <p className="text-white font-medium text-sm md:text-base mb-1.5">
                علشان نحافظ على جودة الخدمة، الحجز بيكون قبلها بـ <span className="text-[#D4AF37] font-bold">4 ساعات</span>
              </p>
              <p className="text-zinc-500 text-xs md:text-sm">
                ولو حابب تيجي فورًا، بتاخد دور وبتدخل في دورك علطول
              </p>
            </div>
          </div>
        </div>

        {/* ─── Mobile Carousel ─── */}
        <div className="md:hidden relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 px-2">
              {isLoadingBarbers
                ? [0, 1, 2].map(i => (
                  <div key={`skel-${i}`} className="flex-[0_0_260px] min-w-0">
                    <SkeletonCard />
                  </div>
                ))
                : barbers.map((barber, index) => (
                  <div key={barber.name} className="flex-[0_0_260px] min-w-0">
                    <BarberCard barber={barber} onSelect={() => setSelectedBarber(barber)} isActive={index === selectedIndex} />
                  </div>
                ))
              }
            </div>
          </div>

          {/* Dots + Arrows */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={scrollPrev} disabled={selectedIndex === 0}
              className="w-9 h-9 rounded-full border border-[#D4AF37]/30 bg-[#0a0a0a] flex items-center justify-center disabled:opacity-20 transition-all active:scale-95">
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
            <div className="flex gap-1.5">
              {scrollSnaps.map((_, idx) => (
                <button key={idx} onClick={() => scrollTo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === selectedIndex ? "bg-[#D4AF37] w-5" : "bg-white/15 w-1.5 hover:bg-white/30"}`}
                  aria-label={`Go to barber ${idx + 1}`} />
              ))}
            </div>
            <button onClick={scrollNext} disabled={selectedIndex === Math.max(barbers.length - 1, 0)}
              className="w-9 h-9 rounded-full border border-[#D4AF37]/30 bg-[#0a0a0a] flex items-center justify-center disabled:opacity-20 transition-all active:scale-95">
              <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* ─── Desktop Grid ─── */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {isLoadingBarbers
            ? [0, 1, 2, 3].map(i => <SkeletonCard key={`skel-d-${i}`} />)
            : barbers.map((barber) => (
              <BarberCard key={barber.name} barber={barber} onSelect={() => setSelectedBarber(barber)} />
            ))
          }
        </div>
      </div>

      {selectedBarber && (
        <BookingModal
          open={!!selectedBarber}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedBarber(null);
              setBookingMode(undefined);
            }
          }}
          barber={selectedBarber}
          initialMode={bookingMode}
        />
      )}
    </section>
  );
};

export default BarbersSection;
