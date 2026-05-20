import { Calendar } from "lucide-react";

const BookingCTA = () => {
  return (
    <section className="relative py-16 md:py-24 bg-[#050505] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-[#D4AF37] font-heading font-bold text-sm tracking-widest mb-3">جاهز؟</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            احجز <span className="text-gold-gradient">موعدك</span> الآن
          </h2>
          <p className="text-zinc-500 text-sm md:text-base mb-8 max-w-md mx-auto">
            اختَر الحلاق المناسب وحدد الوقت اللي يريّحك. الحجز سهل وسريع.
          </p>
          <a
            href="#barbers"
            className="group relative inline-flex items-center justify-center gap-3 px-10 md:px-14 py-4 md:py-5 rounded-2xl font-heading font-black text-[#050505] text-base md:text-lg overflow-hidden bg-gradient-to-l from-[#C8A96A] to-[#E5C07B] shadow-[0_10px_48px_rgba(212,175,55,0.3)] hover:shadow-[0_16px_64px_rgba(212,175,55,0.45)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-l from-white/25 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <Calendar className="w-5 h-5 relative z-10" />
            <span className="relative z-10">احجز الآن</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default BookingCTA;
