"use client";

import HeroSection from "@/components/HeroSection";
import ArabicServicesSection from "@/components/ArabicServicesSection";
import BarbersSection from "@/components/BarbersSection";
import BookingCTA from "@/components/BookingCTA";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FooterSection from "@/components/FooterSection";

/**
 * Single home composition for all languages.
 * Arabic is the source layout; English is localization (strings + dir), not a separate page.
 */
export default function HomePageClient() {
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
