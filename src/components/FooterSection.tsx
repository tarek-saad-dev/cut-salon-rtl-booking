import { MapPin, Phone, ExternalLink } from "lucide-react";

const FooterSection = () => {
  return (
    <footer id="branches" className="relative bg-[#050505] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/15 to-transparent" />

      <div className="container px-4 py-14 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12">

          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-1.5 select-none group mb-5 w-fit">
              <span className="text-[#D4AF37] text-lg font-black tracking-widest">—</span>
              <div className="text-center mx-1">
                <span className="text-white text-xl font-black tracking-[0.25em] leading-none">CUT</span>
                <div className="text-[8px] text-[#D4AF37] tracking-[0.5em] font-semibold -mt-0.5">SALON</div>
              </div>
              <span className="text-[#D4AF37] text-lg font-black tracking-widest">—</span>
            </a>
            <p className="text-zinc-500 text-sm leading-[1.8] max-w-xs">
              صالون رجالي متخصص في قصات الشعر الحديثة والعناية باللحية، مع نظام حجز مسبق لتقديم تجربة أفضل.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-base text-white mb-5">تواصل معنا</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-0.5">الهاتف / واتساب</p>
                  <a href="https://wa.me/201012126899" target="_blank" rel="noopener noreferrer"
                    className="text-white text-sm font-medium hover:text-[#D4AF37] transition-colors" dir="ltr">
                    +20 101 212 6899
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Branches */}
          <div>
            <h4 className="font-heading font-bold text-base text-white mb-5">الفروع</h4>
            <div className="space-y-5">
              {[
                {
                  name: "فرع جليم – سابا باشا",
                  address: "يسرى قمحة، فلمنج، قسم أول الرمل، الإسكندرية",
                  link: "https://share.google/F4o7oOQVs3EJSgxaw",
                },
                {
                  name: "فرع سيدي جابر – مساكن الضباط",
                  address: "96 مصطفى كامل، سيدي جابر، الإسكندرية",
                  link: "https://share.google/sdf7izl3WKSpmlwPg",
                },
              ].map((branch) => (
                <div key={branch.name} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium mb-0.5">{branch.name}</p>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-1">{branch.address}</p>
                    <a href={branch.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#D4AF37] text-xs hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      الموقع على الخريطة
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/[0.06] pt-6 text-center">
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} Cut Salon. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
