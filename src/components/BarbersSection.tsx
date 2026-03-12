import barberMohamed from "@/assets/barber-mohamed.jpg";
import barberBassem from "@/assets/barber-bassem.jpg";
import barberKareem from "@/assets/barber-kareem.jpg";
import barberZiad from "@/assets/barber-ziad.jpg";

const barbers = [
  {
    name: "محمد",
    desc: "خبير في القصات الكلاسيكية والعصرية",
    image: barberMohamed,
    buttonText: "احجز مع محمد",
    link: "https://calendly.com/saadfouad1976t2/cut-salon-mohamed-barber",
  },
  {
    name: "باسم",
    desc: "متخصص في تصفيفات الشعر الحديثة",
    image: barberBassem,
    buttonText: "احجز مع باسم",
    link: "https://calendly.com/saadfouad1976t3/cut-salon-bassem-barber",
  },
  {
    name: "كريم",
    desc: "فنان في تصميم اللحية والذقن",
    image: barberKareem,
    buttonText: "احجز مع كريم",
    link: "https://calendly.com/tsts20031976/cut-salob-kareem-barber?month=2026-03",
  },
  {
    name: "زياد",
    desc: "خبرة واسعة في أحدث صيحات القصات",
    image: barberZiad,
    buttonText: "احجز مع زياد",
    link: "https://calendly.com/saadfouad1976tt/cut-salon-ziad-barber",
  },
];

const BarbersSection = () => {
  return (
    <section id="barbers" className="py-20 md:py-28 bg-background">
      <div className="container px-4">
        <div className="text-center mb-14">
          <p className="text-primary font-heading font-bold text-sm tracking-widest mb-3">فريقنا</p>
          <h2 className="font-heading text-3xl md:text-4xl font-800 text-gold-gradient">اختَر حلاقك المفضل</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {barbers.map((barber) => (
            <div
              key={barber.name}
              className="gold-border-glow rounded-xl bg-card overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_hsl(43_90%_55%/0.12)]"
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
                <p className="text-muted-foreground text-sm mb-5">{barber.desc}</p>
                <a
                  href={barber.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-shimmer block w-full py-3 rounded-lg font-heading font-bold text-primary-foreground transition-all hover:scale-[1.02]"
                >
                  {barber.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BarbersSection;
