"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useMobileNavOptional } from "@/context/MobileNavContext";
import { useMobileNavAppearance } from "@/hooks/useMobileNavAppearance";
import { navigationLabels } from "@/lib/i18n/navigation";
import MobileMenuSheet, { CutLogoMark, MOBILE_MENU_ID } from "./MobileMenuSheet";

function LangSwitch({ overlayTransparent }: { overlayTransparent: boolean }) {
  const { lang, setLang } = useLanguage();

  const inactive = overlayTransparent ? "text-cut-ivory/45" : "text-cut-ivory/40";
  const active = "text-cut-ivory";
  const dot = overlayTransparent ? "text-cut-ivory/35" : "text-cut-ivory/30";

  return (
    <div
      className="inline-flex items-center gap-0.5 text-[10px] font-black tracking-[0.08em]"
      role="group"
      aria-label={lang === "ar" ? "اللغة" : "Language"}
    >
      <button
        type="button"
        onClick={() => setLang("ar")}
        className={`min-h-9 min-w-7 px-0.5 transition ${lang === "ar" ? active : inactive}`}
        aria-pressed={lang === "ar"}
      >
        AR
      </button>
      <span className={dot} aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`min-h-9 min-w-7 px-0.5 transition ${lang === "en" ? active : inactive}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}

export default function GlobalMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const mobileNav = useMobileNavOptional();
  const { overlayTransparent, hasHeroOverlay } = useMobileNavAppearance();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];

  const isHome = pathname === "/" || pathname === "";
  const showBack = mobileNav?.back.visible ?? !isHome;

  const handleBack = () => {
    if (mobileNav?.back.action) {
      mobileNav.back.action();
      return;
    }
    router.back();
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navBg = overlayTransparent
    ? "bg-[rgba(0,0,0,0.25)] border-b border-transparent"
    : "bg-[rgba(5,5,5,0.94)] backdrop-blur-md border-b border-cut-bronze/15";

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-lg text-cut-ivory transition hover:bg-cut-ivory/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige";

  return (
    <>
      <header
        className={`fixed inset-x-0 z-[55] transition-[background-color,backdrop-filter,border-color] duration-200 lg:hidden ${navBg}`}
        style={{
          top: "var(--cut-campaign-bar-height, 0px)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
        dir={dir}
        data-global-mobile-nav
      >
        <div className="relative mx-auto flex h-[3.25rem] max-w-[100vw] items-center px-2 sm:px-3">
          <div className="flex min-w-[5.5rem] items-center gap-0.5">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label={lang === "ar" ? "رجوع" : "Back"}
                className={iconBtn}
              >
                <BackIcon className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
            <LangSwitch overlayTransparent={overlayTransparent} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <div className="pointer-events-auto">
              <CutLogoMark />
            </div>
          </div>

          <div className="ms-auto flex min-w-[2.5rem] justify-end">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? label("closeMenu") : label("openMenu")}
              aria-expanded={menuOpen}
              aria-controls={MOBILE_MENU_ID}
              className={iconBtn}
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Flow spacer — skipped when a hero pulls content under the fixed bar */}
      {!hasHeroOverlay ? (
        <div
          className="pointer-events-none shrink-0 lg:hidden"
          aria-hidden
          style={{ height: "var(--cut-mobile-nav-total, 3.25rem)" }}
        />
      ) : null}

      <MobileMenuSheet open={menuOpen} onClose={closeMenu} returnFocusRef={menuTriggerRef} />
    </>
  );
}
