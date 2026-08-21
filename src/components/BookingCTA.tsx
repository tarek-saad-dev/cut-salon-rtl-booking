"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";

const LANDLINE_TEL = "tel:035861483";
const MOBILE_TEL = "tel:01012126899";
const WHATSAPP_HREF = "https://wa.me/201012126899";

const BookingCTA = () => {
  const { lang, dir } = useLanguage();
  const t = landingCopy.cta;

  return (
    <section className="relative py-16 md:py-24 bg-cut-black overflow-hidden" dir={dir}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(164,136,121,0.08),transparent_60%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-heading text-sm font-bold tracking-widest text-cut-gold">
            {tx(t.eyebrow, lang)}
          </p>
          <h2 className="mb-3 font-heading text-3xl font-black text-cut-ivory md:text-4xl lg:text-5xl">
            {tx(t.title, lang)}
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-cut-ivory/65 md:text-base">
            {tx(t.body, lang)}
          </p>

          <div className="mx-auto grid max-w-lg gap-3 sm:grid-cols-3">
            <a
              href={LANDLINE_TEL}
              className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-cut-bronze/40 bg-cut-ivory/[0.04] px-4 py-3 transition hover:border-cut-warm-beige hover:bg-cut-burgundy/40 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-cut-ivory/55">
                <Phone className="h-3.5 w-3.5 text-cut-bronze" />
                {tx(t.landlineLabel, lang)}
              </span>
              <span className="font-display text-base tracking-[0.06em] text-cut-warm-beige" dir="ltr">
                {tx(t.landlineDisplay, lang)}
              </span>
            </a>

            <a
              href={MOBILE_TEL}
              className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-cut-bronze/40 bg-cut-ivory/[0.04] px-4 py-3 transition hover:border-cut-warm-beige hover:bg-cut-burgundy/40 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-cut-ivory/55">
                <Phone className="h-3.5 w-3.5 text-cut-bronze" />
                {tx(t.mobileLabel, lang)}
              </span>
              <span className="font-display text-base tracking-[0.06em] text-cut-warm-beige" dir="ltr">
                {tx(t.mobileDisplay, lang)}
              </span>
            </a>

            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-[#25D366]/45 bg-[#25D366]/[0.1] px-4 py-3 transition hover:border-[#25D366] hover:bg-[#25D366]/18 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-cut-ivory/70">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                {tx(t.whatsappLabel, lang)}
              </span>
              <span className="font-display text-base tracking-[0.06em] text-cut-ivory" dir="ltr">
                {tx(t.mobileDisplay, lang)}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingCTA;
