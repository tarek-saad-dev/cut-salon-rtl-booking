"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Zap, Shield, Gem, Clock, Star, Menu, X } from "lucide-react";
import ClientProfileWidget from "./ClientProfileWidget";
import CustomerUpcomingBookings from "./CustomerUpcomingBookings";

const heroImg = "/hero.png";
const heroVerticalImg = "/hero_vertical.png";

const barberStrip = [
  { image: "/barber-kareem.jpg", name: "كريم", rating: "4.9" },
  { image: "/barber-mohamed.jpg", name: "محمد", rating: "4.8" },
  { image: "/barber-ziad.jpg", name: "ذياد", rating: "4.7" },
  { image: "/omar.png", name: "عمر", rating: "4.8" },
  { image: "/barber-bassem.jpg", name: "باسم", rating: "4.7" },
  { image: "/ahmed.jpg", name: "أحمد", rating: "4.9" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const NAV_LINKS: { label: string; href: string; active?: boolean; isClub?: boolean }[] = [
  { label: "الرئيسية", href: "#", active: true },
  { label: "الخدمات", href: "#services" },
  { label: "الحلاقين", href: "#barbers" },
  { label: "الفروع", href: "#branches" },
  { label: "حسابي", href: "/client" },
  { label: "CUT CLUB", href: "/client/loyalty", isClub: true },
];

const HeroSection = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <section className="relative min-h-[700px] md:min-h-screen overflow-hidden bg-[#050505]" dir="rtl" aria-label="القسم الرئيسي">

      {/* ─── Background layers ─── */}
      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="" aria-hidden="true"
          className="hidden md:block w-full h-full object-cover scale-105"
          style={{ objectPosition: "right center" }} />
        <img src={heroVerticalImg} alt="" aria-hidden="true"
          className="block md:hidden w-full h-full object-cover"
          style={{ objectPosition: "center top" }} />
        {/* Cinematic overlays */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(270deg, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.82) 30%, rgba(5,5,5,0.45) 60%, rgba(5,5,5,0.2) 100%)" }} />
        <div className="absolute inset-0 md:hidden bg-black/50" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050505]/70 to-transparent" />
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
          style={{ background: "radial-gradient(circle at 15% 50%, rgba(212,175,55,0.25) 0%, transparent 45%)" }} />
      </div>

      {/* ─── Navbar ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-30 flex items-center justify-between px-5 md:px-12 lg:px-20 py-4 md:py-5"
        aria-label="التنقل الرئيسي"
      >
        <a href="#" className="flex items-center gap-1.5 select-none group" aria-label="CUT Salon - الرئيسية">
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
                    : `text-sm font-semibold transition-all duration-300 ${link.active
                      ? "text-[#E5C07B] border-b-2 border-[#D4AF37] pb-0.5"
                      : "text-white/55 hover:text-white"}`
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
          {/* Hamburger — mobile only */}
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

      {/* ─── Mobile drawer ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col bg-[#0a0a0a] border-l border-white/[0.07] shadow-2xl md:hidden"
              dir="rtl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                <a href="#" className="flex items-center gap-1 select-none" aria-label="CUT Salon">
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

              {/* Nav links */}
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
                      className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${link.active
                        ? "text-[#E5C07B] bg-[#D4AF37]/[0.07] border border-[#D4AF37]/20"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                        }`}
                    >
                      {link.label}
                    </motion.a>
                  )
                )}
              </nav>

              {/* Book CTA */}
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

      {/* ─── Upcoming bookings reminder (auto-loads from localStorage) ─── */}
      <div className="relative z-20 px-5 md:px-12 lg:px-20 pt-2">
        <CustomerUpcomingBookings />
      </div>

      {/* ─── Main content ─── */}
      <div className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-72px)] md:min-h-[calc(100vh-80px)]">
        <div className="w-full flex-1 flex items-center">
          <div className="w-full px-5 md:px-12 lg:px-20">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right max-w-[560px] mx-auto lg:mx-0 gap-4">

              {/* Eyebrow */}
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center gap-2.5">
                <div className="w-8 h-px bg-gradient-to-l from-[#D4AF37] to-transparent" />
                <span className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-wide drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  أسلوبك يبدأ من هنا
                </span>
                <div className="w-8 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
              </motion.div>

              {/* Headline */}
              <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="font-heading font-black leading-[1.08]">
                <span className="block text-[2.6rem] md:text-6xl lg:text-7xl text-white">احجز ستايلك</span>
                <span className="block text-[2.6rem] md:text-6xl lg:text-7xl mt-1 pb-1 bg-gradient-to-l from-[#C8A96A] via-[#E5C07B] to-[#D4AF37] bg-clip-text text-transparent">بسهولة</span>
              </motion.h1>

              {/* Supporting text */}
              <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="text-zinc-300 text-sm md:text-base lg:text-lg max-w-md leading-[1.8]">
                اختار الحلاق المناسب لك واحجز في ثواني داخل Cut Salon.
                <br className="hidden md:block" />
                تجربة سريعة، منظمة، وراقية.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto mt-1">
                <button
                  onClick={() => document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  aria-label="احجز الآن"
                  className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-[#050505] text-base overflow-hidden bg-gradient-to-l from-[#C8A96A] to-[#E5C07B] shadow-[0_8px_32px_rgba(212,175,55,0.3)] hover:shadow-[0_12px_48px_rgba(212,175,55,0.5)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 cursor-pointer">
                  <span className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  <Calendar className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">احجز الآن</span>
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("cut:book-nearest"))}
                  aria-label="أقرب ميعاد متاح"
                  className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-[#D4AF37] text-base overflow-hidden border border-[#D4AF37]/40 hover:border-[#D4AF37] bg-[#D4AF37]/[0.08] hover:bg-[#D4AF37]/15 hover:shadow-[0_0_32px_rgba(212,175,55,0.15)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 cursor-pointer">
                  <Zap className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">أقرب ميعاد متاح</span>
                </button>
              </motion.div>

              {/* Live availability micro-card */}
              <motion.div custom={3.5} variants={fadeUp} initial="hidden" animate="visible"
                className="w-full max-w-md">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <p className="text-white/50 text-xs">
                    اختار الخدمة لمعرفة أقرب ميعاد
                  </p>
                  <Zap className="w-3 h-3 text-[#D4AF37]/60 flex-shrink-0" />
                </div>
              </motion.div>

              {/* Trust badges */}
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                className="grid grid-cols-3 gap-2 md:gap-3 w-full max-w-md mt-2">
                {[
                  { icon: Shield, title: "حلاقين محترفين", sub: "أعلى معايير الجودة" },
                  { icon: Gem, title: "تجربة فاخرة", sub: "راحة وأناقة" },
                  { icon: Clock, title: "مواعيد دقيقة", sub: "حجز سريع" },
                ].map((b) => (
                  <div key={b.title}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] hover:border-[#D4AF37]/20 transition-colors">
                    <b.icon className="w-4 h-4 text-[#D4AF37]" />
                    <p className="text-white text-[11px] md:text-xs font-bold leading-tight text-center">{b.title}</p>
                    <p className="text-white/30 text-[9px] md:text-[10px] leading-tight text-center hidden md:block">{b.sub}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ─── Barber preview strip ─── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
          className="relative w-full pb-5 pt-3 lg:pb-8 lg:pt-5"
        >
          <div className="absolute top-0 right-0 bottom-0 w-16 md:w-20 z-20 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 bottom-0 w-16 md:w-20 z-20 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none" />

          <div className="flex gap-3 overflow-x-auto px-6 md:px-16 lg:px-24 scroll-smooth snap-x snap-mandatory scrollbar-hide"
            aria-label="حلاقين متاحين" role="list">
            {barberStrip.map((b, i) => (
              <motion.button
                key={b.name}
                onClick={() => window.dispatchEvent(new CustomEvent("cut:book-barber", { detail: { name: b.name, image: b.image } }))}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.75 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 w-[190px] md:w-[210px] rounded-2xl cursor-pointer bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#D4AF37]/30 hover:shadow-[0_8px_32px_rgba(212,175,55,0.1)] transition-all duration-300"
                role="listitem"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#D4AF37]/25">
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-white font-bold text-sm truncate">{b.name}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-white/40 text-xs">{b.rating}</span>
                    <Star className="w-3 h-3 text-[#E5C07B] fill-[#E5C07B]" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
