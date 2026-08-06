"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Zap, Shield, Gem, Clock } from "lucide-react";
// Temporarily hidden per request: import CustomerUpcomingBookings from "./CustomerUpcomingBookings";
import BarberPhoto from "./BarberPhoto";
import { listGlobalBarbers, resolveBarberPhotoUrl, resolveBarberDisplayName } from "@/lib/booking-api";

const heroImg = "/hero.png";
const heroVerticalImg = "/hero_vertical.png";

type HeroBarber = { id: number; name: string; image: string | null };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const HeroSection = () => {
  const [barberStrip, setBarberStrip] = useState<HeroBarber[]>([]);

  useEffect(() => {
    let cancelled = false;
    listGlobalBarbers()
      .then((res) => {
        if (cancelled) return;
        setBarberStrip(
          (res.data ?? [])
            .filter((b) => b.isBookableOnline && b.id > 0)
            .map((b) => ({
              id: b.id,
              name: resolveBarberDisplayName(b, "ar"),
              image: resolveBarberPhotoUrl(b),
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setBarberStrip([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative min-h-[100svh] md:min-h-screen overflow-hidden hero-gradient cut-grain" dir="rtl" aria-label="القسم الرئيسي">

      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="" aria-hidden="true"
          className="hidden md:block w-full h-full object-cover scale-105 opacity-40 mix-blend-luminosity"
          style={{ objectPosition: "right center" }} />
        <img src={heroVerticalImg} alt="" aria-hidden="true"
          className="block md:hidden w-full h-full object-cover object-[center_18%] opacity-75"
        />

        <div className="absolute inset-0 hidden md:block"
          style={{ background: "linear-gradient(270deg, rgba(5,5,5,0.98) 0%, rgba(23,4,6,0.88) 35%, rgba(5,5,5,0.55) 65%, rgba(5,5,5,0.25) 100%)" }} />
        <div className="absolute inset-0 md:hidden bg-[linear-gradient(180deg,rgba(5,5,5,0.5)_0%,rgba(5,5,5,0.28)_38%,rgba(5,5,5,0.88)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 md:h-56 bg-gradient-to-t from-cut-black via-cut-black/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 md:h-32 bg-gradient-to-b from-cut-black/70 to-transparent" />
        <div className="absolute inset-0 cut-vignette pointer-events-none opacity-60 md:opacity-100" />
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle at 20% 40%, rgba(164,136,121,0.18) 0%, transparent 42%)" }} />
      </div>

      {/* Temporarily hidden per request:
      <div className="relative z-20 px-5 md:px-12 lg:px-20 pt-20">
        <CustomerUpcomingBookings />
      </div>
      */}

      <div className="relative z-10 flex flex-col justify-end md:justify-center min-h-[calc(100svh-7.5rem)] md:min-h-[calc(100vh-140px)] pb-6 md:pb-0 pt-4 md:pt-0">
        <div className="w-full flex-1 flex items-end md:items-center">
          <div className="w-full px-5 md:px-12 lg:px-20">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right max-w-[620px] mx-auto lg:mx-0 gap-3 md:gap-5">

              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-col items-center lg:items-start gap-2">
                <span className="cut-editorial-label hidden sm:inline">THE CUT ISSUE</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 md:w-10 h-px bg-gradient-to-l from-cut-bronze to-transparent" />
                  <span className="cut-ar-meta text-cut-warm-beige text-xs md:text-sm font-bold tracking-wide">CUT SALON</span>
                  <div className="w-8 md:w-10 h-px bg-gradient-to-r from-cut-bronze to-transparent" />
                </div>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="cut-ar-hero-heading font-laxr font-normal leading-[1.05]">
                <span className="cut-ar-hero-primary font-laxr block text-[2.15rem] sm:text-[2.4rem] md:text-6xl lg:text-[4.5rem] text-cut-ivory tracking-tight">
                  خليك مختلف
                </span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="hidden md:block text-cut-ivory/70 text-sm md:text-base lg:text-lg max-w-md leading-[1.85]">
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
                  className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-bold text-cut-ivory text-base border border-cut-warm-beige/50 bg-cut-black/35 backdrop-blur-sm hover:bg-cut-warm-beige/10 hover:border-cut-warm-beige transition-all duration-300 cursor-pointer">
                  <Zap className="w-4 h-4 text-cut-bronze" />
                  أقرب ميعاد متاح
                </button>
              </motion.div>

              <motion.div custom={3.5} variants={fadeUp} initial="hidden" animate="visible" className="hidden md:block w-full max-w-md">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cut-espresso/60 backdrop-blur-sm border border-cut-bronze/20">
                  <div className="w-2 h-2 rounded-full bg-cut-warm-beige animate-pulse flex-shrink-0" />
                  <p className="text-cut-ivory/55 text-xs flex-1">اختار الخدمة لمعرفة أقرب ميعاد</p>
                  <Zap className="w-3 h-3 text-cut-bronze/70 flex-shrink-0" />
                </div>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                className="hidden md:grid grid-cols-3 gap-2 md:gap-3 w-full max-w-md mt-1">
                {[
                  { icon: Shield, title: "حلاقين محترفين", sub: "معايير عالية" },
                  { icon: Gem, title: "تجربة فاخرة", sub: "أناقة وراحة" },
                  { icon: Clock, title: "مواعيد دقيقة", sub: "حجز سريع" },
                ].map((b) => (
                  <div key={b.title}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-cut-espresso/50 backdrop-blur-sm border border-cut-bronze/15 hover:border-cut-bronze/35 transition-colors">
                    <b.icon className="w-4 h-4 text-cut-bronze" />
                    <p className="cut-ar-ui-title text-cut-ivory text-[11px] md:text-xs font-bold leading-tight text-center">{b.title}</p>
                    <p className="cut-ar-meta text-cut-ivory/35 text-[9px] md:text-[10px] leading-tight text-center hidden md:block">{b.sub}</p>
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
          className="relative hidden md:block w-full pb-5 pt-3 lg:pb-8 lg:pt-5"
        >
          <div className="absolute top-0 right-0 bottom-0 w-16 md:w-20 z-20 bg-gradient-to-l from-cut-black to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 bottom-0 w-16 md:w-20 z-20 bg-gradient-to-r from-cut-black to-transparent pointer-events-none" />

          <div className="flex gap-3 overflow-x-auto px-6 md:px-16 lg:px-24 scroll-smooth snap-x snap-mandatory scrollbar-hide"
            aria-label="حلاقين متاحين" role="list">
            {barberStrip.map((b, i) => (
              <motion.button
                key={b.id}
                onClick={() => window.dispatchEvent(new CustomEvent("cut:book-barber", { detail: { name: b.name, image: b.image } }))}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.75 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 w-[190px] md:w-[210px] rounded-2xl cursor-pointer cut-card-editorial hover:border-cut-bronze/40 hover:shadow-cut-glow transition-all duration-300"
                role="listitem"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-cut-bronze/30">
                  <BarberPhoto src={b.image} name={b.name} imgClassName="w-full h-full object-cover object-top" />
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="cut-ar-ui-title text-cut-ivory font-bold text-sm truncate">{b.name}</p>
                  <p className="cut-ar-meta text-cut-ivory/45 text-xs mt-0.5">حلاق محترف</p>
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
