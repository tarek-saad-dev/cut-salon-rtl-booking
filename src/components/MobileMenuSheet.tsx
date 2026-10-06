"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ExternalLink, Gift, Sparkles, User, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { navigationLabels } from "@/lib/i18n/navigation";

export const MOBILE_MENU_ID = "global-mobile-navigation";

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

export function CutLogoMark({ compact = true }: { compact?: boolean }) {
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

/** Site menu bottom sheet: locks page scroll while open, closes on Escape, returns focus to the trigger. */
export default function MobileMenuSheet({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement>;
}) {
  const pathname = usePathname();
  const { lang, dir } = useLanguage();
  const wasOpenRef = useRef(false);
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open && wasOpenRef.current) returnFocusRef?.current?.focus();
    wasOpenRef.current = open;
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
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
            onClick={onClose}
          />
          <motion.div
            key="global-nav-sheet"
            id={MOBILE_MENU_ID}
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
                onClick={onClose}
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
                onClick={onClose}
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
                        onClick={onClose}
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
                onClick={onClose}
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
                onClick={onClose}
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
  );
}
