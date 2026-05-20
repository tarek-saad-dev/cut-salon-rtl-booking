"use client";

import { useState } from "react";
import { Scissors, Droplets, Sparkles, Crown } from "lucide-react";

const categories = [
  {
    key: "hair",
    label: "خدمات الشعر",
    icon: Scissors,
    services: [
      { name: "قص شعر", price: "150 جنيه" },
      { name: "تحديد لحية", price: "100 جنيه" },
      { name: "قص شعر + لحية", price: "200 جنيه" },
      { name: "سيشوار", price: "80 جنيه" },
      { name: "تصميم على الشعر", price: "50 جنيه" },
    ],
  },
  {
    key: "skin",
    label: "العناية بالبشرة",
    icon: Droplets,
    services: [
      { name: "تنظيف بشرة عادي", price: "200 جنيه" },
      { name: "تنظيف بشرة عميق", price: "300 جنيه" },
      { name: "تنظيف الأنف", price: "50 جنيه" },
      { name: "ماسك للبشرة", price: "30 جنيه" },
    ],
  },
  {
    key: "extra",
    label: "خدمات إضافية",
    icon: Sparkles,
    services: [
      { name: "إزالة شعر بالشمع", price: "100 جنيه" },
      { name: "سبراي تكثيف الشعر", price: "50 جنيه" },
      { name: "صبغة شعر عادية", price: "50 جنيه" },
      { name: "صبغة شعر + لحية", price: "200 جنيه" },
    ],
  },
  {
    key: "special",
    label: "خدمات خاصة",
    icon: Crown,
    services: [
      { name: "بروتين للشعر القصير", price: "500 جنيه" },
      { name: "بروتين للشعر الطويل", price: "700 جنيه" },
      { name: "فرد الشعر", price: "200 جنيه" },
      { name: "تلوين الشعر", price: "100 جنيه" },
      { name: "هايلايت فضي", price: "700 جنيه" },
    ],
  },
];

const ServicesSection = () => {
  const [activeTab, setActiveTab] = useState("hair");
  const activeCat = categories.find(c => c.key === activeTab)!;
  const Icon = activeCat.icon;

  return (
    <section id="services" className="relative py-20 md:py-28 bg-[#0a0a0a] overflow-hidden">
      {/* Top line separator */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/15 to-transparent" />
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.04),transparent_60%)] pointer-events-none" />

      <div className="container px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[#D4AF37] font-heading font-bold text-sm tracking-widest mb-3">خدماتنا</p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
            أسعار <span className="text-gold-gradient">Cut Salon</span>
          </h2>
          <p className="text-zinc-500 text-sm md:text-base max-w-lg mx-auto">
            اكتشف مجموعة متكاملة من الخدمات المتميزة بأفضل الأسعار
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10 max-w-2xl mx-auto">
          {categories.map((cat) => {
            const isActive = cat.key === activeTab;
            const TabIcon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-heading font-bold text-xs md:text-sm transition-all duration-300 cursor-pointer
                  ${isActive
                    ? "bg-gradient-to-l from-[#C8A96A] to-[#E5C07B] text-[#050505] shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
                    : "bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-[#D4AF37]/30"
                  }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Active category panel */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#0e0e0e] overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">{activeCat.label}</h3>
                <p className="text-zinc-500 text-xs">{activeCat.services.length} خدمة</p>
              </div>
            </div>

            {/* Service list */}
            <ul>
              {activeCat.services.map((s, i) => (
                <li key={i}
                  className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]
                    ${i < activeCat.services.length - 1 ? "border-b border-white/[0.04]" : ""}`}
                >
                  <span className="text-zinc-300 text-sm md:text-base">{s.name}</span>
                  <span className="text-[#D4AF37] font-heading font-bold text-sm md:text-base whitespace-nowrap mr-4">{s.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a href="#barbers"
            className="group relative inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl font-heading font-bold text-[#050505] text-base overflow-hidden bg-gradient-to-l from-[#C8A96A] to-[#E5C07B] shadow-[0_8px_32px_rgba(212,175,55,0.25)] hover:shadow-[0_12px_48px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
            <span className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <span className="relative z-10">احجز موعدك الآن</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
