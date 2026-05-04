import { MapPin, Phone } from "lucide-react";

const logo = "/logo.jpeg";

const FooterSection = () => {
  return (
    <footer className="py-14 bg-card border-t border-border">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="CUT Salon" className="w-24 rounded-lg" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              صالون رجالي متخصص في قصات الشعر الحديثة والعناية باللحية، مع نظام حجز مسبق لتنظيم المواعيد وتقديم تجربة أفضل للعملاء.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">تواصل معنا</h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>📞 الهاتف / واتساب</span>
              </li>
              <li>
                <a href="https://wa.me/201012126899" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  +201012126899
                </a>
              </li>
            </ul>
          </div>

          {/* Branches */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">الفروع</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground mb-1">📍 فرع (جليم – سابا باشا)</p>
                    <p>يسرى قمحة، فلمنج، قسم أول الرمل، محافظة الإسكندرية</p>
                    <a
                      href="https://share.google/F4o7oOQVs3EJSgxaw"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs mt-1 inline-block"
                    >
                      الموقع على الخريطة ←
                    </a>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground mb-1">📍 فرع (سيدي جابر – مساكن الضباط)</p>
                    <p>96 مصطفى كامل، سيدي جابر، قسم سيدي جابر، محافظة الإسكندرية</p>
                    <a
                      href="https://share.google/sdf7izl3WKSpmlwPg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs mt-1 inline-block"
                    >
                      الموقع على الخريطة ←
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-muted-foreground text-xs">© 2026 Cut Salon. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
