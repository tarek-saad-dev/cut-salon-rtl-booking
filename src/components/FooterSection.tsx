import { Scissors, MapPin, Phone, MessageCircle } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="py-14 bg-card border-t border-border">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="w-6 h-6 text-primary rotate-[-45deg]" />
              <span className="text-gold-gradient font-heading text-xl font-bold tracking-wider">CUT SALON</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              صالون رجالي متميز يقدم أفضل خدمات الحلاقة والعناية بالشعر واللحية.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">تواصل معنا</h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+20 100 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>واتساب: +20 100 000 0000</span>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">الموقع</h4>
            <div className="flex items-start gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 text-primary mt-0.5" />
              <span>القاهرة، مصر – الموقع بالتحديد قريباً</span>
            </div>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} Cut Salon. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            {["فيسبوك", "انستغرام", "تيك توك"].map((name) => (
              <a key={name} href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs font-heading">
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
