import { useState } from "react";
import barberMohamed from "@/assets/barber-mohamed.jpg";
import barberBassem from "@/assets/barber-bassem.jpg";
import barberKareem from "@/assets/barber-kareem.jpg";
import youngZiad from "@/assets/young-ziad.jpg";
import CalendlyModal from "./CalendlyModal";

const barbers = [
  {
    name: "محمد",
    role: "حلاق",
    image: barberMohamed,
    buttonText: "احجز مع محمد",
    link: "https://calendly.com/saadfouad1976t2/cut-salon-mohamed-barber",
  },
  {
    name: "باسم",
    role: "حلاق",
    image: barberBassem,
    buttonText: "احجز مع باسم",
    link: "https://calendly.com/saadfouad1976t3/cut-salon-bassem-barber",
  },
  {
    name: "كريم",
    role: "حلاق",
    image: barberKareem,
    buttonText: "احجز مع كريم",
    link: "https://calendly.com/tsts20031976/cut-salob-kareem-barber?month=2026-03",
  },
  {
    name: "زياد",
    role: "اخصائي العناية بالبشرة",
    image: youngZiad,
    buttonText: "احجز مع زياد",
    link: "https://calendly.com/saadfouad1976/skincare",
  },
];

const BarbersSection = () => {
  const [selectedBarber, setSelectedBarber] = useState<typeof barbers[0] | null>(null);

  return (
    <section id="barbers" className="py-20 md:py-28 bg-background">
      <div className="container px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-heading font-bold text-sm tracking-widest mb-3">فريقنا</p>
          <h2 className="font-heading text-3xl md:text-4xl font-800 text-gold-gradient">اختَر حلاقك المفضل</h2>
        </div>

        {/* Booking Policy Notice */}
        <div className="gold-border-glow rounded-xl bg-card/50 p-5 mb-10 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gold-shimmer flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">✂️</span>
            </div>
            <div className="text-right">
              <p className="text-foreground font-medium mb-2">
                علشان نحافظ على جودة الخدمة، الحجز بيكون قبلها بـ <span className="text-primary font-bold">4 ساعات</span> ✂️
              </p>
              <p className="text-muted-foreground text-sm">
                ولو حابب تيجي فورًا، بتاخد دور وبتدخل في دورك علطول
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: Horizontal scroll slider | Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto overflow-x-auto pb-4 md:pb-0 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide">
          {barbers.map((barber) => (
            <div
              key={barber.name}
              className="gold-border-glow rounded-xl bg-card overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(43_90%_55%/0.12)] flex-shrink-0 w-[280px] md:w-auto snap-center"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={barber.image}
                  alt={barber.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 text-center">
                <h3 className="font-heading text-xl font-bold mb-1">{barber.name}</h3>
                <p className="text-primary/80 text-sm mb-3">{barber.role}</p>
                <button
                  onClick={() => setSelectedBarber(barber)}
                  className="gold-shimmer block w-full py-3 rounded-lg font-heading font-bold text-primary-foreground transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {barber.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll indicator */}
        <div className="flex md:hidden justify-center gap-2 mt-4">
          {barbers.map((_, idx) => (
            <div key={idx} className="w-2 h-2 rounded-full bg-primary/30" />
          ))}
        </div>
      </div>

      {selectedBarber && (
        <CalendlyModal
          open={!!selectedBarber}
          onOpenChange={(open) => !open && setSelectedBarber(null)}
          url={selectedBarber.link}
          barberName={selectedBarber.name}
        />
      )}
    </section>
  );
};

export default BarbersSection;
