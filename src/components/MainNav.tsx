"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Menu, X } from "lucide-react";
import ClientProfileWidget from "./ClientProfileWidget";
// Temporarily hidden per request: import BranchBadge from "./BranchBadge";
import { useLanguage } from "@/context/LanguageContext";
import { navigationLabels } from "@/lib/i18n/navigation";

const NAV_LINKS: { label: keyof typeof navigationLabels; href: string; active?: boolean; isClub?: boolean }[] = [
  { label: "home", href: "/" },
  { label: "services", href: "/#services" },
  { label: "prices", href: "/prices" },
  { label: "barbers", href: "/#barbers" },
  { label: "branches", href: "/#branches" },
  { label: "account", href: "/client" },
  { label: "loyalty", href: "/client/loyalty", isClub: true },
];

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

export default function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMobileOpenRef = useRef(false);
  const { lang, dir } = useLanguage();
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];
  const barberHref = lang === "en" ? "/#english-barbers" : "/#barbers";
  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) closeMobileMenu(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (!mobileOpen && wasMobileOpenRef.current) menuTriggerRef.current?.focus();
    wasMobileOpenRef.current = mobileOpen;
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const openBooking = () => document.getElementById(lang === "en" ? "english-barbers" : "barbers")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="cut-nav-glass fixed inset-x-0 top-0 z-50"
        dir={dir}
      >
        <div className="mx-auto grid h-[76px] max-w-[1760px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-[clamp(20px,4vw,72px)]">
          <a href="/" className="group flex items-center gap-1.5 justify-self-start select-none" aria-label={lang === "ar" ? "CUT Salon - الرئيسية" : "CUT Salon - Home"}>
            <span className="text-lg font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">—</span>
            <div className="mx-1 text-center">
              <span className="font-display text-2xl font-black leading-none tracking-[0.25em] text-cut-ivory">CUT</span>
              <div className="-mt-0.5 text-[9px] font-semibold tracking-[0.5em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige">SALON</div>
            </div>
            <span className="text-lg font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">—</span>
          </a>

          <nav className="hidden min-w-0 justify-self-center lg:block" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
            <ul className="flex items-center justify-center gap-x-3 xl:gap-x-5" role="menubar">
              {NAV_LINKS.map((link) => (
                <li key={link.label} role="none" className="shrink-0">
                  <a
                    href={link.label === "barbers" ? barberHref : link.href}
                    role="menuitem"
                    className={link.isClub
                      ? "inline-flex h-10 items-center rounded-lg border border-cut-bronze/35 px-3 text-xs font-black tracking-wider text-cut-warm-beige transition hover:border-cut-bronze/60 hover:bg-cut-burgundy/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                      : "relative inline-flex h-10 items-center px-1 text-sm font-semibold text-cut-ivory/80 transition hover:text-cut-warm-beige after:absolute after:inset-x-1 after:bottom-1 after:h-px after:scale-x-0 after:bg-cut-bronze after:transition-transform hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"}
                  >
                    {label(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-self-end gap-2" aria-label={lang === "ar" ? "إجراءات الحساب والحجز" : "Booking and account actions"}>
            {/* Temporarily hidden per request: <BranchBadge className="hidden h-11 min-w-0 lg:flex" /> */}
            <LanguageToggle className="hidden lg:inline-flex" />
            <button onClick={openBooking} aria-label={label("booking")} className="hidden h-11 items-center gap-2 rounded-xl bg-cut-ivory px-4 text-sm font-bold text-cut-black transition hover:bg-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige lg:inline-flex xl:px-5">
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">{label("booking")}</span>
            </button>
            <div className="hidden lg:block"><ClientProfileWidget /></div>
            <button onClick={openBooking} className="inline-flex h-11 items-center gap-2 rounded-xl bg-cut-ivory px-3 text-sm font-bold text-cut-black sm:px-4 lg:hidden" aria-label={label("booking")}>
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{label("booking")}</span>
            </button>
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? label("closeMenu") : label("openMenu")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cut-bronze/25 bg-cut-espresso/60 text-cut-ivory transition hover:border-cut-bronze/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-40 bg-cut-black/75 backdrop-blur-sm lg:hidden" onClick={closeMobileMenu} />
            <motion.aside
              key="drawer"
              id="mobile-navigation"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className={`fixed inset-y-0 z-50 flex w-[min(22rem,88vw)] flex-col bg-cut-soft-black shadow-2xl lg:hidden ${dir === "rtl" ? "right-0 border-l" : "left-0 border-r"} border-cut-bronze/20`}
              dir={dir}
              aria-label={lang === "ar" ? "قائمة التنقل" : "Navigation menu"}
            >
              <div className="flex h-[76px] items-center justify-between border-b border-cut-bronze/15 px-5">
                <a href="/" className="flex items-center gap-1.5 select-none" onClick={closeMobileMenu} aria-label="CUT Salon">
                  <span className="text-base font-black tracking-widest text-cut-bronze">—</span><div className="mx-1 text-center"><span className="font-display text-xl font-black leading-none tracking-[0.25em] text-cut-ivory">CUT</span><div className="-mt-0.5 text-[8px] font-semibold tracking-[0.5em] text-cut-bronze">SALON</div></div><span className="text-base font-black tracking-widest text-cut-bronze">—</span>
                </a>
                <button type="button" onClick={closeMobileMenu} aria-label={label("closeMenu")} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cut-bronze/20 text-cut-ivory transition hover:border-cut-bronze/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex items-center justify-center px-4 pt-5">{/* Temporarily hidden per request: <BranchBadge className="h-11 min-w-0 justify-center" /> */}<LanguageToggle /></div>
              <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label={lang === "ar" ? "روابط الموقع" : "Site links"}>
                <ul className="space-y-1">{NAV_LINKS.map((link, index) => <motion.li key={link.label} initial={{ opacity: 0, x: dir === "rtl" ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}><a href={link.label === "barbers" ? barberHref : link.href} onClick={closeMobileMenu} className={`flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold transition hover:bg-cut-espresso hover:text-cut-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${link.isClub ? "border border-cut-bronze/30 bg-cut-burgundy/25 font-black tracking-wider text-cut-warm-beige" : "text-cut-ivory/70"}`}>{label(link.label)}</a></motion.li>)}</ul>
              </nav>
              <div className="border-t border-cut-bronze/15 px-4 pb-8 pt-4"><button onClick={() => { closeMobileMenu(); setTimeout(openBooking, 250); }} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cut-ivory px-5 text-sm font-black text-cut-black transition hover:bg-cut-warm-beige"><Calendar className="h-4 w-4" />{label("booking")}</button></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
