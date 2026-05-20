import HeroSection from "@/components/HeroSection";
import NearestAvailability from "@/components/NearestAvailability";
import BarbersSection from "@/components/BarbersSection";
import ServicesSection from "@/components/ServicesSection";
import BookingCTA from "@/components/BookingCTA";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FooterSection from "@/components/FooterSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <HeroSection />
      <NearestAvailability />
      <BarbersSection />
      <ServicesSection />
      <BookingCTA />
      <BenefitsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
