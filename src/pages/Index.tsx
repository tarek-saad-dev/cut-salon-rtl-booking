import HeroSection from "@/components/HeroSection";
import BarbersSection from "@/components/BarbersSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <BarbersSection />
      <BenefitsSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
};

export default Index;
