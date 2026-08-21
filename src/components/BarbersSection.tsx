"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Scissors, Clock, Zap } from "lucide-react";
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
import { useLanguage } from "@/context/LanguageContext";
import { useBarberCardPrefetch } from "@/hooks/useBarberCardPrefetch";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";
import type { Language } from "@/lib/i18n/types";

type DisplayBarber = BarberBookingInfo & {
  buttonText: string;
  publicBranches?: { branchCode: string; branchName: string }[];
  serviceIds?: number[];
};

function hasEmpId(barber: { id?: number } | null | undefined): barber is { id: number } {
  return barber?.id != null && Number.isFinite(barber.id) && barber.id > 0;
}

function apiToDisplay(b: PublicBarber, lang: Language): DisplayBarber {
  const t = landingCopy.barbers;
  const name = resolveBarberDisplayName(b, lang);
  return {
    id: b.id,
    name,
    role: b.job ?? tx(t.professionalRole, lang),
    image: resolveBarberPhotoUrl(b),
    location: tx(t.location, lang),
    buttonText: `${tx(t.bookWith, lang)} ${name}`,
    publicBranches: b.branches,
    serviceIds: b.serviceIds,
  };
}

const CARD_SCROLL_PX = 288;

const SkeletonCard = ({ className }: { className?: string }) => (
  <div
    className={`overflow-hidden rounded-2xl border border-cut-warm-beige/20 bg-cut-wine-black/80 animate-pulse ${className ?? ""}`}
  >
    <div className="aspect-[3/4] bg-cut-burgundy-dark/50" />
    <div className="space-y-3 p-5">
      <div className="mx-auto h-5 w-1/2 rounded bg-cut-warm-beige/15" />
      <div className="mx-auto h-3 w-1/3 rounded bg-cut-warm-beige/10" />
      <div className="h-10 rounded-xl bg-cut-warm-beige/15" />
    </div>
  </div>
);

