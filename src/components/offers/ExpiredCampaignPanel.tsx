"use client";

import Link from "next/link";
import { OfferMobileHeader } from "@/components/offers/OfferMobileHeader";
import { novemberProteinOffer } from "@/config/novemberProteinOffer";

type ExpiredCampaignPanelProps = {
  formerTitle: string;
  formerBlurb: string;
};

/** Shared expired state for retired monthly offer URLs — keeps history without selling the old deal. */
export function ExpiredCampaignPanel({ formerTitle, formerBlurb }: ExpiredCampaignPanelProps) {
  return (
    <main dir="rtl" lang="ar" className="min-h-svh overflow-x-clip bg-cut-black font-ui text-cut-ivory antialiased">
      <OfferMobileHeader />
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-10">
        <p className="text-xs font-bold tracking-[0.22em] text-cut-bronze">انتهى العرض</p>
        <h1 className="mt-4 font-laxr text-[clamp(2rem,10vw,2.75rem)] leading-none text-cut-ivory">{formerTitle}</h1>
        <p className="mt-4 text-[15px] leading-7 text-cut-ivory/70">{formerBlurb}</p>
        <p className="mt-6 text-[15px] leading-7 text-cut-ivory/80">
          العرض الحالي من CUT: {novemberProteinOffer.campaignName} —{" "}
          <span dir="ltr">{novemberProteinOffer.price}</span> {novemberProteinOffer.currencyAr}.
        </p>
        <Link
          href={novemberProteinOffer.href}
          className="mt-8 flex h-14 w-full touch-manipulation items-center justify-center rounded-[18px] bg-cut-gold text-[clamp(1.15rem,5vw,1.3rem)] font-bold text-cut-black shadow-[0_8px_24px_rgba(212,175,55,0.22)] transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-gold"
        >
          شوف عرض نوفمبر
        </Link>
        <Link
          href="/"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-[18px] border border-cut-bronze/30 text-sm font-bold text-cut-ivory/85 transition hover:border-cut-gold/40"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
