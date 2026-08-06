"use client";

import { useLanguage } from "@/context/LanguageContext";
import HeroSection from "@/components/HeroSection";
import ArabicServicesSection from "@/components/ArabicServicesSection";
import BarbersSection from "@/components/BarbersSection";
import BookingCTA from "@/components/BookingCTA";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FooterSection from "@/components/FooterSection";
import EnglishHome from "@/components/english-home/EnglishHome";

function ArabicHome() {
  return (
    <main className="min-h-screen bg-cut-black">
      <HeroSection />
      <ArabicServicesSection />
      <BarbersSection />
      <BookingCTA />
      <BenefitsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}

export default function HomePageClient() {
  const { lang } = useLanguage();
  return lang === "en" ? <EnglishHome /> : <ArabicHome />;
}