const BarberCard = ({
  barber,
  onSelect,
  isActive,
  unavailableLabel,
}: {
  barber: DisplayBarber;
  onSelect: () => void;
  isActive?: boolean;
  unavailableLabel: string;
}) => {
  const canBook = hasEmpId(barber);
  const { rootRef, prefetchHandlers } = useBarberCardPrefetch({
    empId: barber.id,
    seed:
      barber.id != null
        ? {
            empId: barber.id,
            displayName: barber.name,
            image: barber.image,
            publicBranches: barber.publicBranches,
            serviceIds: barber.serviceIds,
          }
        : null,
  });
  return (
    <div
      ref={rootRef as React.RefObject<HTMLDivElement>}
      onPointerEnter={prefetchHandlers.onPointerEnter}
      onFocus={prefetchHandlers.onFocus}
      onTouchStart={prefetchHandlers.onTouchStart}
      className={`group overflow-hidden rounded-2xl border bg-[linear-gradient(160deg,rgba(244,235,221,0.07),rgba(74,0,15,0.35)_45%,rgba(5,5,5,0.95))] transition-all duration-300 ${
        isActive
          ? "border-cut-warm-beige/55 shadow-[0_0_36px_rgba(74,0,15,0.55)] scale-[1.02]"
          : "border-cut-warm-beige/20 hover:border-cut-warm-beige/45 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(74,0,15,0.4)]"
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <BarberPhoto
          src={barber.image}
          name={barber.name}
          imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cut-wine-black via-cut-wine-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(74,0,15,0.25)]" />
      </div>
      <div className="relative z-10 -mt-2 p-4 text-center md:p-5">
        <h3 className="cut-ar-ui-title mb-0.5 font-heading text-lg font-bold text-cut-soft-ivory md:text-xl">
          {barber.name}
        </h3>
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <Scissors className="h-3 w-3 text-cut-warm-beige" />
          <p className="cut-ar-meta text-xs font-medium text-cut-warm-beige/80">{barber.role}</p>
        </div>
        {canBook ? (
          <button
            type="button"
            onClick={onSelect}
            className="w-full cursor-pointer rounded-xl bg-cut-soft-ivory py-2.5 font-heading text-sm font-bold text-cut-burgundy shadow-[0_4px_22px_rgba(210,183,163,0.22)] transition-all hover:bg-cut-warm-paper hover:shadow-[0_6px_28px_rgba(74,0,15,0.35)] hover:scale-[1.02] active:scale-[0.98]"
          >
            {barber.buttonText}
          </button>
        ) : (
          <p className="w-full py-2.5 text-xs text-cut-soft-ivory/45">{unavailableLabel}</p>
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

const BarbersSection = () => {
  const { lang, dir } = useLanguage();
  const t = landingCopy.barbers;
  const [bookingGate, setBookingGate] = useState<BookingGate>({ status: "loading" });
  const [groomBooking, setGroomBooking] = useState<GroomBookingDetail | null>(null);
  const [barbers, setBarbers] = useState<DisplayBarber[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  const [barbersError, setBarbersError] = useState<string | null>(null);
  const [barbersReload, setBarbersReload] = useState(0);
  const router = useRouter();
  const { isLoadingBranches, selectedBranch, branches } = useBranch();

  const railRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const openBarberFirst = (barber: DisplayBarber) => {
    if (!hasEmpId(barber)) return;
    router.push(`/book?mode=barber&empId=${barber.id}`);
  };

  const openNearestBooking = (_groom?: GroomBookingDetail | null) => {
    router.push("/book?mode=nearest");
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
                message: result.message || tx(t.bookingClosedDefault, lang),
              },
        );
      })
      .catch(() => {
        if (!cancelled) setBookingGate({ status: "error", message: tx(t.bookingStatusError, lang) });
      });

    return () => {
      cancelled = true;
    };
  }, [isLoadingBranches, selectedBranch?.branchCode, lang]);

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
    const handleBookBranch = (e: Event) => {
      const detail = (e as CustomEvent<{ branchCode: string; mode?: "nearest" | "specific" }>).detail;
      if (!detail?.branchCode) return;
      const params = new URLSearchParams({
        mode: detail.mode === "specific" ? "branch" : "nearest",
        branch: detail.branchCode,
      });
      router.push(`/book?${params.toString()}`);
    };
    window.addEventListener("cut:book-nearest", handleBookNearest);
    window.addEventListener("cut:book-groom", handleBookGroom);
    window.addEventListener("cut:book-barber", handleBookBarber);
    window.addEventListener("cut:book-branch", handleBookBranch);
    return () => {
      window.removeEventListener("cut:book-nearest", handleBookNearest);
      window.removeEventListener("cut:book-groom", handleBookGroom);
      window.removeEventListener("cut:book-barber", handleBookBarber);
      window.removeEventListener("cut:book-branch", handleBookBranch);
    };
  }, [barbers, groomBooking, router, openBarberFirst, openNearestBooking]);

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
        setBarbers(bookable.map((b) => apiToDisplay(b, lang)));
        if (bookable.length === 0) {
          setBarbersError(tx(t.noBarbers, lang));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setBarbers([]);
        setBarbersError(tx(t.loadError, lang));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBarbers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [barbersReload, branches, lang]);

  const updateRailState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = Math.abs(el.scrollLeft);
    // LTR rail: scrollLeft 0 = start
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < maxScroll - 4);
    const idx = Math.round(left / CARD_SCROLL_PX);
    const count = isLoadingBarbers ? 3 : Math.max(barbers.length, 1);
    setSelectedIndex(Math.min(Math.max(idx, 0), count - 1));
  }, [barbers.length, isLoadingBarbers]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    updateRailState();
    el.addEventListener("scroll", updateRailState, { passive: true });
    window.addEventListener("resize", updateRailState);
    return () => {
      el.removeEventListener("scroll", updateRailState);
      window.removeEventListener("resize", updateRailState);
    };
  }, [updateRailState, barbers, isLoadingBarbers]);

  const scrollRail = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_SCROLL_PX, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: index * CARD_SCROLL_PX, behavior: "smooth" });
  };

  const dotCount = isLoadingBarbers ? 3 : barbers.length;

  if (bookingGate.status === "unavailable" || bookingGate.status === "error") {
    const message = bookingGate.message;
    return (
      <section
        id="barbers"
        dir={dir}
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
                {tx(t.closedEyebrow, lang)}
              </p>
              <h2 className="cut-ar-section-heading mt-4 text-3xl font-black md:text-4xl">
                {tx(t.closedTitle, lang)}
              </h2>
              <p className="mx-auto mt-4 max-w-md leading-8 text-cut-ivory/70">{message}</p>
              <div className="mx-auto mt-9 grid max-w-md gap-3 sm:grid-cols-2">
                <a
                  href="tel:035861483"
                  className="group flex min-h-14 flex-col items-center justify-center border border-cut-bronze/40 bg-cut-ivory/[0.03] px-4 transition hover:border-cut-warm-beige hover:bg-cut-burgundy/45"
                >
                  <span className="text-xs text-cut-ivory/55">{tx(t.callToBook, lang)}</span>
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
                  <span className="text-xs text-cut-ivory/55">{tx(t.callToBook, lang)}</span>
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
    <section id="barbers" dir={dir} className="relative overflow-hidden bg-cut-black py-20 md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(74,0,15,0.45),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-40 bg-[radial-gradient(ellipse_at_center,rgba(210,183,163,0.08),transparent_70%)]" />

      <div className="container relative z-10 px-4">
        <div className="mb-0 text-center">
          <p className="cut-editorial-label mb-3 font-heading text-sm font-bold tracking-widest text-cut-bronze">
            {tx(t.teamLabel, lang)}
          </p>
          <h2 className="cut-ar-section-heading relative mx-auto max-w-3xl text-3xl md:text-4xl lg:text-5xl">
            <span className="relative inline-block">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-x-8 -inset-y-4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,0,15,0.4),transparent_70%)] blur-xl"
              />
              <span className="relative text-cut-ivory/95">{tx(t.titleLead, lang)}</span>
              <span className="relative bg-[linear-gradient(115deg,#FCF9ED_0%,#F4EBDD_35%,#EFE4D2_65%,#FCF9ED_100%)] bg-[length:200%_100%] bg-clip-text text-transparent [animation:cut-barber-title-shine_5s_ease-in-out_infinite]">
                {tx(t.titleAccent, lang)}
              </span>
            </span>
          </h2>
        </div>

        {/* Button exactly centered between the two lines */}
        <div className="mx-auto mt-8 flex max-w-md flex-col items-center">
          <div className="h-px w-24 bg-gradient-to-l from-transparent via-cut-soft-ivory/55 to-transparent" />
          <div className="flex w-full items-center justify-center py-8">
            <button
              type="button"
              onClick={openNearestBooking}
              className="group relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-full bg-cut-soft-ivory px-6 text-cut-burgundy shadow-[0_8px_28px_rgba(244,235,221,0.22),0_0_0_1px_rgba(244,235,221,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cut-ivory hover:shadow-[0_14px_36px_rgba(244,235,221,0.32),0_0_40px_rgba(74,0,15,0.45)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-soft-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-cut-black"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(74,0,15,0.12),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <Zap className="relative h-5 w-5 shrink-0 text-cut-burgundy transition-transform duration-300 group-hover:scale-110" />
              <span className="cut-ar-ui-title relative font-heading text-[15px] font-bold tracking-wide md:text-base">
                {tx(t.nearestCta, lang)}
              </span>
              <span className="relative rounded-full bg-cut-burgundy px-2.5 py-1 text-[10px] font-bold text-cut-soft-ivory shadow-sm">
                {tx(t.nearestBadge, lang)}
              </span>
            </button>
          </div>
          <div className="h-px w-24 bg-gradient-to-l from-transparent via-cut-soft-ivory/70 to-transparent" />
        </div>

        {/* Caption exactly centered between bottom line and barber cards */}
        <div className="flex items-center justify-center py-8">
          <p className="text-center text-[13px] text-cut-soft-ivory/55">{tx(t.browseCaption, lang)}</p>
        </div>

        {barbersError && !isLoadingBarbers && (
          <div
            className="mx-auto mb-8 max-w-2xl rounded-2xl border border-red-400/30 bg-red-950/40 p-5 text-center"
            role="alert"
          >
            <p className="mb-3 text-sm text-cut-ivory/90">{barbersError}</p>
            <button
              type="button"
              onClick={() => setBarbersReload((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-cut-warm-beige/30 px-4 py-2 text-sm font-bold text-cut-warm-beige transition-colors hover:bg-cut-warm-beige/10"
            >
              {tx(t.retry, lang)}
            </button>
          </div>
        )}

        {/* Mobile: native snap rail (LTR track = reliable touch scroll) */}
        <div className="relative md:hidden">
          <div
            ref={railRef}
            dir="ltr"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {isLoadingBarbers
              ? [0, 1, 2].map((i) => (
                  <div
                    key={`skel-${i}`}
                    className="w-[min(78vw,280px)] flex-none snap-center"
                  >
                    <SkeletonCard />
                  </div>
                ))
              : barbers.map((barber, index) => (
                  <div
                    key={`${barber.id}-${barber.name}`}
                    className="w-[min(78vw,280px)] flex-none snap-center"
                    dir={dir}
                  >
                    <BarberCard
                      barber={barber}
                      onSelect={() => openBarberFirst(barber)}
                      isActive={index === selectedIndex}
                      unavailableLabel={tx(t.onlineUnavailableForBarber, lang)}
                    />
                  </div>
                ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              disabled={!canScrollPrev}
              aria-label={lang === "ar" ? "السابق" : "Previous"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cut-warm-beige/35 bg-cut-wine-black transition-all active:scale-95 disabled:opacity-25"
            >
              <ChevronLeft className="h-4 w-4 text-cut-warm-beige" />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: dotCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === selectedIndex
                      ? "w-5 bg-cut-warm-beige shadow-[0_0_10px_rgba(210,183,163,0.55)]"
                      : "w-1.5 bg-cut-soft-ivory/20 hover:bg-cut-soft-ivory/40"
                  }`}
                  aria-label={lang === "ar" ? `الحلاق ${idx + 1}` : `Barber ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              disabled={!canScrollNext}
              aria-label={lang === "ar" ? "التالي" : "Next"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cut-warm-beige/35 bg-cut-wine-black transition-all active:scale-95 disabled:opacity-25"
            >
              <ChevronRight className="h-4 w-4 text-cut-warm-beige" />
            </button>
          </div>
        </div>

        <div className="mx-auto hidden max-w-5xl gap-5 md:grid md:grid-cols-2 lg:grid-cols-4">
          {isLoadingBarbers
            ? [0, 1, 2, 3].map((i) => <SkeletonCard key={`skel-d-${i}`} />)
            : barbers.map((barber) => (
                <BarberCard
                  key={`${barber.id}-${barber.name}`}
                  barber={barber}
                  onSelect={() => openBarberFirst(barber)}
                  unavailableLabel={tx(t.onlineUnavailableForBarber, lang)}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default BarbersSection;
