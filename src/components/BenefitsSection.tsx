import { Zap, UserCheck, Clock, Star } from "lucide-react";

const benefits = [
  { icon: Zap, title: "حجز سريع", desc: "احجز موعدك في ثوانٍ معدودة" },
  { icon: UserCheck, title: "اختيار الحلاق المناسب", desc: "تصفّح الحلاقين واختَر اللي يناسبك" },
  { icon: Clock, title: "مواعيد دقيقة", desc: "بدون انتظار، موعدك محجوز مسبقاً" },
  { icon: Star, title: "تجربة صالون احترافية", desc: "خدمة مميزة وجودة عالية في كل زيارة" },
];

const BenefitsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/50">
      <div className="container px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-heading font-bold text-sm tracking-widest mb-3">لماذا نحن</p>
          <h2 className="font-heading text-3xl md:text-4xl font-800 text-gold-gradient">ليه تختار Cut Salon؟</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="gold-border-glow rounded-xl bg-card p-7 text-center transition-all hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <b.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-muted-foreground text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
