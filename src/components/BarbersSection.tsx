"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Scissors, Clock, Loader2, Zap } from "lucide-react";
import { type BarberBookingInfo } from "./BookingModal";
import BarberPhoto from "./BarberPhoto";
import { getBookingStatus } from "@/lib/publicBookingApi";
import {
  listGlobalBarbers,
  resolveBarberPhotoUrl,
  resolveBarberDisplayName,
  filterBarbersForPublicDiscovery,
  type PublicBarber,
} from "@/lib/booking-api";
import { useBranch } from "@/context/BranchContext";
import { useBookingController } from "@/context/BookingController";

type DisplayBarber = BarberBookingInfo & { buttonText: string };

function hasEmpId(barber: { id?: number } | null | undefined): barber is { id: number } {
  return barber?.id != null && Number.isFinite(barber.id) && barber.id > 0;
}

function apiToDisplay(b: PublicBarber): DisplayBarber {
  return {
    id: b.id,
    name: resolveBarberDisplayName(b, "ar"),
    role: b.job ?? "حلاق محترف",
    image: resolveBarberPhotoUrl(b),
    location: "Cut Salon · الإسكندرية",
    buttonText: `احجز مع ${resolveBarberDisplayName(b, "ar")}`,
  };
}

const SkeletonCard = ({ className }: { className?: string }) => (
  <div
    className={`rounded-2xl border border-cut-gold/10 bg-cut-surface overflow-hidden animate-pulse ${className ?? ""}`}
  >
    <div className="aspect-[3/4] bg-cut-surface-elevated" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-cut-surface-elevated rounded w-1/2 mx-auto" />
      <div className="h-3 bg-cut-surface-elevated rounded w-1/3 mx-auto" />
      <div className="h-10 bg-cut-surface-elevated rounded-xl" />
    </div>
  </div>
);

