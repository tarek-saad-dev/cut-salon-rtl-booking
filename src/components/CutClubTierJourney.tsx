import { useState, useEffect } from "react";
import { Star, Crown, Gem, Award, Check, Sparkles, Gift, Shield, ChevronLeft } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  minPoints: number;
  icon: string;
  description: string;
  benefits: string[];
}

interface CutClubTierJourneyProps {
  currentPoints?: number;
  tiers?: Tier[];
}

const defaultTiers: Tier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    icon: "bronze",
    description: "عضوية البداية المناسبة للانطلاق في رحلتك مع CUT CLUB",
    benefits: [
      "تجميع النقاط على كل زيارة",
      "عروض شهرية خاصة",
      "إشعارات بالمكافآت الجديدة",
      "دعم العملاء المميز"
    ]
  },
  {
    id: "silver",
    name: "Silver",
    minPoints: 300,
    icon: "silver",
    description: "مستوى متوازن مع مزايا أفضل وتجربة أرقى",
    benefits: [
      "نقاط أسرع بنسبة 10%",
      "عروض خاصة لأعضاء Silver",
      "أولوية في الحجوزات",
      "مكافآت إضافية موسمية"
    ]
  },
  {
    id: "gold",
    name: "Gold",
    minPoints: 600,
    icon: "gold",
    description: "عضوية مميزة مع مزايا أقوى وتجربة عضوية أكثر تميزًا",
    benefits: [
      "أولوية أعلى في المكافآت",
      "عروض خاصة لأعضاء Gold",
      "مكافآت أقوى عند الوصول للمعالم",
      "تجربة عضوية VIP متكاملة"
    ]
  },
  {
    id: "black-vip",
    name: "Black VIP",
    minPoints: 1000,
    icon: "black",
    description: "أعلى مستوى VIP بتجربة استثنائية وخدمات نخبة",
    benefits: [
      "ضعف النقاط على كل زيارة",
      "خدمات حصرية غير متاحة للآخرين",
      "مدير حساب شخصي",
      "دعوات لفعاليات خاصة",
      "مفاجآت شهرية فاخرة"
    ]
  },
];

