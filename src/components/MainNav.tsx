"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Menu, X } from "lucide-react";
import ClientProfileWidget from "./ClientProfileWidget";
import BranchBadge from "./BranchBadge";
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

  return (
    <div className={`items-center rounded-full border border-cut-bronze/40 bg-cut-black/70 p-1 ${className}`} aria-label="Language selector">
      <button type="button" onClick={() => setLang("ar")} className={`min-h-8 rounded-full px-2.5 text-xs font-bold transition ${lang === "ar" ? "bg-cut-ivory text-cut-black" : "text-cut-warm-beige hover:text-cut-ivory"}`}>العربية</button>
      <button type="button" onClick={() => setLang("en")} className={`min-h-8 rounded-full px-2.5 text-xs font-bold transition ${lang === "en" ? "bg-cut-ivory text-cut-black" : "text-cut-warm-beige hover:text-cut-ivory"}`}>EN</button>
    </div>
  );
}

export default function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, dir } = useLanguage();
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="cut-nav-glass fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 lg:px-20 py-3.5 md:py-4"
        aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}
      >
        <a href="/" className="flex items-center gap-1.5 select-none group" aria-label="CUT Salon - الرئيسية">
          <span className="text-cut-bronze text-lg font-black tracking-widest group-hover:text-cut-warm-beige transition-colors">—</span>
          <div className="text-center mx-1">
            <span className="text-cut-ivory text-2xl font-black tracking-[0.25em] leading-none font-display">CUT</span>
            <div className="text-[9px] text-cut-bronze tracking-[0.5em] font-semibold -mt-0.5 group-hover:text-cut-warm-beige transition-colors">SALON</div>
          </div>
          <span className="text-cut-bronze text-lg font-black tracking-widest group-hover:text-cut-warm-beige transition-colors">—</span>
        </a>

        <ul className="hidden md:flex items-center gap-8" role="menubar">
          {NAV_LINKS.map((link) => (
            <li key={link.label} role="none">
              <a href={link.href} role="menuitem"
                className={
                  link.isClub
                    ? "text-sm font-black tracking-wider text-cut-warm-beige border border-cut-bronze/35 rounded-lg px-3 py-1 hover:bg-cut-burgundy/40 hover:border-cut-bronze/60 transition-all duration-300"
                    : "text-sm font-semibold transition-all duration-300 text-cut-ivory/80 hover:text-cut-warm-beige relative after:absolute after:-bottom-1 after:right-0 after:left-0 after:h-px after:scale-x-0 after:bg-cut-bronze after:transition-transform hover:after:scale-x-100"
                }
              >{label(link.label)}</a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden md:flex" />
          <BranchBadge className="hidden sm:flex" />
          <button onClick={() => document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" })} aria-label={label("booking")}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cut-ivory text-cut-black text-sm font-bold hover:bg-cut-warm-beige transition-all duration-300 cursor-pointer">
            <Calendar className="w-4 h-4" />
            {label("booking")}
          </button>
          <ClientProfileWidget />
          <a
            href="/client/loyalty"
            aria-label="CUT CLUB"
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cut-bronze/40 bg-cut-burgundy/30 text-cut-warm-beige text-xs font-black tracking-wider hover:bg-cut-burgundy/50 transition-all"
          >
            <span>CUT</span>
            <span className="text-[8px] font-black tracking-widest border border-cut-bronze/40 rounded px-1 py-0.5">CLUB</span>
          </a>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? label("closeMenu") : label("openMenu")}
            aria-expanded={mobileOpen}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-cut-bronze/20 bg-cut-espresso/50 text-cut-ivory/70 hover:text-cut-ivory hover:border-cut-bronze/40 transition-all"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-cut-black/75 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className={`fixed top-0 bottom-0 z-50 flex w-72 flex-col border-cut-bronze/15 bg-cut-soft-black shadow-2xl md:hidden ${dir === "rtl" ? "right-0 border-l" : "left-0 border-r"}`}
              dir={dir}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-cut-bronze/15">
                <a href="/" className="flex items-center gap-1 select-none" aria-label="CUT Salon">
                  <span className="text-cut-bronze text-base font-black tracking-widest">—</span>
                  <div className="text-center mx-1">
                    <span className="text-cut-ivory text-xl font-black tracking-[0.25em] leading-none font-display">CUT</span>
                    <div className="text-[8px] text-cut-bronze tracking-[0.5em] font-semibold -mt-0.5">SALON</div>
                  </div>
                  <span className="text-cut-bronze text-base font-black tracking-widest">—</span>
                </a>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label={label("closeMenu")}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-cut-bronze/20 text-cut-ivory/50 hover:text-cut-ivory transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 px-4 pt-4">
                <BranchBadge className="min-w-0 flex-1 justify-center" />
                <LanguageToggle className="flex" />
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {NAV_LINKS.map((link, i) =>
                  link.isClub ? (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-cut-bronze/30 bg-cut-burgundy/25 text-cut-warm-beige text-sm font-black tracking-wider hover:bg-cut-burgundy/40 transition-all"
                    >
                      {label(link.label)}
                      <span className="text-[9px] font-black tracking-widest border border-cut-bronze/35 rounded px-1.5 py-0.5">CLUB</span>
                    </motion.a>
                  ) : (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all text-cut-ivory/65 hover:text-cut-ivory hover:bg-cut-espresso/60"
                    >
                      {label(link.label)}
                    </motion.a>
                  )
                )}
              </nav>

              <div className="px-4 pb-8 pt-3 border-t border-cut-bronze/15">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setTimeout(() => document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cut-ivory text-cut-black text-sm font-black hover:bg-cut-warm-beige active:scale-[0.97] transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  {label("booking")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
