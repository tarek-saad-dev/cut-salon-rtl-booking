"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type BookFlowChromeProps = {
  children: React.ReactNode;
  /** Show back control over the hero (e.g. visit-type → locations). */
  backHref?: string;
  backLabel?: string;
  footer?: boolean;
};

export function BookFlowChrome({ children, backHref, backLabel, footer = true }: BookFlowChromeProps) {
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
  const BackIcon = ar ? ChevronRight : ChevronLeft;

  return (
    <main dir={dir} lang={lang} className="min-h-[100svh] bg-cut-soft-ivory text-cut-black">
      <header className="sticky top-0 z-30 border-b border-cut-bronze/20 bg-cut-black text-cut-ivory">
        <div className="relative flex h-14 items-center justify-center px-4">
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

      <section className="relative h-[34svh] min-h-[220px] max-h-[320px] overflow-hidden bg-cut-black sm:h-[280px]">
        <img
          src="/hero_vertical.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[center_22%] opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.4)_0%,rgba(23,4,6,0.45)_50%,rgba(5,5,5,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(74,0,15,0.5),transparent_55%)]" />
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel ?? (ar ? "رجوع" : "Back")}
            className={`absolute top-4 z-10 inline-flex h-10 w-10 items-center justify-center text-cut-ivory transition hover:text-cut-warm-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige ${
              ar ? "right-3" : "left-3"
            }`}
          >
            <BackIcon className="h-6 w-6" strokeWidth={1.75} />
          </Link>
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