const CutClubTierJourney = ({
  currentPoints = 725,
  tiers = defaultTiers,
}: CutClubTierJourneyProps) => {
  // State for selected tier
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Determine current tier
  const getCurrentTierIndex = () => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentPoints >= tiers[i].minPoints) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTierIndex();
  const currentTier = tiers[currentTierIndex];
  const isMaxTier = currentTierIndex === tiers.length - 1;
  const nextTier = isMaxTier ? null : tiers[currentTierIndex + 1];

  // Set default selected tier to current tier on mount
  useEffect(() => {
    setSelectedTierIndex(currentTierIndex);
    setIsPanelVisible(true);
  }, [currentTierIndex]);

  // Handle tier click
  const handleTierClick = (index: number) => {
    setSelectedTierIndex(index);
    setIsPanelVisible(true);
  };

  // Get tier status
  const getTierStatus = (index: number) => {
    if (index < currentTierIndex) return "reached";
    if (index === currentTierIndex) return "current";
    return "upcoming";
  };

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    if (isMaxTier) return 100;
    const currentTierMin = currentTier.minPoints;
    const nextTierMin = nextTier!.minPoints;
    const progress = ((currentPoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const progressToNext = getProgressToNextTier();

  // Calculate remaining points to next tier
  const remainingToNext = nextTier ? Math.max(nextTier.minPoints - currentPoints, 0) : 0;

  // Get selected tier
  const selectedTier = selectedTierIndex !== null ? tiers[selectedTierIndex] : null;
  const selectedTierStatus = selectedTierIndex !== null ? getTierStatus(selectedTierIndex) : null;

  // Tier color styles
  const getTierStyles = (tierId: string, index: number) => {
    const isCompleted = index < currentTierIndex;
    const isCurrent = index === currentTierIndex;
    const isUpcoming = index > currentTierIndex;
    const isSelected = index === selectedTierIndex;

    const baseStyles: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
      bronze: {
        bg: "bg-gradient-to-br from-[#A86A3D] to-[#7A4A28]",
        border: "border-[#A86A3D]",
        icon: "text-[#E8D4C4]",
        glow: "shadow-[0_0_20px_rgba(168,106,61,0.4)]",
      },
      silver: {
        bg: "bg-gradient-to-br from-[#A9ADB5] to-[#7A7D82]",
        border: "border-[#A9ADB5]",
        icon: "text-[#F0F2F5]",
        glow: "shadow-[0_0_20px_rgba(169,173,181,0.4)]",
      },
      gold: {
        bg: "bg-gradient-to-br from-[#C99A45] to-[#8A6326]",
        border: "border-[#C99A45]",
        icon: "text-[#FFF8E7]",
        glow: "shadow-[0_0_30px_rgba(201,154,69,0.5)]",
      },
      black: {
        bg: "bg-gradient-to-br from-[#5C6068] to-[#3A3D42]",
        border: "border-[#5C6068]",
        icon: "text-[#E8EAEC]",
        glow: "shadow-[0_0_25px_rgba(92,96,104,0.4)]",
      },
    };

    const tierStyle = baseStyles[tierId] || baseStyles.bronze;

    if (isCompleted) {
      return {
        ...tierStyle,
        opacity: isSelected ? "opacity-100" : "opacity-90",
        scale: isSelected ? "scale-105" : "scale-100",
        glow: isSelected ? "shadow-[0_0_30px_rgba(201,154,69,0.4)]" : "",
      };
    }
    if (isCurrent) {
      return {
        ...tierStyle,
        opacity: "opacity-100",
        scale: isSelected ? "scale-115" : "scale-110",
        glow: "shadow-[0_0_50px_rgba(201,154,69,0.7)]",
      };
    }
    return {
      ...tierStyle,
      bg: "bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A]",
      icon: "text-[#666666]",
      opacity: isSelected ? "opacity-80" : "opacity-50",
      scale: isSelected ? "scale-100" : "scale-95",
      glow: isSelected ? "shadow-[0_0_20px_rgba(201,154,69,0.2)]" : "",
    };
  };

  const getTierIcon = (tierId: string, index: number) => {
    const isCurrent = index === currentTierIndex;
    const isUpcoming = index > currentTierIndex;

    const iconClass = isUpcoming ? "text-[#555]" : "text-current";
    const size = isCurrent ? "w-6 h-6" : "w-5 h-5";

    switch (tierId) {
      case "bronze":
        return <Star className={`${size} ${iconClass}`} strokeWidth={1.5} />;
      case "silver":
        return <Award className={`${size} ${iconClass}`} strokeWidth={1.5} />;
      case "gold":
        return <Crown className={`${size} ${iconClass}`} strokeWidth={1.5} />;
      case "black":
        return <Gem className={`${size} ${iconClass}`} strokeWidth={1.5} />;
      default:
        return <Star className={`${size} ${iconClass}`} strokeWidth={1.5} />;
    }
  };

  return (
    <section className="w-full bg-[#050505] py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[#C99A45] text-sm font-semibold tracking-widest mb-2">
            رحلتك في العضوية
          </p>
          <h2 className="text-[#F5F0E8] text-2xl md:text-3xl font-bold mb-2">
            مسار عضويتك الحالية
          </h2>
          <p className="text-[#B9B0A2] text-sm">
            تابع تقدمك بين مستويات CUT CLUB
          </p>
        </div>

        {/* Journey Card */}
        <div
          className="relative w-full rounded-3xl overflow-hidden group
                     transition-all duration-500 ease-out"
          style={{
            background: `linear-gradient(145deg, #0B0B0B 0%, #050505 100%)`,
          }}
        >
          {/* Border */}
          <div className="absolute inset-0 rounded-3xl p-[1px]
                          bg-gradient-to-r from-[#8A6326]/30 via-[#C99A45]/50 to-[#8A6326]/30">
            <div className="w-full h-full rounded-3xl bg-[#080808]" />
          </div>

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          w-[70%] h-[60%] bg-[#C99A45]/3 blur-[100px] rounded-full pointer-events-none" />

          {/* Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] 
                          bg-gradient-to-r from-transparent via-[#C99A45]/20 to-transparent" />

          {/* Content */}
          <div className="relative p-8 md:p-12">
            {/* Current Status Summary */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                              bg-gradient-to-r from-[#C99A45]/20 to-[#E2B866]/10
                              border border-[#C99A45]/30 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#C99A45] animate-pulse" />
                <span className="text-[#E2B866] text-sm font-semibold">
                  المستوى الحالي: {currentTier.name}
                </span>
              </div>

              {!isMaxTier && (
                <p className="text-[#B9B0A2] text-sm">
                  أمامك <span className="text-[#C99A45] font-bold">{remainingToNext}</span> نقطة للوصول إلى {nextTier?.name}
                </p>
              )}
              {isMaxTier && (
                <p className="text-[#E2B866] text-sm">
                  🎉 أنت في أعلى مستوى عضوية - نادي النخبة
                </p>
              )}
            </div>

            {/* Desktop Journey Path */}
            <div className="hidden md:block relative">
              {/* Base Path Line */}
              <div className="absolute top-12 left-[12%] right-[12%] h-[3px] bg-[#1B1B1B] rounded-full" />

              {/* Completed Path with Gold Glow */}
              <div
                className="absolute top-12 left-[12%] h-[3px] rounded-full"
                style={{
                  width: `${(currentTierIndex / (tiers.length - 1)) * 76}%`,
                  background: `linear-gradient(90deg, #8A6326 0%, #C99A45 50%, #E2B866 100%)`,
                  boxShadow: "0 0 20px rgba(201, 154, 69, 0.5), 0 0 40px rgba(201, 154, 69, 0.3)",
                }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                  animate-[shimmer_2s_infinite]"
                    style={{ transform: "translateX(-100%)" }} />
                </div>
              </div>

              {/* Progress in Current Segment */}
              {!isMaxTier && (
                <div
                  className="absolute top-12 h-[3px] rounded-full transition-all duration-700"
                  style={{
                    left: `${12 + (currentTierIndex / (tiers.length - 1)) * 76}%`,
                    width: `${(progressToNext / 100) * (76 / (tiers.length - 1))}%`,
                    background: `linear-gradient(90deg, #E2B866 0%, #C99A45 100%)`,
                  }}
                />
              )}

              {/* Stations */}
              <div className="relative flex justify-between px-[12%]">
                {tiers.map((tier, index) => {
                  const styles = getTierStyles(tier.icon, index);
                  const isCurrent = index === currentTierIndex;
                  const isCompleted = index < currentTierIndex;
                  const isSelected = index === selectedTierIndex;
                  const status = getTierStatus(index);

                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleTierClick(index)}
                      className="flex flex-col items-center group cursor-pointer focus:outline-none"
                      aria-selected={isSelected}
                      aria-label={`${tier.name} tier, ${tier.minPoints} points minimum`}
                    >
                      {/* Station Node */}
                      <div
                        className={`relative w-24 h-24 rounded-2xl 
                                    flex items-center justify-center
                                    transition-all duration-500 ease-out
                                    ${styles.bg} ${styles.border} ${styles.opacity} ${styles.scale}
                                    ${isCurrent ? "ring-2 ring-[#E2B866] ring-offset-2 ring-offset-[#080808]" : ""}
                                    ${isCurrent ? "animate-pulse" : ""}
                                    ${isSelected ? "ring-4 ring-[#C99A45]/50 ring-offset-2 ring-offset-[#080808]" : ""}
                                    group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(201,154,69,0.3)]`}
                        style={{
                          boxShadow: isCurrent
                            ? "0 0 40px rgba(201, 154, 69, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : isCompleted
                              ? "0 0 20px rgba(201, 154, 69, 0.2)"
                              : "inset 0 1px 0 rgba(255,255,255,0.05)",
                          border: `2px solid ${isCurrent ? "#E2B866" : isSelected ? "#C99A45" : isCompleted ? "#C99A45" : "#333"}`,
                        }}
                      >
                        {/* Icon */}
                        <div className={`${styles.icon}`}>
                          {getTierIcon(tier.icon, index)}
                        </div>

                        {/* Status Badge */}
                        {isCurrent && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full 
                                          bg-[#C99A45] flex items-center justify-center
                                          text-[#050505] text-xs font-bold">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* Tier Info */}
                      <div className="mt-4 text-center">
                        <p className={`font-semibold text-sm mb-1 transition-colors duration-300
                                       ${isCurrent ? "text-[#E2B866]" : isCompleted ? "text-[#C99A45]" : "text-[#666]"}
                                       group-hover:text-[#C99A45]`}>
                          {tier.name}
                        </p>
                        <p className="text-[#666] text-xs group-hover:text-[#888] transition-colors">
                          {tier.minPoints}+
                        </p>

                        {/* Status Label */}
                        <p className={`text-[10px] mt-1 px-2 py-0.5 rounded-full transition-all
                                       ${status === "current" ? "bg-[#C99A45]/20 text-[#E2B866]" : ""}
                                       ${status === "reached" ? "bg-[#8A6326]/20 text-[#C99A45]" : ""}
                                       ${status === "upcoming" ? "text-[#555]" : ""}`}>
                          {status === "current" && "مستواك الحالي"}
                          {status === "reached" && "تم الوصول"}
                          {status === "upcoming" && "قادم"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Current Position Marker */}
              {!isMaxTier && (
                <div
                  className="absolute top-12 -mt-3 transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${12 + (currentTierIndex / (tiers.length - 1)) * 76}% + ${(progressToNext / 100) * (76 / (tiers.length - 1))}% - 16px)`,
                  }}
                >
                  {/* Marker */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full 
                                    bg-gradient-to-br from-[#E2B866] to-[#C99A45]
                                    border-2 border-[#050505]
                                    flex items-center justify-center
                                    shadow-[0_0_20px_rgba(201,154,69,0.8)]
                                    animate-bounce">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>

                    {/* "You Are Here" Label */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 
                                    whitespace-nowrap px-3 py-1 rounded-full
                                    bg-[#C99A45] text-[#050505] text-xs font-bold">
                      أنت هنا
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 
                                      w-2 h-2 bg-[#C99A45] rotate-45" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Journey Path */}
            <div className="md:hidden">
              {/* Vertical Path */}
              <div className="relative flex flex-col items-center">
                {tiers.map((tier, index) => {
                  const styles = getTierStyles(tier.icon, index);
                  const isCurrent = index === currentTierIndex;
                  const isCompleted = index < currentTierIndex;
                  const isLast = index === tiers.length - 1;
                  const isSelected = index === selectedTierIndex;
                  const status = getTierStatus(index);

                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleTierClick(index)}
                      className="relative flex items-center w-full cursor-pointer focus:outline-none"
                    >
                      {/* Connection Line */}
                      {!isLast && (
                        <div className="absolute left-8 top-16 w-[2px] h-16 bg-[#1B1B1B] -z-10" />
                      )}

                      {/* Completed Line */}
                      {!isLast && isCompleted && (
                        <div className="absolute left-8 top-16 w-[2px] h-16 
                                        bg-gradient-to-b from-[#C99A45] to-[#E2B866] -z-10" />
                      )}

                      {/* Current Progress Line */}
                      {!isLast && isCurrent && (
                        <div
                          className="absolute left-8 top-16 w-[2px] -z-10 rounded-full"
                          style={{
                            height: `${(progressToNext / 100) * 64}px`,
                            background: `linear-gradient(180deg, #E2B866 0%, #C99A45 100%)`,
                          }}
                        />
                      )}

                      {/* Station */}
                      <div className="flex items-center gap-4 mb-8 w-full">
                        {/* Node */}
                        <div
                          className={`relative w-16 h-16 rounded-xl 
                                      flex items-center justify-center flex-shrink-0
                                      transition-all duration-500
                                      ${styles.bg} ${styles.opacity} ${styles.scale}
                                      ${isCurrent ? "ring-2 ring-[#E2B866]" : ""}
                                      ${isSelected ? "ring-2 ring-[#C99A45]" : ""}`}
                          style={{
                            border: `2px solid ${isCurrent ? "#E2B866" : isSelected ? "#C99A45" : isCompleted ? "#C99A45" : "#333"}`,
                            boxShadow: isCurrent
                              ? "0 0 30px rgba(201, 154, 69, 0.5)"
                              : isSelected
                                ? "0 0 20px rgba(201, 154, 69, 0.3)"
                                : isCompleted
                                  ? "0 0 15px rgba(201, 154, 69, 0.2)"
                                  : "none",
                          }}
                        >
                          <div className={styles.icon}>
                            {getTierIcon(tier.icon, index)}
                          </div>

                          {/* Status Marker */}
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full 
                                            bg-[#C99A45] flex items-center justify-center
                                            text-[#050505] text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-right">
                          <p className={`font-bold text-base 
                                         ${isCurrent ? "text-[#E2B866]" : isCompleted ? "text-[#C99A45]" : "text-[#666]"}`}>
                            {tier.name}
                          </p>
                          <p className="text-[#555] text-xs mt-1">
                            {tier.minPoints}+ نقطة
                          </p>
                          {/* Status Label */}
                          <p className={`text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full
                                         ${status === "current" ? "bg-[#C99A45]/20 text-[#E2B866]" : ""}
                                         ${status === "reached" ? "bg-[#8A6326]/20 text-[#C99A45]" : ""}
                                         ${status === "upcoming" ? "text-[#666] bg-[#222]" : ""}`}>
                            {status === "current" && "مستواك الحالي"}
                            {status === "reached" && "تم الوصول"}
                            {status === "upcoming" && "قادم"}
                          </p>
                          {isCurrent && (
                            <p className="text-[#C99A45] text-xs mt-2">
                              {progressToNext.toFixed(0)}% • باقي {remainingToNext} نقطة
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-[#1B1B1B]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#C99A45]" />
                <span className="text-[#888] text-xs">تم التحقيق</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E2B866] animate-pulse" />
                <span className="text-[#888] text-xs">الموقع الحالي</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#333]" />
                <span className="text-[#888] text-xs">باقي</span>
              </div>
            </div>

            {/* Tier Benefits Panel */}
            {isPanelVisible && selectedTier && (
              <div
                className="mt-8 md:mt-10 transition-all duration-500 ease-out"
                style={{
                  animation: "fadeSlideUp 0.5s ease-out",
                }}
              >
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, #151515 0%, #0B0B0B 50%, #050505 100%)`,
                  }}
                >
                  {/* Border */}
                  <div className="absolute inset-0 rounded-3xl p-[1px]
                                  bg-gradient-to-r from-[#8A6326]/40 via-[#C99A45]/60 to-[#8A6326]/40">
                    <div className="w-full h-full rounded-3xl bg-[#0B0B0B]" />
                  </div>

                  {/* Top Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] 
                                  bg-gradient-to-r from-transparent via-[#C99A45]/30 to-transparent" />

                  {/* Content */}
                  <div className="relative p-6 md:p-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        {/* Tier Badge */}
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center
                                      ${selectedTier.icon === "bronze" ? "bg-gradient-to-br from-[#A86A3D] to-[#7A4A28]" : ""}
                                      ${selectedTier.icon === "silver" ? "bg-gradient-to-br from-[#A9ADB5] to-[#7A7D82]" : ""}
                                      ${selectedTier.icon === "gold" ? "bg-gradient-to-br from-[#C99A45] to-[#8A6326]" : ""}
                                      ${selectedTier.icon === "black" ? "bg-gradient-to-br from-[#5C6068] to-[#3A3D42]" : ""}`}
                        >
                          {getTierIcon(selectedTier.icon, selectedTierIndex || 0)}
                        </div>

                        <div>
                          <h3 className="text-[#F5F0E8] text-xl md:text-2xl font-bold">
                            {selectedTier.name}
                          </h3>
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs mt-1 px-2.5 py-0.5 rounded-full
                                        ${selectedTierStatus === "current"
                                ? "bg-[#C99A45]/20 text-[#E2B866]"
                                : selectedTierStatus === "reached"
                                  ? "bg-[#8A6326]/20 text-[#C99A45]"
                                  : "bg-[#333] text-[#888]"}`}
                          >
                            {selectedTierStatus === "current" && (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E2B866] animate-pulse" />
                                مستواك الحالي
                              </>
                            )}
                            {selectedTierStatus === "reached" && (
                              <>
                                <Check className="w-3 h-3" />
                                تم الوصول إليه
                              </>
                            )}
                            {selectedTierStatus === "upcoming" && (
                              <>
                                <ChevronLeft className="w-3 h-3" />
                                المرحلة القادمة
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Points Badge */}
                      <div className="text-center">
                        <p className="text-[#666] text-xs mb-1">يبدأ من</p>
                        <p className="text-[#C99A45] font-bold text-lg">{selectedTier.minPoints}+</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#B9B0A2] text-sm md:text-base mb-8 leading-relaxed">
                      {selectedTier.description}
                    </p>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                      {selectedTier.benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 rounded-xl
                                     bg-gradient-to-r from-[#1A1A1A] to-[#151515]
                                     border border-[#2A2A2A]
                                     hover:border-[#C99A45]/30 hover:bg-[#1F1F1F]
                                     transition-all duration-300 group"
                          style={{
                            animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both`,
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C99A45]/20 to-[#8A6326]/10
                                          flex items-center justify-center flex-shrink-0
                                          group-hover:from-[#C99A45]/30 group-hover:to-[#E2B866]/20 transition-all">
                            <Sparkles className="w-4 h-4 text-[#C99A45]" />
                          </div>
                          <span className="text-[#E8E8E8] text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-[#1B1B1B]">
                      {selectedTierStatus === "upcoming" ? (
                        <p className="text-[#B9B0A2] text-sm">
                          تحتاج <span className="text-[#C99A45] font-bold">{Math.max(selectedTier.minPoints - currentPoints, 0)}</span> نقطة للوصول إلى هذا المستوى
                        </p>
                      ) : selectedTierStatus === "current" ? (
                        <p className="text-[#E2B866] text-sm flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          أنت الآن تستمتع بمزايا {selectedTier.name}
                        </p>
                      ) : (
                        <p className="text-[#C99A45] text-sm flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          تم الوصول إلى هذا المستوى بنجاح
                        </p>
                      )}

                      {/* Motivational Text */}
                      <p className="text-[#666] text-xs md:text-sm italic">
                        {selectedTierStatus === "upcoming"
                          ? "واصل التقدم لتجربة مزايا أقوى ✨"
                          : selectedTierStatus === "current"
                            ? "استمر في زياراتك للصعود للمستوى التالي 🚀"
                            : "خطوة أساسية في رحلتك مع CUT CLUB 🎯"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Animations */}
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            @keyframes fadeSlideUp {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInUp {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
};

export default CutClubTierJourney;
