"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gift,
  Menu,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useMobileNavOptional } from "@/context/MobileNavContext";
import { useMobileNavAppearance } from "@/hooks/useMobileNavAppearance";
import { navigationLabels } from "@/lib/i18n/navigation";

type NavLink = {
  key: keyof typeof navigationLabels | "appointments";
  href: string;
  labels?: { ar: string; en: string };
};

const MENU_LINKS: NavLink[] = [
  { key: "home", href: "/" },
  { key: "services", href: "/#services" },
  { key: "prices", href: "/prices" },
  { key: "barbers", href: "/#barbers" },
  { key: "branches", href: "/#branches" },
  { key: "booking", href: "/book" },
  {
    key: "appointments",
    href: "/booking",
    labels: { ar: "مواعيدك", en: "Appointments" },
  },
];

function linkLabel(link: NavLink, lang: "ar" | "en") {
  if (link.labels) return link.labels[lang];
  return navigationLabels[link.key as keyof typeof navigationLabels][lang];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CutLogoMark({ compact = true }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex select-none items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
      aria-label="CUT Salon - Home"
    >
      <span
        className={`font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        —
      </span>
      <span className="mx-0.5 text-center">
        <span
          className={`font-brand font-black leading-none tracking-[0.2em] text-cut-ivory ${
            compact ? "text-[15px]" : "text-lg"
          }`}
        >
          CUT
        </span>
        <span
          className={`-mt-0.5 block font-semibold tracking-[0.42em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige ${
            compact ? "text-[5px]" : "text-[7px]"
          }`}
        >
          SALON
        </span>
      </span>
      <span
        className={`font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        —
      </span>
    </Link>
  );
}

function LangSwitch({ overlayTransparent }: { overlayTransparent: boolean }) {
  const { lang, setLang } = useLanguage();

  const inactive = overlayTransparent ? "text-cut-ivory/45" : "text-cut-ivory/40";
  const active = "text-cut-ivory";
  const dot = overlayTransparent ? "text-cut-ivory/35" : "text-cut-ivory/30";

  return (
    <div
      className="inline-flex items-center gap-0.5 text-[10px] font-black tracking-[0.08em]"
      role="group"
      aria-label={lang === "ar" ? "اللغة" : "Language"}
    >
      <button
        type="button"
        onClick={() => setLang("ar")}
        className={`min-h-9 min-w-7 px-0.5 transition ${lang === "ar" ? active : inactive}`}
        aria-pressed={lang === "ar"}
      >
        AR
      </button>
      <span className={dot} aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`min-h-9 min-w-7 px-0.5 transition ${lang === "en" ? active : inactive}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}

export default function GlobalMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const mobileNav = useMobileNavOptional();
  const { overlayTransparent, hasHeroOverlay } = useMobileNavAppearance();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];

  const isHome = pathname === "/" || pathname === "";
  const showBack = mobileNav?.back.visible ?? !isHome;

  const handleBack = () => {
    if (mobileNav?.back.action) {
      mobileNav.back.action();
      return;
    }
    router.back();
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen && wasOpenRef.current) menuTriggerRef.current?.focus();
    wasOpenRef.current = menuOpen;
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  const navBg = overlayTransparent
    ? "bg-[rgba(0,0,0,0.25)] border-b border-transparent"
    : "bg-[rgba(5,5,5,0.94)] backdrop-blur-md border-b border-cut-bronze/15";

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-lg text-cut-ivory transition hover:bg-cut-ivory/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige";

  return (
    <>
      <header
        className={`fixed inset-x-0 z-[55] transition-[background-color,backdrop-filter,border-color] duration-200 lg:hidden ${navBg}`}
        style={{
          top: "var(--cut-campaign-bar-height, 0px)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
        dir={dir}
        data-global-mobile-nav
      >
        <div className="relative mx-auto flex h-[3.25rem] max-w-[100vw] items-center px-2 sm:px-3">
          <div className="flex min-w-[5.5rem] items-center gap-0.5">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label={lang === "ar" ? "رجوع" : "Back"}
                className={iconBtn}
              >
                <BackIcon className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
            <LangSwitch overlayTransparent={overlayTransparent} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <div className="pointer-events-auto">
              <CutLogoMark />
            </div>
          </div>

          <div className="ms-auto flex min-w-[2.5rem] justify-end">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? label("closeMenu") : label("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="global-mobile-navigation"
              className={iconBtn}
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Flow spacer — skipped when a hero pulls content under the fixed bar */}
      {!hasHeroOverlay ? (
        <div
          className="pointer-events-none shrink-0 lg:hidden"
          aria-hidden
          style={{ height: "var(--cut-mobile-nav-total, 3.25rem)" }}
        />
      ) : null}

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              key="global-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[56] bg-cut-black/60 lg:hidden"
              aria-label={label("closeMenu")}
              onClick={closeMenu}
            />
            <motion.div
              key="global-nav-sheet"
              id="global-mobile-navigation"
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-[57] max-h-[min(85svh,640px)] overflow-hidden rounded-t-[1.25rem] border border-cut-bronze/20 bg-[#1a1716] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] lg:hidden"
              dir={dir}
            >
              <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-cut-ivory/20" />
              </div>

              <div className="flex items-center justify-between border-b border-cut-bronze/15 px-4 pb-3 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cut-bronze">
                  CUT SALON
                </p>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label={label("closeMenu")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cut-ivory/80 hover:bg-cut-ivory/10"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              <nav
                className="overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
                aria-label={lang === "ar" ? "قائمة التنقل" : "Navigation menu"}
              >
                <Link
                  href="/book"
                  onClick={closeMenu}
                  className="mb-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cut-burgundy px-4 text-sm font-black tracking-wide text-cut-ivory shadow-[0_8px_24px_rgba(74,0,15,0.35)]"
                >
                  <Calendar className="h-4 w-4" strokeWidth={2.25} />
                  {label("booking")}
                </Link>

                <ul className="space-y-0.5">
                  {MENU_LINKS.map((link) => {
                    const active = isActivePath(pathname ?? "", link.href);
                    const text = linkLabel(link, lang);
                    return (
                      <li key={`${link.key}-${link.href}`}>
                        <Link
                          href={link.href}
                          onClick={closeMenu}
                          className={`flex min-h-11 items-center justify-between rounded-lg px-3 text-[15px] font-semibold transition ${
                            active
                              ? "bg-cut-burgundy/20 text-cut-warm-beige"
                              : "text-cut-ivory/90 hover:bg-cut-ivory/5"
                          }`}
                        >
                          {text}
                          {link.key === "appointments" ? (
                            <ExternalLink className="h-3.5 w-3.5 opacity-50" strokeWidth={1.75} />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/client/loyalty"
                  onClick={closeMenu}
                  className="relative mt-4 block overflow-hidden rounded-xl border border-cut-burgundy/25 bg-gradient-to-br from-cut-ivory/95 to-cut-warm-paper/90 p-3.5"
                >
                  <span className="relative flex items-start gap-2.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cut-burgundy/20 bg-cut-burgundy/10 text-cut-burgundy">
                      <Gift className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cut-burgundy">
                        <Sparkles className="h-3 w-3" strokeWidth={2.25} />
                        {label("loyaltyCtaTitle")}
                      </span>
                      <span className="mt-0.5 block text-sm font-black text-cut-black">
                        {label("loyaltyCtaJoin")}
                      </span>
                    </span>
                  </span>
                </Link>

                <Link
                  href="/client"
                  onClick={closeMenu}
                  className="mt-3 flex min-h-11 items-center gap-2.5 rounded-lg border border-cut-bronze/25 px-3 text-sm font-semibold text-cut-ivory"
                >
                  <User className="h-4 w-4 text-cut-warm-beige" strokeWidth={1.9} />
                  {label("account")}
                </Link>
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
