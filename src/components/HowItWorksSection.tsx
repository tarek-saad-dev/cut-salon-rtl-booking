import { UserSearch, CalendarDays, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: UserSearch, number: "١", title: "اختَر الحلاق", desc: "تصفّح فريقنا واختَر الحلاق المناسب لك." },
  { icon: CalendarDays, number: "٢", title: "اختَر الميعاد", desc: "اختَر اليوم والوقت المناسب." },
  { icon: CheckCircle2, number: "٣", title: "أكد الحجز", desc: "استلم تأكيد حجزك فوراً." },
];

const HowItWorksSection = () => {
  return (
    <section className="relative py-20 md:py-28 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/15 to-transparent" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[#D4AF37] font-heading font-bold text-sm tracking-widest mb-3">خطوات الحجز</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white">
            كيف <span className="text-gold-gradient">تحجز؟</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.title} className="relative text-center">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-0 w-full h-px bg-gradient-to-l from-[#D4AF37]/20 to-transparent -translate-x-1/2" />
              )}
              {/* Step number circle */}
              <div className="w-20 h-20 rounded-full border border-[#D4AF37]/20 bg-[#0e0e0e] flex items-center justify-center mx-auto mb-4 relative z-10 shadow-[0_0_30px_rgba(212,175,55,0.06)]">
                <step.icon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <span className="text-[#D4AF37] font-heading font-bold text-xs mb-1.5 block tracking-widest">الخطوة {step.number}</span>
              <h3 className="font-heading text-lg md:text-xl font-bold text-white mb-1.5">{step.title}</h3>
              <p className="text-zinc-500 text-xs md:text-sm">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Waiting note */}
        <div className="mt-10 md:mt-14 max-w-xl mx-auto text-center">
          <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e0e] px-6 py-4">
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
              عند حضورك في الموعد قد يكون هناك انتظار بسيط من <span className="text-[#D4AF37] font-bold">1 إلى 10 دقائق</span> كحد أقصى حتى يبدأ دورك.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
