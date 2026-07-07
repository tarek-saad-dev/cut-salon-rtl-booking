"use client";

import { motion } from "framer-motion";
import { Calendar, Zap, Shield, Gem, Clock, Star } from "lucide-react";
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

const HeroSection = () => {
  return (
    <section className="relative min-h-[700px] md:min-h-screen overflow-hidden hero-gradient cut-grain" dir="rtl" aria-label="القسم الرئيسي">

      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="" aria-hidden="true"
          className="hidden md:block w-full h-full object-cover scale-105 opacity-40 mix-blend-luminosity"
          style={{ objectPosition: "right center" }} />
        <img src={heroVerticalImg} alt="" aria-hidden="true"
          className="block md:hidden w-full h-full object-cover opacity-35 mix-blend-luminosity"
          style={{ objectPosition: "center top" }} />

        <div className="absolute inset-0"
          style={{ background: "linear-gradient(270deg, rgba(5,5,5,0.98) 0%, rgba(23,4,6,0.88) 35%, rgba(5,5,5,0.55) 65%, rgba(5,5,5,0.25) 100%)" }} />
        <div className="absolute inset-0 md:hidden bg-cut-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-cut-black via-cut-black/85 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cut-black/80 to-transparent" />
        <div className="absolute inset-0 cut-vignette pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle at 20% 40%, rgba(164,136,121,0.18) 0%, transparent 42%)" }} />
      </div>

      <div className="relative z-20 px-5 md:px-12 lg:px-20 pt-20">
        <CustomerUpcomingBookings />
      </div>

      <div className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-140px)]">
        <div className="w-full flex-1 flex items-center">
          <div className="w-full px-5 md:px-12 lg:px-20">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right max-w-[620px] mx-auto lg:mx-0 gap-5">

              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-col items-center lg:items-start gap-2">
                <span className="cut-editorial-label font-display">THE CUT ISSUE</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-px bg-gradient-to-l from-cut-bronze to-transparent" />
                  <span className="text-cut-warm-beige text-xs md:text-sm font-bold tracking-wide">PREMIUM GROOMING</span>
                  <div className="w-10 h-px bg-gradient-to-r from-cut-bronze to-transparent" />
                </div>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="font-heading font-black leading-[1.05]">
                <span className="block text-[2.4rem] md:text-6xl lg:text-[4.5rem] text-cut-ivory tracking-tight">
                  الترقية تبدأ من هنا
                </span>
                <span className="block text-[2rem] md:text-5xl lg:text-[3.5rem] mt-2 text-cut-ivory/90">
                  ستايلك{" "}
                  <span className="font-editorial italic text-cut-warm-beige">قرار.</span>
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="text-cut-ivory/70 text-sm md:text-base lg:text-lg max-w-md leading-[1.85]">
                اختار الحلاق، احجز في ثوانٍ، وادخل Cut Salon بتجربة رجالية فاخرة —
                حادة، واثقة، ومبنية على التفاصيل.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto mt-1">
                <button
                  onClick={() => document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  aria-label="احجز الآن"
                  className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-cut-black text-base bg-cut-ivory hover:bg-cut-warm-beige shadow-cut-glow-strong hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  احجز الآن
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("cut:book-nearest"))}
                  aria-label="أقرب ميعاد متاح"
                  className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-cut-ivory text-base border border-cut-warm-beige/50 bg-transparent hover:bg-cut-warm-beige/10 hover:border-cut-warm-beige transition-all duration-300 cursor-pointer">
                  <Zap className="w-4 h-4 text-cut-bronze" />
                  أقرب ميعاد متاح
                </button>
              </motion.div>

              <motion.div custom={3.5} variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-md">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cut-espresso/60 backdrop-blur-sm border border-cut-bronze/20">
                  <div className="w-2 h-2 rounded-full bg-cut-warm-beige animate-pulse flex-shrink-0" />
                  <p className="text-cut-ivory/55 text-xs flex-1">اختار الخدمة لمعرفة أقرب ميعاد</p>
                  <Zap className="w-3 h-3 text-cut-bronze/70 flex-shrink-0" />
                </div>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                className="grid grid-cols-3 gap-2 md:gap-3 w-full max-w-md mt-1">
                {[
                  { icon: Shield, title: "حلاقين محترفين", sub: "معايير عالية" },
                  { icon: Gem, title: "تجربة فاخرة", sub: "أناقة وراحة" },
                  { icon: Clock, title: "مواعيد دقيقة", sub: "حجز سريع" },
                ].map((b) => (
                  <div key={b.title}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-cut-espresso/50 backdrop-blur-sm border border-cut-bronze/15 hover:border-cut-bronze/35 transition-colors">
                    <b.icon className="w-4 h-4 text-cut-bronze" />
                    <p className="text-cut-ivory text-[11px] md:text-xs font-bold leading-tight text-center">{b.title}</p>
                    <p className="text-cut-ivory/35 text-[9px] md:text-[10px] leading-tight text-center hidden md:block">{b.sub}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
          className="relative w-full pb-5 pt-3 lg:pb-8 lg:pt-5"
        >
          <div className="absolute top-0 right-0 bottom-0 w-16 md:w-20 z-20 bg-gradient-to-l from-cut-black to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 bottom-0 w-16 md:w-20 z-20 bg-gradient-to-r from-cut-black to-transparent pointer-events-none" />

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
                className="flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 w-[190px] md:w-[210px] rounded-2xl cursor-pointer cut-card-editorial hover:border-cut-bronze/40 hover:shadow-cut-glow transition-all duration-300"
                role="listitem"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-cut-bronze/30">
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-cut-ivory font-bold text-sm truncate">{b.name}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-cut-ivory/45 text-xs">{b.rating}</span>
                    <Star className="w-3 h-3 text-cut-warm-beige fill-cut-warm-beige" />
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
