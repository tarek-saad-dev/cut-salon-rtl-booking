"use client";

import { motion } from "framer-motion";
import { Calendar, Users, Shield, Gem, Clock, Zap, Star } from "lucide-react";

const heroImg = "/hero.png";
const heroVerticalImg = "/hero_vertical.png";
const barberKareem = "/barber-kareem.jpg";
const barberMohamed = "/barber-mohamed.jpg";
const barberZizo = "/barber-ziad.jpg";
const barberOmar = "/omar.png";
const barberYousef = "/yousef.jpg";
const barberAhmed = "/ahmed.jpg";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.13, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ─── Reusable: Gold CTA Button ─── */
const GoldButton = ({
  href,
  children,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel: string;
}) => (
  <a
    href={href}
    aria-label={ariaLabel}
    className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl
               font-heading font-bold text-[#080808] text-base overflow-hidden
               bg-gradient-to-l from-[#C8A96A] to-[#E5C07B]
               shadow-[0_6px_30px_rgba(201,154,69,0.35)]
               hover:shadow-[0_10px_50px_rgba(201,154,69,0.55)]
               hover:scale-105 active:scale-[0.97]
               transition-all duration-300"
  >
    <span className="absolute inset-0 bg-gradient-to-l from-white/25 to-transparent
                     translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
    <span className="relative z-10 flex items-center gap-2.5">{children}</span>
  </a>
);

/* ─── Reusable: Outline Button ─── */
const OutlineButton = ({
  href,
  children,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel: string;
}) => (
  <a
    href={href}
    aria-label={ariaLabel}
    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl
               font-heading font-bold text-white text-base
               border border-[#C99A45]/40 hover:border-[#C99A45] hover:bg-[#C99A45]/10
               hover:scale-[1.03] active:scale-[0.97]
               transition-all duration-300"
  >
    {children}
  </a>
);

/* ─── Reusable: Trust Badge ─── */
const TrustBadge = ({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl
                  bg-white/5 backdrop-blur-lg border border-white/10
                  shadow-[0_4px_24px_rgba(0,0,0,0.25)]
                  hover:border-[#C99A45]/25 hover:bg-white/[0.07]
                  transition-all duration-300">
    <Icon className="w-5 h-5 text-[#C99A45] flex-shrink-0" />
    <div>
      <p className="text-white text-xs font-bold leading-tight">{title}</p>
      <p className="text-white/35 text-[10px] leading-tight mt-0.5">{sub}</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════
   MAIN HERO SECTION
   ════════════════════════════════════════════ */
const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080808]" dir="rtl" aria-label="القسم الرئيسي">

      {/* ─── Full-screen background image ─── */}
      <div className="absolute inset-0 z-0">
        {/* Desktop background */}
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="hidden md:block w-full h-full object-cover scale-110"
          style={{ objectPosition: "right center" }}
        />
        {/* Mobile background */}
        <img
          src={heroVerticalImg}
          alt=""
          aria-hidden="true"
          className="block md:hidden w-full h-full object-cover"
          style={{ objectPosition: "center top" }}
        />
        {/* Strong LTR gradient overlay (in RTL: right = text side) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(270deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.15) 100%)",
          }}
        />
        {/* Bottom cinematic fade */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent" />
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080808]/60 to-transparent" />
        {/* Subtle gold ambient light on image side */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
          style={{
            background: "radial-gradient(circle at 20% 55%, rgba(201,154,69,0.2) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* ─── NAVBAR ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-30 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5"
        aria-label="التنقل الرئيسي"
      >
        <a href="#" className="flex items-center gap-1.5 select-none group" aria-label="CUT Salon - الرئيسية">
          <span className="text-[#C99A45] text-lg font-black tracking-widest group-hover:text-[#E5C07B] transition-colors">—</span>
          <div className="text-center mx-1">
            <span className="text-white text-2xl font-black tracking-[0.25em] leading-none">CUT</span>
            <div className="text-[9px] text-[#C99A45] tracking-[0.5em] font-semibold -mt-0.5 group-hover:text-[#E5C07B] transition-colors">SALON</div>
          </div>
          <span className="text-[#C99A45] text-lg font-black tracking-widest group-hover:text-[#E5C07B] transition-colors">—</span>
        </a>

        <ul className="hidden md:flex items-center gap-8" role="menubar">
          {[
            { label: "الرئيسية", href: "#", active: true },
            { label: "الخدمات", href: "#services" },
            { label: "الحلاقين", href: "#barbers" },
            { label: "الفروع", href: "#branches" },
          ].map((link) => (
            <li key={link.label} role="none">
              <a
                href={link.href}
                role="menuitem"
                className={`text-sm font-semibold transition-all duration-300 ${link.active
                  ? "text-[#E5C07B] border-b-2 border-[#C99A45] pb-0.5"
                  : "text-white/60 hover:text-white"
                  }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#barbers"
          aria-label="احجز الآن"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl
                     border border-[#C99A45]/60 text-[#E5C07B] text-sm font-bold
                     hover:bg-[#C99A45]/15 hover:border-[#C99A45]
                     hover:shadow-[0_0_20px_rgba(201,154,69,0.15)]
                     transition-all duration-300"
        >
          <Calendar className="w-4 h-4" />
          احجز الآن
        </a>
      </motion.nav>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full flex-1 flex items-center">
          <div className="w-full px-6 md:px-12 lg:px-20">

            {/* ── Text content ── */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right
                          max-w-[540px] mx-auto lg:mx-0
                          gap-3">

              {/* Eyebrow with glow */}
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-px bg-gradient-to-l from-[#C99A45] to-transparent" />
                <span className="text-[#C99A45] text-sm font-semibold tracking-wide
                               drop-shadow-[0_0_8px_rgba(201,154,69,0.4)]">
                  — أسلوبك . دقّتنا —
                </span>
                <div className="w-8 h-px bg-gradient-to-r from-[#C99A45] to-transparent" />
              </motion.div>

              {/* Headline */}
              <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="font-heading font-black leading-[1.05]">
                <span className="block text-5xl md:text-6xl lg:text-7xl text-white">
                  احجز ستايلك
                </span>
                <span className="block text-5xl md:text-6xl lg:text-7xl mt-1 pb-2
                               bg-gradient-to-l from-[#C8A96A] via-[#E5C07B] to-[#C8A96A]
                               bg-clip-text text-transparent
                               drop-shadow-[0_0_20px_rgba(201,154,69,0.2)]">
                  بسهولة
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="text-gray-300 text-base md:text-lg max-w-md leading-[1.7] mt-1">
                اختَر الحلاق المناسب لك واحجز في ثواني داخل Cut Salon.
                <br />
                تجربة سريعة، بدون زحمة… ونتيجة تفرق.
              </motion.p>

              {/* CTA Buttons row */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2">
                <GoldButton href="#barbers" ariaLabel="احجز الآن">
                  <Calendar className="w-4 h-4" />
                  احجز الآن
                </GoldButton>
                <OutlineButton href="#barbers" ariaLabel="شاهد الحلاقين">
                  <Users className="w-4 h-4" />
                  شاهد الحلاقين
                </OutlineButton>
              </motion.div>

              {/* Smart CTA — hidden for now */}
              {false && (
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                  className="-mt-0.5">
                  <a
                    href="#barbers"
                    aria-label="أقرب ميعاد متاح"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-[#C99A45]/10 border border-[#C99A45]/25 text-[#E5C07B] text-sm font-semibold
                             hover:bg-[#C99A45]/20 hover:border-[#C99A45]/50
                             hover:shadow-[0_0_16px_rgba(201,154,69,0.2)]
                             transition-all duration-300"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    ⚡ أقرب ميعاد
                  </a>
                </motion.div>
              )}

              {/* Trust badges */}
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-1">
                <TrustBadge icon={Shield} title="حرفيون محترفون" sub="أعلى معايير الجودة والدقة" />
                <TrustBadge icon={Gem} title="تجربة فاخرة" sub="راحة وأناقة في كل زيارة" />
                <TrustBadge icon={Clock} title="مواعيد دقيقة" sub="احجز في الوقت المناسب لك" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ─── Bottom horizontal barber scroll strip ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          className="relative w-full pb-6 pt-4 lg:pb-10 lg:pt-6"
        >
          {/* Edge fade — right */}
          <div className="absolute top-0 right-0 bottom-0 w-16 md:w-24 z-20
                            bg-gradient-to-l from-[#080808] to-transparent pointer-events-none" />
          {/* Edge fade — left */}
          <div className="absolute top-0 left-0 bottom-0 w-16 md:w-24 z-20
                            bg-gradient-to-r from-[#080808] to-transparent pointer-events-none" />

          {/* Scroll container */}
          <div className="flex gap-3 md:gap-4 overflow-x-auto px-8 md:px-16 lg:px-24
                            scroll-smooth snap-x snap-mandatory scrollbar-hide"
            aria-label="حلاقين متاحين"
            role="list">
            {[
              {
                image: barberKareem, name: "كريـــم", rating: "4.9", reviews: "(328)",
                statusText: "متاح الآن", statusColor: "#4ade80", glowColor: "rgba(74,222,128,0.8)",
              },
              {
                image: barberMohamed, name: "محمد", rating: "4.8", reviews: "(215)",
                statusText: "بعد 15 دقيقة", statusColor: "#facc15", glowColor: "rgba(250,204,21,0.8)",
              },
              {
                image: barberZizo, name: "زيزو", rating: "4.7", reviews: "(142)",
                statusText: "متاح الآن", statusColor: "#4ade80", glowColor: "rgba(74,222,128,0.8)",
              },
              {
                image: barberOmar, name: "عمر", rating: "4.8", reviews: "(189)",
                statusText: "بعد 30 دقيقة", statusColor: "#facc15", glowColor: "rgba(250,204,21,0.8)",
              },
              {
                image: barberYousef, name: "يوسف", rating: "4.7", reviews: "(167)",
                statusText: "متاح الآن", statusColor: "#4ade80", glowColor: "rgba(74,222,128,0.8)",
              },
              {
                image: barberAhmed, name: "أحمد", rating: "4.9", reviews: "(203)",
                statusText: "بعد 10 دقائق", statusColor: "#facc15", glowColor: "rgba(250,204,21,0.8)",
              },
            ].map((barber, i) => (
              <motion.div
                key={barber.name}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -6, scale: 1.04, transition: { duration: 0.25 } }}
                className="flex-shrink-0 snap-start flex items-center gap-3.5 px-4 py-3.5
                             w-[220px] md:w-[240px]
                             rounded-2xl cursor-pointer
                             bg-white/5 backdrop-blur-xl border border-white/10
                             shadow-[0_8px_32px_rgba(0,0,0,0.35)]
                             hover:border-[#C99A45]/40
                             hover:shadow-[0_16px_48px_rgba(201,154,69,0.15)]
                             transition-all duration-300"
                role="listitem"
                tabIndex={0}
                aria-label={`احجز مع ${barber.name}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0
                                    ring-2 ring-[#C99A45]/30 shadow-[0_0_10px_rgba(201,154,69,0.12)]">
                  <img src={barber.image} alt={barber.name}
                    className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-white font-bold text-sm truncate">{barber.name}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-white/50 text-xs">{barber.reviews} {barber.rating}</span>
                    <Star className="w-3 h-3 text-[#E5C07B] fill-[#E5C07B]" />
                  </div>
                  {/* Status hidden for now */}
                  {false && (
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-[10px] text-white/50">{barber.statusText}</span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: barber.statusColor, boxShadow: `0 0 8px ${barber.glowColor}` }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
