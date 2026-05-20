import { Zap, UserCheck, Clock, Star } from "lucide-react";

const benefits = [
  { icon: Zap, title: "حجز سريع", desc: "احجز موعدك خلال ثوانٍ من موبايلك." },
  { icon: UserCheck, title: "اختيار الحلاق", desc: "اختَر الحلاق اللي تفضله بسهولة." },
  { icon: Clock, title: "تنظيم المواعيد", desc: "نظام حجز يساعد على تقليل الزحام." },
  { icon: Star, title: "تجربة احترافية", desc: "خدمة مميزة وجودة عالية كل زيارة." },
];

const BenefitsSection = () => {
  return (
    <section className="relative py-20 md:py-28 bg-[#050505] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/15 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.04),transparent_55%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[#D4AF37] font-heading font-bold text-sm tracking-widest mb-3">لماذا Cut Salon؟</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white">
            ليه تختار <span className="text-gold-gradient">Cut Salon؟</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-4xl mx-auto">
          {benefits.map((b) => (
            <div key={b.title}
              className="group rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-5 md:p-7 text-center transition-all duration-300 hover:border-[#D4AF37]/20 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(212,175,55,0.06)]"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center mx-auto mb-4 md:mb-5 group-hover:bg-[#D4AF37]/12 transition-colors">
                <b.icon className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-heading text-sm md:text-lg font-bold text-white mb-1.5">{b.title}</h3>
              <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
