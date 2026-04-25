import { Scissors, Droplets, Sparkles, Crown } from "lucide-react";

const hairServices = [
  { name: "قص شعر (Haircut)", price: "150 جنيه" },
  { name: "تحديد لحية (Beard)", price: "100 جنيه" },
  { name: "قص شعر + لحية (Hair + Beard)", price: "200 جنيه" },
  { name: "سيشوار (Blow-dry)", price: "80 جنيه" },
  { name: "تصميم على الشعر (Hair Design)", price: "50 جنيه" },
];

const skinServices = [
  { name: "تنظيف بشرة عادي (Basic Facial)", price: "200 جنيه" },
  { name: "تنظيف بشرة عميق (Deep Facial)", price: "300 جنيه" },
  { name: "تنظيف الأنف (Nose Cleaning)", price: "50 جنيه" },
  { name: "ماسك للبشرة (Mask)", price: "30 جنيه" },
];

const extraServices = [
  { name: "إزالة شعر بالشمع (Wax)", price: "100 جنيه" },
  { name: "سبراي تكثيف الشعر (Toppik Spray)", price: "50 جنيه" },
  { name: "صبغة شعر عادية (Normal Hair Dye)", price: "50 جنيه" },
  { name: "صبغة شعر + لحية (Hair + Beard Dye)", price: "200 جنيه" },
];

const specialServices = [
  { name: "بروتين للشعر القصير (Short Hair Protein)", price: "500 جنيه" },
  { name: "بروتين للشعر الطويل (Long Hair Protein)", price: "700 جنيه" },
  { name: "فرد الشعر (Hair Straightening)", price: "200 جنيه" },
  { name: "تلوين الشعر (Hair Color)", price: "100 جنيه" },
  { name: "هايلايت فضي (Silver Highlights)", price: "700 جنيه" },
];

interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  services: { name: string; price: string }[];
  delay: string;
}

const ServiceCard = ({ title, icon, services, delay }: ServiceCardProps) => (
  <div
    className="gold-border-glow rounded-xl bg-card overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(43_90%_55%/0.12)] animate-fade-up"
    style={{ animationDelay: delay }}
  >
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-lg gold-shimmer flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-heading text-xl font-bold text-gold-gradient">{title}</h3>
      </div>
      <ul className="space-y-3">
        {services.map((service, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <span className="text-muted-foreground text-sm">{service.name}</span>
            <span className="font-heading font-bold text-primary">{service.price}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 md:py-28 bg-background relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent" />

      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-14">
          <p className="text-primary font-heading font-bold text-sm tracking-widest mb-3">خدماتنا</p>
          <h2 className="font-heading text-3xl md:text-4xl font-800 text-gold-gradient mb-4">
            💈 أسعار Cut Salon ✂️
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            اكتشف مجموعة متكاملة من الخدمات المتميزة بأفضل الأسعار
          </p>
        </div>

        {/* Mobile: Horizontal scroll slider | Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto overflow-x-auto pb-4 md:pb-0 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide">
          <div className="flex-shrink-0 w-[300px] md:w-auto snap-center">
            <ServiceCard
              title="خدمات الشعر"
              icon={<Scissors className="w-6 h-6 text-primary-foreground" />}
              services={hairServices}
              delay="0.1s"
            />
          </div>
          <div className="flex-shrink-0 w-[300px] md:w-auto snap-center">
            <ServiceCard
              title="العناية بالبشرة"
              icon={<Droplets className="w-6 h-6 text-primary-foreground" />}
              services={skinServices}
              delay="0.2s"
            />
          </div>
          <div className="flex-shrink-0 w-[300px] md:w-auto snap-center">
            <ServiceCard
              title="خدمات إضافية"
              icon={<Sparkles className="w-6 h-6 text-primary-foreground" />}
              services={extraServices}
              delay="0.3s"
            />
          </div>
          <div className="flex-shrink-0 w-[300px] md:w-auto snap-center">
            <ServiceCard
              title="خدمات خاصة"
              icon={<Crown className="w-6 h-6 text-primary-foreground" />}
              services={specialServices}
              delay="0.4s"
            />
          </div>
        </div>

        {/* Mobile scroll indicator */}
        <div className="flex md:hidden justify-center gap-2 mt-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="w-2 h-2 rounded-full bg-primary/30" />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <a
            href="#barbers"
            className="gold-shimmer inline-block px-10 py-4 rounded-lg font-heading font-bold text-primary-foreground text-lg transition-all hover:scale-105 animate-gold-pulse"
          >
            احجز موعدك الآن
          </a>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
