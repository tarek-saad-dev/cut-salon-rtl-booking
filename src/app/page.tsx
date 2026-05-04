import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import BarbersSection from "@/components/BarbersSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FooterSection from "@/components/FooterSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <BarbersSection />
      <ServicesSection />
      <BenefitsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
