"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import ClientProfileWidget from "./ClientProfileWidget";
import { useLanguage } from "@/context/LanguageContext";
import { navigationLabels } from "@/lib/i18n/navigation";

const DESKTOP_NAV_LINKS: {
  label: keyof typeof navigationLabels;
  href: string;
  isClub?: boolean;
}[] = [
  { label: "home", href: "/" },
  { label: "services", href: "/#services" },
  { label: "prices", href: "/prices" },
  { label: "barbers", href: "/#barbers" },
  { label: "branches", href: "/#branches" },
  { label: "account", href: "/client" },
  { label: "loyalty", href: "/client/loyalty", isClub: true },
];

function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const nextLanguage = lang === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => setLang(nextLanguage)}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-cut-bronze/40 bg-cut-black/70 px-3 text-xs font-black tracking-[0.14em] text-cut-warm-beige transition hover:border-cut-warm-beige hover:text-cut-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${className}`}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {lang === "ar" ? "EN" : "AR"}
    </button>
  );
}

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const label = (key: keyof typeof navigationLabels) => navigationLabels[key][lang];
  const barberHref = "/#barbers";
  const goToBook = () => router.push("/book");

  // Dedicated booking entry has its own header chrome on desktop.
  if (pathname?.startsWith("/book")) return null;

  const LogoMark = () => (
    <a
      href="/"
      className="group flex items-center gap-1.5 select-none"
      aria-label={lang === "ar" ? "CUT Salon - الرئيسية" : "CUT Salon - Home"}
    >
      <span className="text-lg font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
        —
      </span>
      <div className="mx-1 text-center">
        <span className="font-brand text-2xl font-black leading-none tracking-[0.25em] text-cut-ivory">
          CUT
        </span>
        <div className="-mt-0.5 text-[9px] font-semibold tracking-[0.5em] text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
          SALON
        </div>
      </div>
      <span className="text-lg font-black tracking-widest text-cut-bronze transition-colors group-hover:text-cut-warm-beige">
        —
      </span>
    </a>
  );

  return (
    <>
      {/* Desktop navigation only — mobile uses GlobalMobileNav */}
      <div
        className="hidden w-full shrink-0 lg:block"
        style={{ height: "var(--cut-campaign-bar-height, 0px)" }}
        aria-hidden
      />
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="cut-nav-glass sticky top-[var(--cut-campaign-bar-height,0px)] z-50 hidden w-full transition-[top] duration-200 lg:block"
        dir={dir}
      >
        <div className="mx-auto grid h-[76px] max-w-[1760px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-[clamp(20px,4vw,72px)]">
          <LogoMark />

          <nav
            className="min-w-0 justify-self-center"
            aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}
          >
            <ul className="flex items-center justify-center gap-x-3 xl:gap-x-5" role="menubar">
              {DESKTOP_NAV_LINKS.map((link) => (
                <li key={link.label} role="none" className="shrink-0">
                  <a
                    href={link.label === "barbers" ? barberHref : link.href}
                    role="menuitem"
                    className={
                      link.isClub
                        ? "inline-flex h-10 items-center rounded-lg border border-cut-bronze/35 px-3 text-xs font-black tracking-wider text-cut-warm-beige transition hover:border-cut-bronze/60 hover:bg-cut-burgundy/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                        : "relative inline-flex h-10 items-center px-1 text-sm font-semibold text-cut-ivory/80 transition hover:text-cut-warm-beige after:absolute after:inset-x-1 after:bottom-1 after:h-px after:scale-x-0 after:bg-cut-bronze after:transition-transform hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige"
                    }
                  >
                    {label(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            className="flex items-center justify-self-end gap-2"
            aria-label={lang === "ar" ? "إجراءات الحساب والحجز" : "Booking and account actions"}
          >
            <LanguageToggle />
            <button
              onClick={goToBook}
              aria-label={label("booking")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-cut-ivory px-4 text-sm font-bold text-cut-black transition hover:bg-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige xl:px-5"
            >
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">{label("booking")}</span>
            </button>
            <ClientProfileWidget />
          </div>
        </div>
      </motion.header>
    </>
  );
}
