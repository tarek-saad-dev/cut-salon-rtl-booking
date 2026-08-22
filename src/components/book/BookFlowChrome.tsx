"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gift,
  Languages,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import BarberPhoto from "@/components/BarberPhoto";
import { BookCompactProgress } from "@/components/book/BookCompactProgress";
import { useBookCompactMode } from "@/components/book/useBookCompactMode";
import { useLanguage } from "@/context/LanguageContext";
import { useMobileNav } from "@/context/MobileNavContext";
import { getBranchVisual } from "@/lib/booking/branch-visuals";
import { navigationLabels } from "@/lib/i18n/navigation";

const WHATSAPP_URL = "https://wa.me/201012126899";

function HeroBranchBadge({
  label,
  branchCode,
  compact = false,
  variant = "dark",
  ar,
}: {
  label: string;
  branchCode?: string;
  compact?: boolean;
  variant?: "dark" | "light";
  ar: boolean;
}) {
  const accent = getBranchVisual(branchCode).accent;
  const isLight = variant === "light";

  return (
    <div
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border backdrop-blur-sm ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      } ${isLight ? "bg-cut-ivory/90" : "bg-cut-black/40"}`}
      style={{
        borderColor: `${accent}${isLight ? "55" : "66"}`,
        boxShadow: isLight
          ? `inset 0 1px 0 rgba(255,255,255,0.6)`
          : `0 0 0 1px ${accent}22, inset 0 1px 0 rgba(252,249,237,0.06)`,
      }}
    >
      <span
        className={`shrink-0 rounded-full ${compact ? "h-1.5 w-1.5" : "h-2 w-2"}`}
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <MapPin
        className={`shrink-0 ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`}
        style={{ color: accent }}
        strokeWidth={2}
        aria-hidden
      />
      <span
        className={`truncate font-bold ${
          isLight ? "text-cut-black" : "text-cut-warm-beige"
        } ${
          compact
            ? "text-[10px] tracking-wide"
            : `text-[11px] tracking-wide sm:text-xs ${ar ? "" : "uppercase tracking-[0.12em]"}`
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export type BookFlowChromeProps = {
  children: ReactNode;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  footer?: boolean;
  /** Primary title — hero overlay on mobile, hero center on desktop. */
  heroTitle?: string;
  /** Branch name shown above the step title when a branch is locked in. */
  heroBranchLabel?: string;
  /** Branch code for accent styling on the branch badge. */
  heroBranchCode?: string;
  /** Supporting line — desktop hero only. */
  heroMeta?: string;
  entryScroll?: boolean;
  /** Enable compact mobile booking shell (default true). */
  compact?: boolean;
  closeHref?: string;
  /** 1-based step index for compact progress. */
  stepIndex?: number;
  stepTotal?: number;
  avatarSrc?: string | null;
  avatarName?: string;
};

function CutLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-1 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
      aria-label="CUT Salon - Home"
    >
      <span
        className={`font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        —
      </span>
      <div className="mx-0.5 text-center">
        <span
          className={`font-brand font-black leading-none tracking-[0.22em] text-cut-ivory ${
            compact ? "text-base" : "text-xl"
          }`}
        >
          CUT
        </span>
        <div
          className={`-mt-0.5 font-semibold tracking-[0.45em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige ${
            compact ? "text-[6px]" : "text-[8px]"
          }`}
        >
          SALON
        </div>
      </div>
      <span
        className={`font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        —
      </span>
    </Link>
  );
}

export function BookFlowChrome({
  children,
  backHref,
  onBack,
  backLabel,
  footer = true,
  heroTitle,
  heroBranchLabel,
  heroBranchCode,
  heroMeta,
  entryScroll = true,
  compact = true,
  closeHref = "/",
  stepIndex,
  stepTotal,
  avatarSrc,
  avatarName,
}: BookFlowChromeProps) {
  const router = useRouter();
  const { lang, dir, setLang } = useLanguage();
  const { setBack } = useMobileNav();
  const ar = lang === "ar";
  const BackIcon = ar ? ChevronRight : ChevronLeft;
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const entryScrollDone = useRef(false);
  const reduceMotion = useReducedMotion();
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];
  const barberHref = "/#barbers";
  const closeMenu = () => setMenuOpen(false);

  useBookCompactMode(compact);

  useEffect(() => {
    if (!compact) {
      setBack({});
      return;
    }

    if (onBack || backHref) {
      setBack({
        visible: true,
        action: () => {
          if (onBack) onBack();
          else if (backHref) router.push(backHref);
        },
      });
    } else {
      setBack({ visible: true });
    }

    return () => setBack({});
  }, [compact, onBack, backHref, router, setBack]);

  const hasStepProgress =
    typeof stepIndex === "number" &&
    typeof stepTotal === "number" &&
    stepTotal > 0 &&
    stepIndex > 0;

  const stepLine =
    hasStepProgress && stepIndex != null && stepTotal != null
      ? ar
        ? `الخطوة ${stepIndex} من ${stepTotal}`
        : `Step ${stepIndex} of ${stepTotal}`
      : null;

  const handleContentScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el || !compact) return;
    setHeroCollapsed(el.scrollTop > 28);
  }, [compact]);

  useEffect(() => {
    if (!entryScroll || entryScrollDone.current || compact) return;
    entryScrollDone.current = true;

    const scrollToContent = () => {
      const hero = heroRef.current;
      const content = contentRef.current;
      if (!content) return;

      const rootStyles = getComputedStyle(document.documentElement);
      const campaignBar =
        parseFloat(rootStyles.getPropertyValue("--cut-campaign-bar-height")) || 0;
      const stickyTop = campaignBar + 56;

      let target = content.offsetTop - stickyTop;
      if (hero) {
        const hideHero = hero.offsetTop + hero.offsetHeight - stickyTop - 4;
        target = Math.max(target, hideHero);
      }

      window.scrollTo({
        top: Math.max(0, target),
        behavior: reduceMotion ? "instant" : "smooth",
      });
    };

    if (reduceMotion) {
      scrollToContent();
      return;
    }

    const timer = window.setTimeout(() => {
      requestAnimationFrame(scrollToContent);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [entryScroll, reduceMotion, compact]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const renderBackControl = (
    className: string,
    iconClass = "h-5 w-5",
  ) => {
    if (onBack) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          aria-label={backLabel ?? (ar ? "رجوع" : "Back")}
          className={className}
        >
          <BackIcon className={iconClass} strokeWidth={1.75} />
        </button>
      );
    }
    if (backHref) {
      return (
        <Link
          href={backHref}
          aria-label={backLabel ?? (ar ? "رجوع" : "Back")}
          className={className}
        >
          <BackIcon className={iconClass} strokeWidth={1.75} />
        </Link>
      );
    }
    return <span className="inline-flex h-10 w-10 shrink-0" aria-hidden />;
  };

  const navItemClass =
    "flex min-h-[3.25rem] w-full items-center border-b border-cut-bronze py-3.5 text-start text-[1.05rem] font-semibold tracking-wide text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-warm-beige";

  const heroHeadingBlock = (
    <div
      className={`flex flex-col items-start md:items-center ${
        heroBranchLabel ? "gap-3" : "gap-1.5"
      }`}
    >
      {heroBranchLabel ? (
        <HeroBranchBadge
          label={heroBranchLabel}
          branchCode={heroBranchCode}
          ar={ar}
        />
      ) : null}
      {heroTitle ? (
        <h1 className="truncate font-display text-[1.05rem] font-bold leading-tight text-cut-ivory md:text-[clamp(1.75rem,5.2vw,2.5rem)] md:leading-tight">
          {heroTitle}
        </h1>
      ) : null}
    </div>
  );

  return (
    <main
      dir={dir}
      lang={lang}
      className={`overflow-x-hidden bg-cut-soft-ivory text-cut-black ${
        compact
          ? "max-md:flex max-md:h-[calc(100dvh-var(--cut-mobile-nav-total,3.25rem))] max-md:flex-col max-md:overflow-hidden"
          : ""
      } md:min-h-[100svh]`}
      data-book-shell={compact ? "compact" : "full"}
    >
      {/* ── Mobile collapsed scroll strip (back lives in GlobalMobileNav) ── */}
      {compact && heroCollapsed && heroTitle ? (
        <div
          className={`flex shrink-0 items-center gap-2 border-b border-cut-black/10 bg-cut-soft-ivory/95 px-3 backdrop-blur-sm md:hidden ${
            heroBranchLabel ? "min-h-11 py-1" : "h-10"
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {avatarSrc ? (
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-cut-black/10">
                <BarberPhoto
                  src={avatarSrc}
                  name={avatarName ?? heroTitle}
                  imgClassName="h-full w-full object-cover object-top"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {heroBranchLabel ? (
                <div className="mb-1.5">
                  <HeroBranchBadge
                    label={heroBranchLabel}
                    branchCode={heroBranchCode}
                    compact
                    variant="light"
                    ar={ar}
                  />
                </div>
              ) : null}
              <p className="truncate text-[13px] font-bold text-cut-black">{heroTitle}</p>
            </div>
          </div>
          {hasStepProgress && stepIndex != null && stepTotal != null ? (
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-cut-black/45">
              {stepIndex}/{stepTotal}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* ── Mobile compact hero (~100–120px) ── */}
      {compact && !heroCollapsed ? (
        <section
          className="relative h-[7.5rem] max-h-[130px] min-h-[95px] shrink-0 overflow-hidden bg-cut-black md:hidden"
          aria-label={heroTitle ?? (ar ? "الحجز" : "Booking")}
        >
          <img
            src="/hero_vertical.png"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[center_15%] opacity-40"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.55)_0%,rgba(23,4,6,0.72)_100%)]" />
          <div
            className={`relative z-10 flex h-full flex-col justify-end px-4 pb-3 ${
              heroBranchLabel ? "pt-4" : "pt-2"
            }`}
          >
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                {heroHeadingBlock}
                {stepLine ? (
                  <p className="mt-0.5 text-[11px] font-medium text-cut-soft-ivory/75">
                    {stepLine}
                  </p>
                ) : heroMeta && !heroBranchLabel ? (
                  <p className="mt-0.5 truncate text-[11px] text-cut-soft-ivory/70">
                    {heroMeta}
                  </p>
                ) : null}
              </div>
              {avatarSrc ? (
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-cut-ivory/25">
                  <BarberPhoto
                    src={avatarSrc}
                    name={avatarName ?? heroTitle ?? ""}
                    imgClassName="h-full w-full object-cover object-top"
                  />
                </div>
              ) : null}
            </div>
            {hasStepProgress && stepIndex != null && stepTotal != null ? (
              <div className="mt-2">
                <BookCompactProgress current={stepIndex} total={stepTotal} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── Desktop full chrome ── */}
      <div className="hidden md:block">
        <div
          className="w-full shrink-0"
          style={{ height: "var(--cut-campaign-bar-height, 0px)" }}
          aria-hidden
        />
        <header className="sticky top-[var(--cut-campaign-bar-height,0px)] z-30 border-b border-cut-bronze/20 bg-cut-black text-cut-ivory transition-[top] duration-200">
          <div className="relative flex h-14 items-center justify-center px-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={label("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="book-side-navigation"
              className={`absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-cut-warm-beige/45 bg-cut-ivory/10 text-cut-ivory shadow-[0_0_0_1px_rgba(252,249,237,0.08)] transition hover:border-cut-warm-beige hover:bg-cut-ivory/15 hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${
                ar ? "right-3" : "left-3"
              }`}
            >
              <Menu className="h-6 w-6" strokeWidth={2.35} />
            </button>
            <CutLogo />
            <Link
              href="/booking"
              className={`absolute top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 text-xs font-semibold text-cut-ivory/75 transition hover:text-cut-warm-beige ${
                ar ? "left-4" : "right-4"
              }`}
            >
              {ar ? "مواعيدك" : "Appointments"}
              <ExternalLink className="h-3 w-3 opacity-80" strokeWidth={1.75} />
            </Link>
          </div>
        </header>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="book-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 hidden bg-cut-black/70 md:block"
              onClick={closeMenu}
            />
            <motion.aside
              key="book-nav-drawer"
              id="book-side-navigation"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className={`fixed inset-y-0 z-50 hidden w-[min(22rem,86vw)] flex-col bg-[#1f1c1b] md:flex ${
                dir === "rtl" ? "right-0" : "left-0"
              }`}
              style={{ top: "var(--cut-campaign-bar-height, 0px)" }}
              dir={dir}
              aria-label={ar ? "قائمة التنقل" : "Navigation menu"}
            >
              <div className="flex items-center px-5 pt-5 pb-2">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label={label("closeMenu")}
                  className="inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                >
                  <X className="h-6 w-6" strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 pb-6 pt-2">
                <nav aria-label={ar ? "روابط الموقع" : "Site links"}>
                  <Link href="/" onClick={closeMenu} className={navItemClass}>
                    {label("home")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      router.push("/book");
                    }}
                    className={navItemClass}
                  >
                    {label("booking")}
                  </button>
                  <Link href="/#services" onClick={closeMenu} className={navItemClass}>
                    {label("services")}
                  </Link>
                  <Link href="/prices" onClick={closeMenu} className={navItemClass}>
                    {label("prices")}
                  </Link>
                  <Link href={barberHref} onClick={closeMenu} className={navItemClass}>
                    {label("barbers")}
                  </Link>
                  <Link
                    href="/client/loyalty"
                    onClick={closeMenu}
                    className="relative mt-4 mb-1 block overflow-hidden rounded-2xl border border-cut-burgundy/20 bg-gradient-to-br from-cut-ivory via-cut-soft-ivory to-cut-warm-paper p-4 shadow-[0_12px_32px_rgba(74,0,15,0.1)] ring-1 ring-cut-burgundy/5 transition hover:border-cut-burgundy/35 hover:shadow-[0_14px_36px_rgba(74,0,15,0.14)]"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -end-6 -top-8 h-24 w-24 rounded-full bg-cut-burgundy/10 blur-2xl"
                    />
                    <span className="relative flex items-start gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cut-burgundy/20 bg-cut-burgundy/10 text-cut-burgundy">
                        <Gift className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cut-burgundy">
                          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
                          {label("loyaltyCtaTitle")}
                        </span>
                        <span className="mt-1 block text-[1.05rem] font-black tracking-wide text-cut-black">
                          {label("loyaltyCtaJoin")}
                        </span>
                        <span className="mt-1.5 block text-[12px] font-medium leading-5 text-cut-burgundy/80">
                          {label("loyaltyCtaHint")}
                        </span>
                      </span>
                    </span>
                  </Link>
                </nav>

                <div className="mt-auto flex flex-col pt-10">
                  <div className="border-t border-cut-bronze/80" />
                  <div className="space-y-3 py-5">
                    <Link
                      href="/client"
                      onClick={closeMenu}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-cut-bronze/25 bg-cut-black/35 px-4 text-[1.02rem] font-semibold text-cut-ivory transition hover:border-cut-warm-beige/40 hover:bg-cut-black/55"
                    >
                      <User className="h-4 w-4 text-cut-warm-beige" strokeWidth={1.9} />
                      {label("account")}
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setLang(lang === "ar" ? "en" : "ar");
                        closeMenu();
                      }}
                      aria-label={ar ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
                      className="flex w-full flex-col gap-2 rounded-xl border border-cut-warm-beige/35 bg-gradient-to-l from-cut-burgundy/40 to-cut-black/50 px-4 py-3 text-start transition hover:border-cut-warm-beige/60 hover:from-cut-burgundy/55"
                    >
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cut-warm-beige/90">
                        <Languages className="h-3.5 w-3.5" strokeWidth={2} />
                        {ar ? "اللغة" : "Language"}
                      </span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-cut-ivory">
                          {ar ? "التبديل إلى English" : "Switch to العربية"}
                        </span>
                        <span
                          className="inline-flex overflow-hidden rounded-full border border-cut-bronze/40 bg-cut-black/60 p-0.5 text-[11px] font-black tracking-wide"
                          aria-hidden
                        >
                          <span
                            className={`rounded-full px-2.5 py-1 transition ${
                              ar ? "bg-cut-warm-beige text-cut-black" : "text-cut-ivory/45"
                            }`}
                          >
                            AR
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 transition ${
                              !ar ? "bg-cut-warm-beige text-cut-black" : "text-cut-ivory/45"
                            }`}
                          >
                            EN
                          </span>
                        </span>
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-cut-bronze/80" />
                  <div className="flex items-center justify-center gap-8 py-7">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label("whatsapp")}
                      className="text-cut-ivory transition hover:text-cut-gold"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <a
                      href="tel:01012126899"
                      aria-label={ar ? "اتصل بنا" : "Call us"}
                      className="text-cut-ivory transition hover:text-cut-gold"
                    >
                      <Phone className="h-5 w-5" strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section
        ref={heroRef}
        className={`relative hidden overflow-hidden bg-cut-black md:block ${
          heroTitle
            ? "h-[28svh] min-h-[180px] max-h-[240px] sm:h-[220px]"
            : "h-[22svh] min-h-[140px] max-h-[200px] sm:h-[180px]"
        }`}
      >
        <img
          src="/hero_vertical.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_22%] opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.35)_0%,rgba(23,4,6,0.35)_40%,rgba(5,5,5,0.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(74,0,15,0.45),transparent_55%)]" />
        {onBack || backHref
          ? renderBackControl(
              `absolute top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-xl text-cut-ivory transition hover:bg-cut-ivory/15 hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${
                ar ? "right-3" : "left-3"
              }`,
              "h-6 w-6",
            )
          : null}

        {heroTitle || heroBranchLabel ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 sm:px-8">
            <div className="mx-auto flex max-w-lg flex-col items-center gap-3 text-center">
              {heroHeadingBlock}
              {heroMeta && !heroBranchLabel ? (
                <p className="mt-3 text-[13px] font-medium leading-6 tracking-wide text-cut-soft-ivory/80 sm:text-sm">
                  {heroMeta}
                </p>
              ) : null}
              {hasStepProgress && stepIndex != null && stepTotal != null ? (
                <div className="mx-auto mt-4 max-w-xs">
                  <BookCompactProgress current={stepIndex} total={stepTotal} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <div
        ref={contentRef}
        id="book-main-content"
        onScroll={handleContentScroll}
        className={`${
          compact ? "max-md:flex-1 max-md:min-h-0 max-md:overflow-y-auto" : ""
        } scroll-mt-[calc(var(--cut-campaign-bar-height,0px)+3.5rem)]`}
      >
        {children}
      </div>

      {footer ? (
        <footer className="hidden border-t border-cut-black/10 px-5 py-8 text-center sm:px-8 md:block">
          <p className="text-[11px] tracking-[0.2em] text-cut-black/40">CUT SALON · ALEXANDRIA</p>
          <Link
            href="/"
            className="mt-3 inline-block text-xs font-semibold text-cut-burgundy hover:text-cut-black"
          >
            {ar ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </footer>
      ) : null}
    </main>
  );
}