const BarberCard = ({
  barber,
  onSelect,
  isActive,
}: {
  barber: DisplayBarber;
  onSelect: () => void;
  isActive?: boolean;
}) => {
  const canBook = hasEmpId(barber);
  return (
    <div
      className={`rounded-2xl border overflow-hidden group transition-all duration-300
      ${
        isActive
          ? "border-cut-gold/50 shadow-cut-glow scale-[1.02]"
          : "border-cut-gold/15 hover:border-cut-gold/35 hover:-translate-y-1 hover:shadow-cut-glow"
      } bg-gradient-to-br from-cut-black via-cut-burgundy-dark/30 to-cut-black`}
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <BarberPhoto
          src={barber.image}
          name={barber.name}
          imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cut-surface to-transparent" />
      </div>
      <div className="p-4 md:p-5 text-center -mt-2 relative z-10">
        <h3 className="cut-ar-ui-title font-heading text-lg md:text-xl font-bold text-cut-ivory mb-0.5">
          {barber.name}
        </h3>
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Scissors className="w-3 h-3 text-cut-gold" />
          <p className="cut-ar-meta text-cut-gold/70 text-xs font-medium">{barber.role}</p>
        </div>
        {canBook ? (
          <button
            type="button"
            onClick={onSelect}
            className="w-full py-2.5 rounded-xl font-heading font-bold text-sm text-cut-black transition-all
            bg-gradient-to-l from-cut-gold to-cut-gold
            shadow-[0_4px_20px_rgba(229,188,134,0.2)]
            hover:shadow-[0_6px_28px_rgba(229,188,134,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {barber.buttonText}
          </button>
        ) : (
          <p className="w-full py-2.5 text-cut-ivory/45 text-xs">الحجز الإلكتروني غير متاح لهذا الحلاق</p>
        )}
      </div>
    </div>
  );
};

type GroomBookingDetail = {
  serviceMatches: string[];
  serviceIds?: number[];
  note: string;
};

type BookingGate =
  | { status: "loading" }
  | { status: "branch" }
  | { status: "enabled" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

/** Nearest mode is branch_first — no empId required. */
const NEAREST_PLACEHOLDER_BARBER: DisplayBarber = {
  name: "أقرب حلاق متاح",
  image: null,
  role: "أقرب حلاق متاح",
  location: "Cut Salon · الإسكندرية",
  buttonText: "احجز أقرب ميعاد",
};

const BarbersSection = () => {
  const [bookingGate, setBookingGate] = useState<BookingGate>({ status: "loading" });
  const [groomBooking, setGroomBooking] = useState<GroomBookingDetail | null>(null);
  const [barbers, setBarbers] = useState<DisplayBarber[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  const [barbersError, setBarbersError] = useState<string | null>(null);
  const [barbersReload, setBarbersReload] = useState(0);
  const { openBooking } = useBookingController();
  const { isLoadingBranches, selectedBranch, branches } = useBranch();

  const openBarberFirst = (barber: DisplayBarber) => {
    if (!hasEmpId(barber)) return;
    openBooking({
      barber,
      entryMode: "barber_first",
      initialMode: "specific",
    });
  };

  const openNearestBooking = (groom?: GroomBookingDetail | null) => {
    const detail = groom ?? groomBooking;
    openBooking({
      barber: NEAREST_PLACEHOLDER_BARBER,
      entryMode: "branch_first",
      initialMode: "nearest",
      initialServiceMatches: detail?.serviceMatches,
      initialServiceIds: detail?.serviceIds,
      bookingNote: detail?.note,
    });
  };

  useEffect(() => {
    if (!selectedBranch?.branchCode) {
      setBookingGate({ status: isLoadingBranches ? "loading" : "branch" });
      return;
    }

    let cancelled = false;
    setBookingGate({ status: "loading" });
    getBookingStatus(selectedBranch.branchCode)
      .then((result) => {
        if (cancelled) return;
        setBookingGate(
          result.bookingEnabled
            ? { status: "enabled" }
            : {
                status: "unavailable",
                message:
                  result.message ||
                  "الحجز غير متاح اليوم. برجاء اتصل أو احجز عبر الواتساب",
              },
        );
      })
      .catch(() => {
        if (!cancelled) setBookingGate({ status: "error", message: "تعذر التحقق من حالة الحجز" });
      });

    return () => {
      cancelled = true;
    };
  }, [isLoadingBranches, selectedBranch?.branchCode]);

  useEffect(() => {
    const handleBookNearest = () => {
      openNearestBooking();
    };
    const handleBookGroom = (e: Event) => {
      const detail = (e as CustomEvent<GroomBookingDetail>).detail;
      if (!detail?.serviceMatches?.length && !detail?.serviceIds?.length) return;
      setGroomBooking(detail);
      openNearestBooking(detail);
    };
    const handleBookBarber = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string; image: string }>).detail;
      if (!detail?.name) return;
      const match = barbers.find(
        (b) =>
          hasEmpId(b) &&
          (b.name === detail.name ||
            b.name.includes(detail.name) ||
            detail.name.includes(b.name)),
      );
      if (match) openBarberFirst(match);
    };
    window.addEventListener("cut:book-nearest", handleBookNearest);
    window.addEventListener("cut:book-groom", handleBookGroom);
    window.addEventListener("cut:book-barber", handleBookBarber);
    return () => {
      window.removeEventListener("cut:book-nearest", handleBookNearest);
      window.removeEventListener("cut:book-groom", handleBookGroom);
      window.removeEventListener("cut:book-barber", handleBookBarber);
    };
  }, [barbers]);

  // Live public barbers only — no fallback identities on the booking path
  useEffect(() => {
    let cancelled = false;
    setIsLoadingBarbers(true);
    setBarbersError(null);
    listGlobalBarbers()
      .then((res) => {
        if (cancelled) return;
        const bookable = filterBarbersForPublicDiscovery(
          (res.data ?? []).filter((b) => hasEmpId(b)),
          branches,
        );
        setBarbers(bookable.map(apiToDisplay));
        if (bookable.length === 0) {
          setBarbersError("لا يوجد حلاقون متاحون للحجز الإلكتروني حالياً");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setBarbers([]);
        setBarbersError("تعذر تحميل قائمة الحلاقين، حاول مرة أخرى");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBarbers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [barbersReload, branches]);

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
    [emblaApi],
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
    emblaApi?.scrollPrev();
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  if (bookingGate.status === "unavailable" || bookingGate.status === "error") {
    const message = bookingGate.message;
    return (
      <section
        id="barbers"
        dir="rtl"
        className="relative isolate overflow-hidden bg-cut-black py-20 text-cut-ivory md:py-28"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(74,0,15,0.62),transparent_48%)]" />
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cut-bronze/15" />
        <div className="container relative z-10 px-5 md:px-8">
          <div className="mx-auto max-w-2xl overflow-hidden border border-cut-bronze/35 bg-[linear-gradient(145deg,rgba(23,4,6,0.98),rgba(5,5,5,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="h-px bg-gradient-to-l from-transparent via-cut-warm-beige to-transparent" />
            <div className="p-8 text-center md:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cut-bronze/45 bg-cut-burgundy/35">
                <Clock className="h-7 w-7 text-cut-bronze" />
              </div>
              <p className="mt-6 font-display text-xs tracking-[0.32em] text-cut-bronze">
                CUT SALON / BOOKING
              </p>
              <h2 className="cut-ar-section-heading mt-4 text-3xl font-black md:text-4xl">
                الحجز الإلكتروني غير متاح حاليًا
              </h2>
              <p className="mx-auto mt-4 max-w-md leading-8 text-cut-ivory/70">{message}</p>
              <div className="mx-auto mt-9 grid max-w-md gap-3 sm:grid-cols-2">
                <a
                  href="tel:035861483"
                  className="group flex min-h-14 flex-col items-center justify-center border border-cut-bronze/40 bg-cut-ivory/[0.03] px-4 transition hover:border-cut-warm-beige hover:bg-cut-burgundy/45"
                >
                  <span className="text-xs text-cut-ivory/55">اتصل للحجز</span>
                  <span
                    className="mt-1 font-display text-lg tracking-[0.08em] text-cut-warm-beige"
                    dir="ltr"
                  >
                    035861483
                  </span>
                </a>
                <a
                  href="tel:01012126899"
                  className="group flex min-h-14 flex-col items-center justify-center border border-cut-bronze/40 bg-cut-ivory/[0.03] px-4 transition hover:border-cut-warm-beige hover:bg-cut-burgundy/45"
                >
                  <span className="text-xs text-cut-ivory/55">اتصل للحجز</span>
                  <span
                    className="mt-1 font-display text-lg tracking-[0.08em] text-cut-warm-beige"
                    dir="ltr"
                  >
                    01012126899
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="barbers" className="relative py-20 md:py-28 bg-cut-black overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(229,188,134,0.06),transparent_60%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className="cut-editorial-label text-cut-gold font-heading font-bold text-sm tracking-widest mb-3">
            فريقنا
          </p>
          <h2 className="cut-ar-section-heading font-heading text-3xl md:text-4xl lg:text-5xl font-black text-cut-ivory">
            اختَر <span className="text-gold-gradient">حلاقك المفضل</span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <button
            type="button"
            onClick={openNearestBooking}
            className="w-full rounded-2xl border border-cut-gold/20 bg-gradient-to-l from-cut-gold/[0.08] to-cut-black/80 backdrop-blur-sm p-5 md:p-6 transition-all duration-300 cursor-pointer hover:border-cut-gold/40 hover:shadow-[0_0_32px_rgba(229,188,134,0.1)] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cut-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-cut-gold/20 transition-colors">
                <Zap className="w-6 h-6 text-cut-gold" />
              </div>
              <div className="text-right flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="cut-ar-ui-title text-cut-ivory font-heading font-bold text-sm md:text-base">
                    مش فارق معاك مين؟ احجز أقرب ميعاد
                  </p>
                  <span className="cut-ar-meta text-[9px] font-bold px-1.5 py-0.5 rounded bg-cut-gold/15 text-cut-gold border border-cut-gold/20">
                    أسرع
                  </span>
                </div>
                <p className="cut-ar-meta text-cut-ivory/65 text-xs md:text-sm">
                  النظام يختارلك أقرب حلاق متاح وأقرب وقت
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-xl bg-cut-gold/10 border border-cut-gold/20 group-hover:bg-cut-gold/20 transition-colors flex-shrink-0">
                <span className="cut-ar-ui-title text-cut-gold font-bold text-xs">احجز الآن</span>
              </div>
            </div>
          </button>
        </div>

        {barbersError && !isLoadingBarbers && (
          <div
            className="max-w-2xl mx-auto mb-8 rounded-2xl border border-red-400/30 bg-red-950/40 p-5 text-center"
            role="alert"
          >
            <p className="text-cut-ivory/90 text-sm mb-3">{barbersError}</p>
            <button
              type="button"
              onClick={() => setBarbersReload((n) => n + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cut-gold/30 text-cut-gold text-sm font-bold hover:bg-cut-gold/10 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <div className="md:hidden relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 px-2">
              {isLoadingBarbers
                ? [0, 1, 2].map((i) => (
                    <div key={`skel-${i}`} className="flex-[0_0_260px] min-w-0">
                      <SkeletonCard />
                    </div>
                  ))
                : barbers.map((barber, index) => (
                    <div key={`${barber.id}-${barber.name}`} className="flex-[0_0_260px] min-w-0">
                      <BarberCard
                        barber={barber}
                        onSelect={() => openBarberFirst(barber)}
                        isActive={index === selectedIndex}
                      />
                    </div>
                  ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={selectedIndex === 0}
              className="w-9 h-9 rounded-full border border-cut-gold/30 bg-cut-black flex items-center justify-center disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4 text-cut-gold" />
            </button>
            <div className="flex gap-1.5">
              {scrollSnaps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollTo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === selectedIndex ? "bg-cut-gold w-5" : "bg-white/15 w-1.5 hover:bg-white/30"}`}
                  aria-label={`Go to barber ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={scrollNext}
              disabled={selectedIndex === Math.max(barbers.length - 1, 0)}
              className="w-9 h-9 rounded-full border border-cut-gold/30 bg-cut-black flex items-center justify-center disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-cut-gold" />
            </button>
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {isLoadingBarbers
            ? [0, 1, 2, 3].map((i) => <SkeletonCard key={`skel-d-${i}`} />)
            : barbers.map((barber) => (
                <BarberCard
                  key={`${barber.id}-${barber.name}`}
                  barber={barber}
                  onSelect={() => openBarberFirst(barber)}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default BarbersSection;
