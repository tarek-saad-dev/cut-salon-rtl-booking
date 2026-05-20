"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BookingModal, { type BarberBookingInfo } from "./BookingModal";
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
  { name: "محمد", role: "حلاق", image: "/barber-mohamed.jpg", rating: 4.8, reviewCount: "(215)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع محمد" },
  { name: "باسم", role: "حلاق", image: "/barber-bassem.jpg", rating: 4.7, reviewCount: "(189)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع باسم" },
  { name: "كريم", role: "حلاق", image: "/barber-kareem.jpg", rating: 4.9, reviewCount: "(328)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع كريم" },
  { name: "زياد", role: "أخصائي العناية بالبشرة", image: "/young-ziad.jpg", rating: 4.8, reviewCount: "(143)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع زياد" },
  { name: "ذياد", role: "حلاق", image: "/barber-ziad.jpg", rating: 4.7, reviewCount: "(142)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع ذiad" },
  { name: "عمر", role: "حلاق", image: "/omar.png", rating: 4.8, reviewCount: "(189)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع عمر" },
  { name: "أحمد", role: "حلاق", image: "/ahmed.jpg", rating: 4.9, reviewCount: "(203)", location: "Cut Salon · الإسكندرية", buttonText: "احجز مع أحمد" },
];

function apiToDisplay(b: BookingBarber): DisplayBarber {
  const localImage = LOCAL_IMAGE_MAP[b.name];
  const image = b.photoUrl && b.photoUrl.trim() !== "" ? b.photoUrl : (localImage ?? "/placeholder.svg");
  return {
    id: b.id,
    name: b.name,
    role: b.job ?? "حلاق محترف",
    image,
    location: "Cut Salon · الإسكندرية",
    buttonText: `احجز مع ${b.name}`,
  };
}

const BarbersSection = () => {
  const [selectedBarber, setSelectedBarber] = useState<DisplayBarber | null>(null);
  const [barbers, setBarbers] = useState<DisplayBarber[]>(FALLBACK_BARBERS);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);

  useEffect(() => {
    getBookingBarbers()
      .then(res => {
        const bookable = res.barbers.filter(b => b.isBookableOnline);
        if (bookable.length > 0) setBarbers(bookable.map(apiToDisplay));
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setIsLoadingBarbers(false));
  }, []);

  // Embla Carousel setup
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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const skeletons: (DisplayBarber | null)[] = [null, null, null, null];
  const mobileItems: (DisplayBarber | null)[] = isLoadingBarbers ? skeletons : barbers;
  const desktopItems: (DisplayBarber | null)[] = isLoadingBarbers ? skeletons : barbers;

  return (
    <section id="barbers" className="py-20 md:py-28 bg-background">
      <div className="container px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-heading font-bold text-sm tracking-widest mb-3">فريقنا</p>
          <h2 className="font-heading text-3xl md:text-4xl font-800 text-gold-gradient">اختَر حلاقك المفضل</h2>
        </div>

        {/* Booking Policy Notice */}
        <div className="gold-border-glow rounded-xl bg-card/50 p-5 mb-10 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gold-shimmer flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">✂️</span>
            </div>
            <div className="text-right">
              <p className="text-foreground font-medium mb-2">
                علشان نحافظ على جودة الخدمة، الحجز بيكون قبلها بـ <span className="text-primary font-bold">4 ساعات</span> ✂️
              </p>
              <p className="text-muted-foreground text-sm">
                ولو حابب تيجي فورًا، بتاخد دور وبتدخل في دورك علطول
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: Embla Carousel | Desktop: Grid */}
        <div className="relative max-w-5xl mx-auto md:block">
          {/* Mobile Carousel */}
          <div className="md:hidden overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 px-4">
              {mobileItems.map((barber, index) => (
                !barber ? (
                  <div key={`skel-${index}`} className="flex-[0_0_280px] min-w-0 gold-border-glow rounded-xl bg-card overflow-hidden animate-pulse">
                    <div className="aspect-[4/5] bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-muted rounded w-1/2 mx-auto" />
                      <div className="h-3 bg-muted rounded w-1/3 mx-auto" />
                      <div className="h-10 bg-muted rounded" />
                    </div>
                  </div>
                ) :
                  <div
                    key={barber.name}
                    className={`flex-[0_0_280px] min-w-0 gold-border-glow rounded-xl bg-card overflow-hidden group transition-all duration-500 ${index === selectedIndex ? "scale-[1.02] shadow-[0_8px_30px_hsl(43_90%_55%/0.2)]" : ""
                      }`}
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <img
                        src={barber.image}
                        alt={barber.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 text-center">
                      <h3 className="font-heading text-xl font-bold mb-1">{barber.name}</h3>
                      <p className="text-primary/80 text-sm mb-3">{barber.role}</p>
                      <button
                        onClick={() => setSelectedBarber(barber)}
                        className="gold-shimmer block w-full py-3 rounded-lg font-heading font-bold text-primary-foreground transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        {barber.buttonText}
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {desktopItems.map((barber, idx) => (
              !barber ? (
                <div key={`skel-d-${idx}`} className="gold-border-glow rounded-xl bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[4/5] bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-1/2 mx-auto" />
                    <div className="h-3 bg-muted rounded w-1/3 mx-auto" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </div>
              ) :
                <div
                  key={barber.name}
                  className="gold-border-glow rounded-xl bg-card overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(43_90%_55%/0.12)]"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={barber.image}
                      alt={barber.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-heading text-xl font-bold mb-1">{barber.name}</h3>
                    <p className="text-primary/80 text-sm mb-3">{barber.role}</p>
                    <button
                      onClick={() => setSelectedBarber(barber)}
                      className="gold-shimmer block w-full py-3 rounded-lg font-heading font-bold text-primary-foreground transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      {barber.buttonText}
                    </button>
                  </div>
                </div>
            ))
            }
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-center gap-4 mt-6">
            <button
              onClick={scrollPrev}
              disabled={selectedIndex === 0}
              className="w-10 h-10 rounded-full gold-shimmer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </button>

            <div className="flex gap-2">
              {scrollSnaps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === selectedIndex
                    ? "bg-primary w-6"
                    : "bg-primary/30 w-2 hover:bg-primary/50"
                    }`}
                  aria-label={`Go to barber ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={scrollNext}
              disabled={selectedIndex === Math.max(barbers.length - 1, 0)}
              className="w-10 h-10 rounded-full gold-shimmer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {selectedBarber && (
        <BookingModal
          open={!!selectedBarber}
          onOpenChange={(open) => !open && setSelectedBarber(null)}
          barber={selectedBarber}
        />
      )}
    </section>
  );
};

export default BarbersSection;
