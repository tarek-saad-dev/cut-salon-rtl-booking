"use client";

import { UserSearch, CalendarDays, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";

const ICONS = [UserSearch, CalendarDays, CheckCircle2] as const;

const HowItWorksSection = () => {
  const { lang, dir } = useLanguage();
  const t = landingCopy.howItWorks;

  return (
    <section className="relative py-20 md:py-28 bg-cut-black overflow-hidden" dir={dir}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-cut-gold/15 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-cut-gold font-heading font-bold text-sm tracking-widest mb-3">{tx(t.eyebrow, lang)}</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-cut-ivory">
            {tx(t.titleBefore, lang)}
            <span className="text-gold-gradient">{tx(t.titleAccent, lang)}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
          {t.steps.map((step, i) => {
            const Icon = ICONS[i]!;
            const title = tx(step.title, lang);
            return (
              <div key={title} className="relative text-center">
                {i < t.steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-0 w-full h-px bg-gradient-to-l from-cut-gold/20 to-transparent -translate-x-1/2" />
                )}
                <div className="w-20 h-20 rounded-full border border-cut-gold/20 bg-cut-surface flex items-center justify-center mx-auto mb-4 relative z-10 shadow-[0_0_30px_rgba(164,136,121,0.06)]">
                  <Icon className="w-8 h-8 text-cut-gold" />
                </div>
                <span className="text-cut-gold font-heading font-bold text-xs mb-1.5 block tracking-widest">
                  {tx(t.stepLabel, lang)} {tx(step.number, lang)}
                </span>
                <h3 className="font-heading text-lg md:text-xl font-bold text-cut-ivory mb-1.5">{title}</h3>
                <p className="text-cut-ivory/65 text-xs md:text-sm">{tx(step.desc, lang)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 md:mt-14 max-w-xl mx-auto text-center">
          <div className="rounded-2xl border border-white/[0.06] bg-cut-surface px-6 py-4">
            <p className="text-cut-ivory/55 text-xs md:text-sm leading-relaxed">
              {tx(t.waitNoteBefore, lang)}
              <span className="text-cut-gold font-bold">{tx(t.waitNoteAccent, lang)}</span>
              {tx(t.waitNoteAfter, lang)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
