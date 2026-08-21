"use client";

import { MapPin, Phone, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";

const FooterSection = () => {
  const { lang, dir } = useLanguage();
  const t = landingCopy.footer;

  return (
    <footer id="branches" className="relative bg-cut-black overflow-hidden" dir={dir}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-cut-bronze/20 to-transparent" />

      <div className="container px-4 py-14 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12">
          <div>
            <a href="#" className="flex items-center gap-1.5 select-none group mb-5 w-fit">
              <span className="text-cut-bronze text-lg font-black tracking-widest">—</span>
              <div className="text-center mx-1">
                <span className="text-cut-ivory text-xl font-black tracking-[0.25em] leading-none font-display">CUT</span>
                <div className="text-[8px] text-cut-bronze tracking-[0.5em] font-semibold -mt-0.5">SALON</div>
              </div>
              <span className="text-cut-bronze text-lg font-black tracking-widest">—</span>
            </a>
            <p className="text-cut-ivory/65 text-sm leading-[1.8] max-w-xs">{tx(t.about, lang)}</p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-base text-cut-warm-beige mb-5">{tx(t.contactTitle, lang)}</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cut-espresso border border-cut-bronze/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-cut-bronze" />
                </div>
                <div>
                  <p className="text-cut-ivory/65 text-xs mb-0.5">{tx(t.phoneLabel, lang)}</p>
                  <a
                    href="https://wa.me/201012126899"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cut-ivory text-sm font-medium hover:text-cut-warm-beige transition-colors"
                    dir="ltr"
                  >
                    +20 101 212 6899
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-base text-cut-warm-beige mb-5">{tx(t.branchesTitle, lang)}</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cut-espresso border border-cut-bronze/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-cut-bronze" />
                </div>
                <div>
                  <p className="text-cut-ivory text-sm font-medium mb-0.5">{tx(t.branchName, lang)}</p>
                  <p className="text-cut-ivory/65 text-xs leading-relaxed mb-1">{tx(t.branchAddress, lang)}</p>
                  <a
                    href="https://share.google/F4o7oOQVs3EJSgxaw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cut-bronze text-xs hover:text-cut-warm-beige transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {tx(t.mapLink, lang)}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cut-bronze/15 pt-6 text-center">
          <p className="text-cut-ivory/45 text-xs">
            © {new Date().getFullYear()} Cut Salon. {tx(t.rights, lang)}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
