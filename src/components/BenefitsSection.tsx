"use client";

import { Zap, UserCheck, Clock, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";

const ICONS = [Zap, UserCheck, Clock, Star] as const;

const BenefitsSection = () => {
  const { lang, dir } = useLanguage();
  const t = landingCopy.benefits;

  return (
    <section className="relative py-20 md:py-28 bg-cut-black overflow-hidden" dir={dir}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-cut-gold/15 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(164,136,121,0.04),transparent_55%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-cut-gold font-heading font-bold text-sm tracking-widest mb-3">{tx(t.eyebrow, lang)}</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-cut-ivory">
            {tx(t.titleBefore, lang)}
            <span className="text-gold-gradient">{tx(t.titleAccent, lang)}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-4xl mx-auto">
          {t.items.map((item, i) => {
            const Icon = ICONS[i]!;
            const title = tx(item.title, lang);
            return (
              <div
                key={title}
                className="group cut-card-editorial p-5 md:p-7 text-center transition-all duration-300 hover:border-cut-bronze/40 hover:-translate-y-1 hover:shadow-cut-glow"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-cut-gold/8 border border-cut-gold/15 flex items-center justify-center mx-auto mb-4 md:mb-5 group-hover:bg-cut-gold/12 transition-colors">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-cut-gold" />
                </div>
                <h3 className="font-heading text-sm md:text-lg font-bold text-cut-ivory mb-1.5">{title}</h3>
                <p className="text-cut-ivory/65 text-xs md:text-sm leading-relaxed">{tx(item.desc, lang)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
