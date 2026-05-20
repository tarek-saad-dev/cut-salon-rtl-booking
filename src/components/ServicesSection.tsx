"use client";

import { useState, useEffect, useMemo } from "react";
import { Scissors, Droplets, Sparkles } from "lucide-react";
import { getBookingServices, type BookingService } from "@/lib/publicBookingApi";

/* ─── 3 allowed categories → tab mapping ────────────────────────────────────── */
const TABS = [
  { key: "حلاقة", label: "حلاقة", icon: Scissors },
  { key: "خدمات الشعر", label: "خدمات الشعر", icon: Sparkles },
  { key: "تنظيف", label: "العناية بالبشرة", icon: Droplets },
] as const;

function getTabKey(categoryName: string | null): string | null {
  if (!categoryName) return null;
  const cat = categoryName.trim().toLowerCase();
  if (cat === "حلاقة") return "حلاقة";
  if (cat === "skincare") return "تنظيف";
  if (
    cat.includes("خدمات") &&
    (cat.includes("اضاف") || cat.includes("إضاف") || cat.includes("اضافية") || cat.includes("إضافية")) &&
    cat.includes("شعر")
  ) {
    return "خدمات الشعر";
  }
  return null;
}

/* ─── Skeleton rows ─────────────────────────────────────────────────────────── */
const SkeletonPanel = () => (
  <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#0e0e0e] overflow-hidden animate-pulse">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
      <div className="w-10 h-10 rounded-xl bg-[#1a1a1a]" />
      <div className="space-y-2">
        <div className="h-4 bg-[#1a1a1a] rounded w-28" />
        <div className="h-3 bg-[#1a1a1a] rounded w-16" />
      </div>
    </div>
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] last:border-0">
        <div className="h-4 bg-[#1a1a1a] rounded w-1/3" />
        <div className="h-4 bg-[#1a1a1a] rounded w-20" />
      </div>
    ))}
  </div>
);

/* ════════════════════════════════════════════
   SERVICES SECTION
   ════════════════════════════════════════════ */
const ServicesSection = () => {
  const [allServices, setAllServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);

  useEffect(() => {
    getBookingServices()
      .then(res => setAllServices(res.services))
      .catch(() => { /* keep empty */ })
      .finally(() => setIsLoading(false));
  }, []);

  /* Filter: allowed categories, price > 0, bookable */
  const grouped = useMemo(() => {
    const map: Record<string, BookingService[]> = {};
    TABS.forEach(t => (map[t.key] = []));
    allServices.forEach(s => {
      if (!s.isBookableOnline) return;
      if (s.price <= 0) return;
      const key = getTabKey(s.categoryName);
      if (key && map[key]) map[key].push(s);
    });
    return map;
  }, [allServices]);

  const activeTabMeta = TABS.find(t => t.key === activeTab)!;
  const Icon = activeTabMeta.icon;
  const tabServices = grouped[activeTab] ?? [];

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
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            const TabIcon = tab.icon;
            const count = grouped[tab.key]?.length ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-heading font-bold text-xs md:text-sm transition-all duration-300 cursor-pointer
                  ${isActive
                    ? "bg-gradient-to-l from-[#C8A96A] to-[#E5C07B] text-[#050505] shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
                    : "bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-[#D4AF37]/30"
                  }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
                {!isLoading && count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-black/15" : "bg-white/[0.06]"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active category panel */}
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <SkeletonPanel />
          ) : tabServices.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e0e] p-10 text-center">
              <p className="text-zinc-500 text-sm">لا توجد خدمات في هذا القسم حالياً</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#0e0e0e] overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">{activeTabMeta.label}</h3>
                  <p className="text-zinc-500 text-xs">{tabServices.length} خدمة</p>
                </div>
              </div>

              {/* Service list */}
              <ul>
                {tabServices.map((s, i) => (
                  <li key={s.id}
                    className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]
                      ${i < tabServices.length - 1 ? "border-b border-white/[0.04]" : ""}`}
                  >
                    <span className="text-zinc-300 text-sm md:text-base">{s.name}</span>
                    <span className="text-[#D4AF37] font-heading font-bold text-sm md:text-base whitespace-nowrap mr-4">
                      {s.price} جنيه
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
