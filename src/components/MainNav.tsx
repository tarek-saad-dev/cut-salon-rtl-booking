"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Menu, X } from "lucide-react";
import ClientProfileWidget from "./ClientProfileWidget";

const NAV_LINKS: { label: string; href: string; active?: boolean; isClub?: boolean }[] = [
  { label: "الرئيسية", href: "/" },
  { label: "الخدمات", href: "/#services" },
  { label: "الحلاقين", href: "/#barbers" },
  { label: "الفروع", href: "/#branches" },
  { label: "حسابي", href: "/client" },
  { label: "CUT CLUB", href: "/client/loyalty", isClub: true },
];

export default function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 lg:px-20 py-4 md:py-5"
        aria-label="التنقل الرئيسي"
      >
        <a href="/" className="flex items-center gap-1.5 select-none group" aria-label="CUT Salon - الرئيسية">
          <span className="text-[#D4AF37] text-lg font-black tracking-widest group-hover:text-[#E5C07B] transition-colors">—</span>
          <div className="text-center mx-1">
            <span className="text-white text-2xl font-black tracking-[0.25em] leading-none">CUT</span>
            <div className="text-[9px] text-[#D4AF37] tracking-[0.5em] font-semibold -mt-0.5 group-hover:text-[#E5C07B] transition-colors">SALON</div>
          </div>
          <span className="text-[#D4AF37] text-lg font-black tracking-widest group-hover:text-[#E5C07B] transition-colors">—</span>
        </a>

        <ul className="hidden md:flex items-center gap-8" role="menubar">
          {NAV_LINKS.map((link) => (
            <li key={link.label} role="none">
              <a href={link.href} role="menuitem"
                className={
                  link.isClub
                    ? "text-sm font-black tracking-wider text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg px-3 py-1 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 hover:shadow-[0_0_12px_rgba(212,175,55,0.15)] transition-all duration-300"
                    : "text-sm font-semibold transition-all duration-300 text-white/55 hover:text-white"
                }
              >{link.label}</a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button onClick={() => document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" })} aria-label="احجز الآن"
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D4AF37]/50 text-[#E5C07B] text-sm font-bold hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] hover:shadow-[0_0_24px_rgba(212,175,55,0.15)] transition-all duration-300 cursor-pointer">
            <Calendar className="w-4 h-4" />
            احجز الآن
          </button>
          <ClientProfileWidget />
          {/* CUT CLUB button visible on mobile */}
          <a
            href="/client/loyalty"
            aria-label="CUT CLUB"
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-black tracking-wider hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all"
          >
            <span>CUT</span>
            <span className="text-[8px] font-black tracking-widest border border-[#D4AF37]/50 rounded px-1 py-0.5">CLUB</span>
          </a>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileOpen}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/[0.05] text-white/70 hover:text-white hover:border-white/25 transition-all"
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
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col bg-[#0a0a0a] border-l border-white/[0.07] shadow-2xl md:hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                <a href="/" className="flex items-center gap-1 select-none" aria-label="CUT Salon">
                  <span className="text-[#D4AF37] text-base font-black tracking-widest">—</span>
                  <div className="text-center mx-1">
                    <span className="text-white text-xl font-black tracking-[0.25em] leading-none">CUT</span>
                    <div className="text-[8px] text-[#D4AF37] tracking-[0.5em] font-semibold -mt-0.5">SALON</div>
                  </div>
                  <span className="text-[#D4AF37] text-base font-black tracking-widest">—</span>
                </a>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
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
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] text-[#D4AF37] text-sm font-black tracking-wider hover:bg-[#D4AF37]/12 hover:border-[#D4AF37]/55 transition-all"
                    >
                      {link.label}
                      <span className="text-[9px] font-black tracking-widest border border-[#D4AF37]/40 rounded px-1.5 py-0.5">CLUB</span>
                    </motion.a>
                  ) : (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all text-white/60 hover:text-white hover:bg-white/[0.05]"
                    >
                      {link.label}
                    </motion.a>
                  )
                )}
              </nav>

              <div className="px-4 pb-8 pt-3 border-t border-white/[0.07]">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setTimeout(() => document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-[#e7c766] to-[#b88916] text-[#050505] text-sm font-black shadow-[0_8px_24px_rgba(212,175,55,0.25)] hover:brightness-110 active:scale-[0.97] transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  احجز الآن
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
