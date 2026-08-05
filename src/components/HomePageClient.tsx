"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BookingControllerProvider } from "@/context/BookingController";
import HeroSection from "@/components/HeroSection";
import NearestAvailability from "@/components/NearestAvailability";
import BarbersSection from "@/components/BarbersSection";
import HomePricesLink from "@/components/HomePricesLink";
import BookingCTA from "@/components/BookingCTA";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FooterSection from "@/components/FooterSection";
import EnglishHome from "@/components/english-home/EnglishHome";

function ArabicHome() {
  return (
    <main className="min-h-screen bg-cut-black">
      <HeroSection />
      <NearestAvailability />
      <BarbersSection />
      <HomePricesLink />
      <BookingCTA />
      <BenefitsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}

export default function HomePageClient() {
  const { lang } = useLanguage();
  return (
    <BookingControllerProvider>
      {lang === "en" ? <EnglishHome /> : <ArabicHome />}
    </BookingControllerProvider>
  );
}
