import { Scissors } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="hero-gradient relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
      
      <div className="container relative z-10 text-center px-4 py-20">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up">
          <Scissors className="w-8 h-8 text-primary rotate-[-45deg]" />
          <span className="text-gold-gradient font-heading text-2xl font-bold tracking-wider">CUT SALON</span>
          <Scissors className="w-8 h-8 text-primary rotate-[135deg]" />
        </div>

        {/* Headline */}
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-900 leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <span className="text-gold-gradient">احجز موعدك بسهولة</span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          اختَر الحلاق المناسب لك واحجز موعدك في ثوانٍ داخل Cut Salon.
        </p>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.25s" }}>
          تجربة حجز بسيطة وسريعة بدون زحام.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <a
            href="#barbers"
            className="gold-shimmer px-8 py-4 rounded-lg font-heading font-bold text-primary-foreground text-lg transition-all hover:scale-105 animate-gold-pulse"
          >
            احجز الآن
          </a>
          <a
            href="#barbers"
            className="px-8 py-4 rounded-lg font-heading font-bold text-foreground border border-border hover:border-primary/50 transition-all hover:bg-secondary text-lg"
          >
            شاهد الحلاقين
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
