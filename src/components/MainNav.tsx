"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Menu, Minus, Phone, Plus, User, X } from "lucide-react";
import ClientProfileWidget from "./ClientProfileWidget";
// Temporarily hidden per request: import BranchBadge from "./BranchBadge";
import { useLanguage } from "@/context/LanguageContext";
import { navigationLabels } from "@/lib/i18n/navigation";

const DESKTOP_NAV_LINKS: {
  label: keyof typeof navigationLabels;
  href: string;
  isClub?: boolean;
}[] = [
  { label: "home", href: "/" },
  { label: "services", href: "/#services" },
  { label: "prices", href: "/prices" },
  { label: "barbers", href: "/#barbers" },
  { label: "branches", href: "/#branches" },
  { label: "account", href: "/client" },
  { label: "loyalty", href: "/client/loyalty", isClub: true },
];

type AccordionId = "book" | null;

const WHATSAPP_URL = "https://wa.me/201012126899";

function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const nextLanguage = lang === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => setLang(nextLanguage)}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-cut-bronze/40 bg-cut-black/70 px-3 text-xs font-black tracking-[0.14em] text-cut-warm-beige transition hover:border-cut-warm-beige hover:text-cut-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${className}`}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {lang === "ar" ? "EN" : "AR"}
    </button>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<AccordionId>("book");
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMobileOpenRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const { lang, dir, setLang } = useLanguage();
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];
  const barberHref = lang === "en" ? "/#english-barbers" : "/#barbers";
  const closeMobileMenu = () => setMobileOpen(false);
  const goToBook = () => {
    closeMobileMenu();
    router.push("/book");
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) closeMobileMenu();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (!mobileOpen && wasMobileOpenRef.current) menuTriggerRef.current?.focus();
    wasMobileOpenRef.current = mobileOpen;
    if (mobileOpen) setOpenAccordion("book");
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  // Dedicated booking entry has its own header chrome.
  if (pathname?.startsWith("/book")) return null;

  const toggleAccordion = (id: AccordionId) => {
    setOpenAccordion((current) => (current === id ? null : id));
  };

  const primaryItemClass =
    "flex min-h-[3.25rem] w-full items-center justify-between border-b border-cut-bronze py-3.5 text-start text-[1.05rem] font-semibold tracking-wide text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-warm-beige";

  const subItemClass =
    "block py-2.5 text-[0.95rem] font-normal text-cut-ivory/75 transition hover:text-cut-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige";

  const LogoMark = () => (
    <a
      href="/"
      className="group flex items-center gap-1.5 select-none"
      aria-label={lang === "ar" ? "CUT Salon - الرئيسية" : "CUT Salon - Home"}
    >
      <span className="text-lg font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
        —
      </span>
      <div className="mx-1 text-center">
        <span className="font-brand text-2xl font-black leading-none tracking-[0.25em] text-cut-ivory">
          CUT
        </span>
        <div className="-mt-0.5 text-[9px] font-semibold tracking-[0.5em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
          SALON
        </div>
      </div>
      <span className="text-lg font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
        —
      </span>
    </a>
  );

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="cut-nav-glass relative z-50 w-full"
        dir={dir}
      >
        {/* Desktop header */}
        <div className="mx-auto hidden h-[76px] max-w-[1760px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-[clamp(20px,4vw,72px)] lg:grid">
          <LogoMark />

          <nav
            className="min-w-0 justify-self-center"
            aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}
          >
            <ul className="flex items-center justify-center gap-x-3 xl:gap-x-5" role="menubar">
              {DESKTOP_NAV_LINKS.map((link) => (
                <li key={link.label} role="none" className="shrink-0">
                  <a
                    href={link.label === "barbers" ? barberHref : link.href}
                    role="menuitem"
                    className={
                      link.isClub
                        ? "inline-flex h-10 items-center rounded-lg border border-cut-bronze/35 px-3 text-xs font-black tracking-wider text-cut-warm-beige transition hover:border-cut-bronze/60 hover:bg-cut-burgundy/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                        : "relative inline-flex h-10 items-center px-1 text-sm font-semibold text-cut-ivory/80 transition hover:text-cut-warm-beige after:absolute after:inset-x-1 after:bottom-1 after:h-px after:scale-x-0 after:bg-cut-bronze after:transition-transform hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                    }
                  >
                    {label(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            className="flex items-center justify-self-end gap-2"
            aria-label={lang === "ar" ? "إجراءات الحساب والحجز" : "Booking and account actions"}
          >
            <LanguageToggle />
            <button
              onClick={goToBook}
              aria-label={label("booking")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-cut-ivory px-4 text-sm font-bold text-cut-black transition hover:bg-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige xl:px-5"
            >
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">{label("booking")}</span>
            </button>
            <ClientProfileWidget />
          </div>
        </div>

        {/* Mobile header — centered logo + centered actions under it (Fellow Barber layout) */}
        <div className="lg:hidden" data-mobile-header>
          <div className="flex flex-col items-center gap-3 px-4 pb-3 pt-3.5">
            <LogoMark />
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={goToBook}
                aria-label={label("booking")}
                className="font-ui inline-flex min-h-10 items-center justify-center bg-cut-ivory px-5 text-[11px] font-bold uppercase tracking-[0.22em] text-cut-black transition hover:bg-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
              >
                {label("booking")}
              </button>
              <a
                href="/client"
                aria-label={label("account")}
                className="inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
              >
                <User className="h-5 w-5" strokeWidth={1.6} />
              </a>
              <button
                ref={menuTriggerRef}
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label={mobileOpen ? label("closeMenu") : label("openMenu")}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                className="inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
              >
                {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.6} /> : <Menu className="h-5 w-5" strokeWidth={1.6} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-cut-black/70 lg:hidden"
              onClick={closeMobileMenu}
            />
            <motion.aside
              key="drawer"
              id="mobile-navigation"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className={`fixed inset-y-0 z-50 flex w-[min(22rem,86vw)] flex-col bg-[#1f1c1b] lg:hidden ${
                dir === "rtl" ? "right-0" : "left-0"
              }`}
              dir={dir}
              aria-label={lang === "ar" ? "قائمة التنقل" : "Navigation menu"}
            >
              {/* Close */}
              <div className="flex items-center px-5 pt-5 pb-2">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label={label("closeMenu")}
                  className="inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                >
                  <X className="h-6 w-6" strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 pb-6 pt-2">
                {/* Primary nav */}
                <nav aria-label={lang === "ar" ? "روابط الموقع" : "Site links"}>
                  {/* Book accordion */}
                  <div className="border-b border-cut-bronze">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("book")}
                      aria-expanded={openAccordion === "book"}
                      className={`${primaryItemClass} border-b-0`}
                    >
                      <span>{label("bookMenu")}</span>
                      {openAccordion === "book" ? (
                        <Minus className="h-4 w-4 shrink-0 text-cut-ivory" strokeWidth={2} />
                      ) : (
                        <Plus className="h-4 w-4 shrink-0 text-cut-ivory" strokeWidth={2} />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {openAccordion === "book" && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden ps-4"
                        >
                          <li>
                            <a href={barberHref} onClick={closeMobileMenu} className={subItemClass}>
                              {label("barbers")}
                            </a>
                          </li>
                          <li>
                            <a href="/#branches" onClick={closeMobileMenu} className={subItemClass}>
                              {label("branches")}
                            </a>
                          </li>
                          <li className="pb-3">
                            <button
                              type="button"
                              onClick={goToBook}
                              className={`${subItemClass} w-full text-start`}
                            >
                              {label("booking")}
                            </button>
                          </li>
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Direct links */}
                  <a href="/" onClick={closeMobileMenu} className={primaryItemClass}>
                    {label("home")}
                  </a>
                  <a href="/#services" onClick={closeMobileMenu} className={primaryItemClass}>
                    {label("services")}
                  </a>
                  <a href="/prices" onClick={closeMobileMenu} className={primaryItemClass}>
                    {label("prices")}
                  </a>

                  {/* Highlighted CTA — CUT CLUB */}
                  <a
                    href="/client/loyalty"
                    onClick={closeMobileMenu}
                    className="flex min-h-[3.25rem] w-full items-center border-b border-cut-bronze py-3.5 text-start text-[1.05rem] font-bold tracking-wide text-cut-gold transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-warm-beige"
                  >
                    {label("loyaltyCta")}
                  </a>
                </nav>

                {/* Secondary links */}
                <div className="mt-10 space-y-4">
                  <a
                    href="/client"
                    onClick={closeMobileMenu}
                    className="block text-[1.05rem] font-medium text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                  >
                    {label("account")}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(lang === "ar" ? "en" : "ar");
                      closeMobileMenu();
                    }}
                    className="block text-[1.05rem] font-medium text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                  >
                    {label("language")}
                  </button>
                </div>

                {/* Footer social */}
                <div className="mt-auto flex flex-col pt-12">
                  <div className="border-t border-cut-bronze" />
                  <div className="flex items-center justify-center gap-8 py-7">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label("whatsapp")}
                      className="text-cut-ivory transition hover:text-cut-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                    >
                      <WhatsAppIcon className="h-5 w-5" />
                    </a>
                    <a
                      href="tel:01012126899"
                      aria-label={lang === "ar" ? "اتصل بنا" : "Call us"}
                      className="text-cut-ivory transition hover:text-cut-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
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
    </>
  );
}
