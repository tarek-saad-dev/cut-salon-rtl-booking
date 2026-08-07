"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { navigationLabels } from "@/lib/i18n/navigation";

const WHATSAPP_URL = "https://wa.me/201012126899";

type BookFlowChromeProps = {
  children: React.ReactNode;
  /** Show back control over the hero (e.g. visit-type → locations). */
  backHref?: string;
  backLabel?: string;
  footer?: boolean;
  /** Title composed onto the hero image (e.g. Menu). */
  heroTitle?: string;
  /** Supporting line under the hero title (e.g. branch · visit type). */
  heroMeta?: string;
};

export function BookFlowChrome({
  children,
  backHref,
  backLabel,
  footer = true,
  heroTitle,
  heroMeta,
}: BookFlowChromeProps) {
  const router = useRouter();
  const { lang, dir, setLang } = useLanguage();
  const ar = lang === "ar";
  const BackIcon = ar ? ChevronRight : ChevronLeft;
  const [menuOpen, setMenuOpen] = useState(false);
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];
  const barberHref = lang === "en" ? "/#english-barbers" : "/#barbers";
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const navItemClass =
    "flex min-h-[3.25rem] w-full items-center border-b border-cut-bronze py-3.5 text-start text-[1.05rem] font-semibold tracking-wide text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-warm-beige";

  return (
    <main dir={dir} lang={lang} className="min-h-[100svh] bg-cut-soft-ivory text-cut-black">
      <header className="sticky top-0 z-30 border-b border-cut-bronze/20 bg-cut-black text-cut-ivory">
        <div className="relative flex h-14 items-center justify-center px-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={label("openMenu")}
            aria-expanded={menuOpen}
            aria-controls="book-side-navigation"
            className={`absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${
              ar ? "right-3" : "left-3"
            }`}
          >
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </button>

          <Link
            href="/"
            className="group flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
            aria-label={ar ? "CUT Salon - الرئيسية" : "CUT Salon - Home"}
          >
            <span className="text-base font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
              —
            </span>
            <div className="mx-0.5 text-center">
              <span className="font-brand text-xl font-black leading-none tracking-[0.22em] text-cut-ivory">
                CUT
              </span>
              <div className="-mt-0.5 text-[8px] font-semibold tracking-[0.45em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
                SALON
              </div>
            </div>
            <span className="text-base font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
              —
            </span>
          </Link>

          <Link
            href="/booking"
            className={`absolute top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 text-xs font-semibold text-cut-ivory/75 transition hover:text-cut-warm-beige ${
              ar ? "left-4" : "right-4"
            }`}
          >
            {ar ? "مواعيدك" : "Appointments"}
            <ExternalLink className="h-3 w-3 opacity-80" strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="book-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-cut-black/70"
              onClick={closeMenu}
            />
            <motion.aside
              key="book-nav-drawer"
              id="book-side-navigation"
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className={`fixed inset-y-0 z-50 flex w-[min(22rem,86vw)] flex-col bg-[#1f1c1b] ${
                dir === "rtl" ? "right-0" : "left-0"
              }`}
              dir={dir}
              aria-label={ar ? "قائمة التنقل" : "Navigation menu"}
            >
              <div className="flex items-center px-5 pt-5 pb-2">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label={label("closeMenu")}
                  className="inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                >
                  <X className="h-6 w-6" strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 pb-6 pt-2">
                <nav aria-label={ar ? "روابط الموقع" : "Site links"}>
                  <Link href="/" onClick={closeMenu} className={navItemClass}>
                    {label("home")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      router.push("/book");
                    }}
                    className={navItemClass}
                  >
                    {label("booking")}
                  </button>
                  <Link href="/#services" onClick={closeMenu} className={navItemClass}>
                    {label("services")}
                  </Link>
                  <Link href="/prices" onClick={closeMenu} className={navItemClass}>
                    {label("prices")}
                  </Link>
                  <Link href={barberHref} onClick={closeMenu} className={navItemClass}>
                    {label("barbers")}
                  </Link>
                  <Link
                    href="/client/loyalty"
                    onClick={closeMenu}
                    className="flex min-h-[3.25rem] w-full items-center border-b border-cut-bronze py-3.5 text-start text-[1.05rem] font-bold tracking-wide text-cut-gold transition hover:text-cut-warm-beige"
                  >
                    {label("loyaltyCta")}
                  </Link>
                </nav>

                <div className="mt-10 space-y-4">
                  <Link
                    href="/client"
                    onClick={closeMenu}
                    className="block text-[1.05rem] font-medium text-cut-ivory transition hover:text-cut-warm-beige"
                  >
                    {label("account")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(lang === "ar" ? "en" : "ar");
                      closeMenu();
                    }}
                    className="block text-[1.05rem] font-medium text-cut-ivory transition hover:text-cut-warm-beige"
                  >
                    {label("language")}
                  </button>
                </div>

                <div className="mt-auto flex flex-col pt-12">
                  <div className="border-t border-cut-bronze" />
                  <div className="flex items-center justify-center gap-8 py-7">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label("whatsapp")}
                      className="text-cut-ivory transition hover:text-cut-gold"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <a
                      href="tel:01012126899"
                      aria-label={ar ? "اتصل بنا" : "Call us"}
                      className="text-cut-ivory transition hover:text-cut-gold"
                    >
                      <Phone className="h-5 w-5" strokeWidth={1.75} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section
        className={`relative overflow-hidden bg-cut-black ${
          heroTitle
            ? "h-[28svh] min-h-[180px] max-h-[240px] sm:h-[220px]"
            : "h-[22svh] min-h-[140px] max-h-[200px] sm:h-[180px]"
        }`}
      >
        <img
          src="/hero_vertical.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_22%] opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.35)_0%,rgba(23,4,6,0.35)_40%,rgba(5,5,5,0.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(74,0,15,0.45),transparent_55%)]" />
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel ?? (ar ? "رجوع" : "Back")}
            className={`absolute top-3 z-10 inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${
              ar ? "right-3" : "left-3"
            }`}
          >
            <BackIcon className="h-6 w-6" strokeWidth={1.75} />
          </Link>
        ) : null}

        {heroTitle ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-5 sm:px-8">
            <div className="mx-auto max-w-lg text-center">
              <h1 className="font-display text-[clamp(1.75rem,5.2vw,2.5rem)] leading-tight text-cut-ivory">
                {heroTitle}
              </h1>
              {heroMeta ? (
                <p className="mt-3 text-[13px] font-medium leading-6 tracking-wide text-cut-soft-ivory/80 sm:text-sm">
                  {heroMeta}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {children}

      {footer ? (
        <footer className="border-t border-cut-black/10 px-5 py-8 text-center sm:px-8">
          <p className="text-[11px] tracking-[0.2em] text-cut-black/40">CUT SALON · ALEXANDRIA</p>
          <Link
            href="/"
            className="mt-3 inline-block text-xs font-semibold text-cut-burgundy hover:text-cut-black"
          >
            {ar ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </footer>
      ) : null}
    </main>
  );
}
