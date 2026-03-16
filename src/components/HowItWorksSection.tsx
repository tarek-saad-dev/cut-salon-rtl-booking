import { UserSearch, CalendarDays, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: UserSearch, number: "١", title: "اختَر الحلاق", desc: "تصفّح فريقنا واختَر الحلاق المناسب لك." },
  { icon: CalendarDays, number: "٢", title: "اختَر الميعاد", desc: "اختَر اليوم والوقت المناسب." },
  { icon: CheckCircle2, number: "٣", title: "أكد الحجز", desc: "استلم تأكيد حجزك فوراً." },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-heading font-bold text-sm tracking-widest mb-3">خطوات الحجز</p>
          <h2 className="font-heading text-3xl md:text-4xl font-800 text-gold-gradient">كيف تحجز؟</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.title} className="relative text-center">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-0 w-full h-px bg-gradient-to-l from-primary/30 to-transparent -translate-x-1/2" />
              )}
              <div className="w-20 h-20 rounded-full gold-border-glow bg-card flex items-center justify-center mx-auto mb-5 relative z-10">
                <step.icon className="w-9 h-9 text-primary" />
              </div>
              <span className="text-primary font-heading font-bold text-sm mb-2 block">{step.number}</span>
              <h3 className="font-heading text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Waiting note */}
        <div className="mt-10 max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground text-sm bg-secondary/60 rounded-lg px-6 py-4 border border-border">
            عند حضورك في الموعد قد يكون هناك انتظار بسيط من 1 إلى 10 دقائق كحد أقصى حتى يبدأ دورك.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
