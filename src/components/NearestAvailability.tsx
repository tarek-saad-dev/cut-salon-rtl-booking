"use client";

import { Zap, Clock, MapPin } from "lucide-react";

const NearestAvailability = () => {
  return (
    <section className="relative py-16 md:py-20 bg-cut-black overflow-hidden">
      {/* Top separator */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-cut-gold/15 to-transparent" />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(164,136,121,0.06),transparent_60%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Section label */}
          <div className="text-center mb-6">
            <p className="text-cut-gold font-heading font-bold text-sm tracking-widest mb-2">أقرب ميعاد</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-cut-ivory">
              أقرب ميعاد متاح <span className="text-gold-gradient">الآن</span>
            </h2>
          </div>

          {/* Premium dark/gold card */}
          <div className="rounded-2xl border border-cut-gold/20 bg-cut-black overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-cut-gold/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cut-gold" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-cut-ivory">أقرب ميعاد متاح الآن</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cut-warm-beige animate-pulse" />
                  <span className="text-cut-bronze/70 text-[10px] font-medium">مباشر</span>
                </div>
              </div>
            </div>

            {/* Card body — fallback state (no live data) */}
            <div className="px-6 py-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <Clock className="w-4 h-4 text-cut-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cut-ivory/40 text-xs mb-0.5">الوقت</p>
                    <p className="text-cut-ivory/60 text-sm">اختار الخدمة وسنرشح لك أقرب حلاق متاح</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-5">
                <MapPin className="w-4 h-4 text-cut-gold mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-cut-ivory/40 text-xs mb-0.5">الفرع</p>
                  <p className="text-cut-ivory font-medium text-sm">Cut Salon · جليم، الإسكندرية</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("cut:book-nearest"))}
                className="w-full py-3 rounded-xl font-heading font-bold text-sm text-cut-black transition-all cursor-pointer
                  bg-gradient-to-l from-cut-gold to-cut-gold
                  shadow-[0_4px_20px_rgba(164,136,121,0.2)]
                  hover:shadow-[0_6px_28px_rgba(164,136,121,0.35)] hover:scale-[1.01] active:scale-[0.98]
                  flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                احجز أقرب ميعاد
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NearestAvailability;
