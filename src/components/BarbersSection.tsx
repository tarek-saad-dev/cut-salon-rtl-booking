import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import barberMohamed from "@/assets/barber-mohamed.jpg";
import barberBassem from "@/assets/barber-bassem.jpg";
import barberKareem from "@/assets/barber-kareem.jpg";
import youngZiad from "@/assets/young-ziad.jpg";
import barberZiad from "@/assets/barber-ziad.jpg";
import barberOmar from "@/assets/omar.png";
import barberYousef from "@/assets/yousef.jpg";
import barberAhmed from "@/assets/ahmed.jpg";
import CalendlyModal from "./CalendlyModal";

// Get current year-month for Calendly links
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const currentMonth = getCurrentMonth();

const barbers = [
  {
    name: "محمد",
    role: "حلاق",
    image: barberMohamed,
    buttonText: "احجز مع محمد",
    link: `https://calendly.com/saadfouad1976t2/cut-salon-mohamed-barber?month=${currentMonth}`,
  },
  {
    name: "باسم",
    role: "حلاق",
    image: barberBassem,
    buttonText: "احجز مع باسم",
    link: `https://calendly.com/saadfouad1976t3/cut-salon-bassem-barber?month=${currentMonth}`,
  },
  {
    name: "كريم",
    role: "حلاق",
    image: barberKareem,
    buttonText: "احجز مع كريم",
    link: `https://calendly.com/tsts20031976/cut-salob-kareem-barber?month=${currentMonth}`,
  },
  {
    name: "زياد",
    role: "اخصائي العناية بالبشرة",
    image: youngZiad,
    buttonText: "احجز مع زياد",
    link: `https://calendly.com/saadfouad1976tt/cut-salon-ziad-barber?month=${currentMonth}`,
  },
  {
    name: "زيزو",
    role: "حلاق",
    image: barberZiad,
    buttonText: "احجز مع زيزو",
    link: `https://calendly.com/placeholder/cut-salon-zizo-barber?month=${currentMonth}`,
  },
  {
    name: "عمر",
    role: "حلاق",
    image: barberOmar,
    buttonText: "احجز مع عمر",
    link: `https://calendly.com/placeholder/cut-salon-omar-barber?month=${currentMonth}`,
  },
  {
    name: "يوسف",
    role: "حلاق",
    image: barberYousef,
    buttonText: "احجز مع يوسف",
    link: `https://calendly.com/placeholder/cut-salon-yousef-barber?month=${currentMonth}`,
  },
  {
    name: "أحمد",
    role: "حلاق",
    image: barberAhmed,
    buttonText: "احجز مع أحمد",
    link: `https://calendly.com/placeholder/cut-salon-ahmed-barber?month=${currentMonth}`,
  },
];

const BarbersSection = () => {
  const [selectedBarber, setSelectedBarber] = useState<typeof barbers[0] | null>(null);

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
              {barbers.map((barber, index) => (
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
            {barbers.map((barber) => (
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
            ))}
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
              disabled={selectedIndex === barbers.length - 1}
              className="w-10 h-10 rounded-full gold-shimmer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {selectedBarber && (
        <CalendlyModal
          open={!!selectedBarber}
          onOpenChange={(open) => !open && setSelectedBarber(null)}
          url={selectedBarber.link}
          barberName={selectedBarber.name}
        />
      )}
    </section>
  );
};

export default BarbersSection;
