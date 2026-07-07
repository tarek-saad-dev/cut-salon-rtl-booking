"use client";

import { useState, useMemo } from "react";
import { Gift, Lock, Check, Sparkles, ChevronLeft } from "lucide-react";

interface Reward {
  id: string;
  title: string;
  subtitle: string;
  unlockPoints: number;
  description: string;
}

interface CutClubRewardGiftMilestonesProps {
  currentPoints?: number;
  rewards?: Reward[];
}

const defaultRewards: Reward[] = [
  {
    id: "reward-1",
    title: "خصم 20%",
    subtitle: "خصم على الخدمة القادمة",
    unlockPoints: 300,
    description: "احصل على خصم 20% على أي خدمة عند الوصول لهذه المرحلة",
  },
  {
    id: "reward-2",
    title: "Free Skin Cleaning",
    subtitle: "خدمة تنظيف بشرة متكاملة مجانًا",
    unlockPoints: 800,
    description: "هدية مجانية مميزة بمجرد الوصول للنقاط المطلوبة - تنظيف بشرة احترافي",
  },
  {
    id: "reward-3",
    title: "حلاقة مجانية",
    subtitle: "قص شعر كامل بدون تكلفة",
    unlockPoints: 1000,
    description: "احصل على قصة شعر احترافية مجانًا كمكافأة على ولائك",
  },
];

const CutClubRewardGiftMilestones = ({
  currentPoints = 725,
  rewards = defaultRewards,
}: CutClubRewardGiftMilestonesProps) => {
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  // Sort rewards by unlock points
  const sortedRewards = useMemo(() => {
    return [...rewards].sort((a, b) => a.unlockPoints - b.unlockPoints);
  }, [rewards]);

  // Get reward state
  const getRewardState = (reward: Reward) => {
    if (currentPoints >= reward.unlockPoints) return "unlocked";
    return "locked";
  };

  // Check if this is the next upcoming reward
  const isNextUpcoming = (reward: Reward) => {
    const lockedRewards = sortedRewards.filter((r) => currentPoints < r.unlockPoints);
    if (lockedRewards.length === 0) return false;
    return lockedRewards[0].id === reward.id;
  };

  // Calculate remaining points
  const getRemainingPoints = (reward: Reward) => {
    return Math.max(reward.unlockPoints - currentPoints, 0);
  };

  // Find next upcoming reward
  const nextUpcomingReward = useMemo(() => {
    return sortedRewards.find((r) => currentPoints < r.unlockPoints);
  }, [sortedRewards, currentPoints]);

  const handleRewardClick = (rewardId: string) => {
    setSelectedRewardId(selectedRewardId === rewardId ? null : rewardId);
  };

  const selectedReward = selectedRewardId
    ? sortedRewards.find((r) => r.id === selectedRewardId)
    : null;

  return (
    <section className="w-full bg-cut-black py-12 md:py-20 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] 
                      bg-[#C99A45]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-[1200px] relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-[#C99A45]" />
            <p className="text-[#C99A45] text-sm font-semibold tracking-widest">
              مكافآتك القادمة
            </p>
            <Gift className="w-5 h-5 text-[#C99A45]" />
          </div>
          <h2 className="text-[#F5F0E8] text-3xl md:text-4xl font-bold mb-3">
            الهدايا التي تنتظرك
          </h2>
          <p className="text-[#B9B0A2] text-sm md:text-base max-w-md mx-auto">
            كل زيارة تقربك من مكافآت جديدة داخل CUT CLUB
          </p>
        </div>

        {/* Gift Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {sortedRewards.map((reward) => {
            const state = getRewardState(reward);
            const isNext = isNextUpcoming(reward);
            const remaining = getRemainingPoints(reward);
            const isUnlocked = state === "unlocked";
            const isSelected = selectedRewardId === reward.id;

            return (
              <button
                key={reward.id}
                onClick={() => handleRewardClick(reward.id)}
                className={`relative group text-right focus:outline-none
                           transition-all duration-500 ease-out
                           ${isSelected ? "md:col-span-1" : ""}`}
              >
                <div
                  className={`relative rounded-3xl overflow-hidden h-full
                             transition-all duration-500
                             ${isNext ? "md:-mt-4" : ""}
                             ${isSelected ? "ring-2 ring-[#C99A45] ring-offset-2 ring-offset-cut-black" : ""}`}
                  style={{
                    background: `linear-gradient(145deg, #101010 0%, #080808 50%, #050505 100%)`,
                  }}
                >
                  {/* Border */}
                  <div
                    className={`absolute inset-0 rounded-3xl p-[1px] transition-all duration-500
                                ${isNext ? "bg-gradient-to-r from-[#C99A45] via-[#E2B866] to-[#C99A45]" : ""}
                                ${isUnlocked ? "bg-gradient-to-r from-[#C99A45]/50 via-[#E2B866]/50 to-[#C99A45]/50" : ""}
                                ${!isNext && !isUnlocked ? "bg-gradient-to-r from-[#333]/50 via-[#444]/30 to-[#333]/50" : ""}`}
                  >
                    <div className="w-full h-full rounded-3xl bg-cut-black" />
                  </div>

                  {/* Glow Effect */}
                  {isNext && (
                    <div className="absolute inset-0 bg-[#C99A45]/10 blur-[40px] pointer-events-none" />
                  )}

                  {/* Content */}
                  <div className="relative p-6 md:p-8 flex flex-col items-center">
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                         bg-[#C99A45]/20 text-[#E2B866] text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          تم الفتح
                        </span>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                         bg-[#C99A45] text-cut-black text-xs font-bold
                                         animate-pulse shadow-[0_0_15px_rgba(201,154,69,0.5)]">
                          <Sparkles className="w-3 h-3" />
                          الأقرب لك
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                         bg-[#222] text-[#666] text-xs">
                          <Lock className="w-3 h-3" />
                          لاحقًا
                        </span>
                      )}
                    </div>

                    {/* 3D Gift Box Visual */}
                    <div
                      className={`relative w-28 h-28 md:w-32 md:h-32 mb-6
                                  transition-transform duration-500
                                  ${isNext ? "group-hover:scale-110" : "group-hover:scale-105"}
                                  ${isNext ? "scale-105" : ""}`}
                    >
                      {/* Box Shadow */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 
                                      bg-black/50 blur-xl rounded-full" />

                      {/* Box Container */}
                      <div
                        className={`relative w-full h-full rounded-2xl
                                    flex items-center justify-center
                                    transition-all duration-500
                                    ${isUnlocked ? "bg-gradient-to-br from-[#C99A45] to-[#8A6326]" : ""}
                                    ${isNext ? "bg-gradient-to-br from-[#C99A45]/80 to-[#8A6326]/60" : ""}
                                    ${!isNext && !isUnlocked ? "bg-gradient-to-br from-[#2A2A2A] to-cut-surface-elevated" : ""}`}
                        style={{
                          boxShadow: isNext
                            ? "0 20px 40px rgba(201, 154, 69, 0.4), inset 0 2px 0 rgba(255,255,255,0.1)"
                            : isUnlocked
                              ? "0 15px 30px rgba(201, 154, 69, 0.3), inset 0 2px 0 rgba(255,255,255,0.1)"
                              : "0 10px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                        }}
                      >
                        {/* Box Top Edge */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-2xl
                                        bg-gradient-to-b from-white/10 to-transparent" />

                        {/* Gold Ribbon Vertical */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-full
                                        bg-gradient-to-b from-[#E2B866] via-[#C99A45] to-[#8A6326]" />

                        {/* Gold Ribbon Horizontal */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-3
                                        bg-gradient-to-r from-[#E2B866] via-[#C99A45] to-[#8A6326]" />

                        {/* Center Decoration */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                                        w-8 h-8 rounded-full
                                        bg-gradient-to-br from-[#E2B866] to-[#C99A45]
                                        flex items-center justify-center
                                        shadow-lg z-10">
                          <Gift className="w-4 h-4 text-cut-black" />
                        </div>

                        {/* Corner Highlights */}
                        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/10" />
                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/10" />
                      </div>

                      {/* Floating Sparkles for Next */}
                      {isNext && (
                        <>
                          <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-[#E2B866]
                                          animate-ping opacity-75" />
                          <div className="absolute top-1/2 -left-3 w-2 h-2 rounded-full bg-[#C99A45]
                                          animate-pulse" />
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-xl md:text-2xl font-bold mb-2 text-center
                                  ${isUnlocked ? "text-[#E2B866]" : isNext ? "text-[#C99A45]" : "text-[#888]"}`}
                    >
                      {reward.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-[#666] text-sm mb-4 text-center">{reward.subtitle}</p>

                    {/* Required Points */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[#888] text-xs">تُفتح عند</span>
                      <span
                        className={`font-bold ${isUnlocked ? "text-[#E2B866]" : isNext ? "text-[#C99A45]" : "text-[#666]"
                          }`}
                      >
                        {reward.unlockPoints}
                      </span>
                      <span className="text-[#666] text-xs">نقطة</span>
                    </div>

                    {/* Remaining Points - Most Important */}
                    {!isUnlocked && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-2
                                    ${isNext ? "bg-[#C99A45]/20 border border-[#C99A45]/30" : "bg-[#222]"}`}
                      >
                        <span className="text-[#666] text-xs">متبقي</span>
                        <span
                          className={`font-bold text-lg ${isNext ? "text-[#E2B866]" : "text-[#888]"
                            }`}
                        >
                          {remaining}
                        </span>
                        <span className="text-[#666] text-xs">نقطة</span>
                      </div>
                    )}

                    {/* Unlocked Message */}
                    {isUnlocked && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-2
                                      bg-[#C99A45]/20 border border-[#C99A45]/30">
                        <Check className="w-4 h-4 text-[#E2B866]" />
                        <span className="text-[#E2B866] text-sm font-medium">متاحة للاستخدام</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Reward Details Panel */}
        {selectedReward && (
          <div
            className="mt-8 md:mt-12 transition-all duration-500"
            style={{ animation: "fadeSlideUp 0.5s ease-out" }}
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: `linear-gradient(145deg, #151515 0%, #0B0B0B 100%)`,
              }}
            >
              {/* Border */}
              <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-r from-[#8A6326]/40 via-[#C99A45]/60 to-[#8A6326]/40">
                <div className="w-full h-full rounded-3xl bg-[#0B0B0B]" />
              </div>

              {/* Content */}
              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0
                                ${selectedReward.unlockPoints <= currentPoints ? "bg-gradient-to-br from-[#C99A45] to-[#8A6326]" : "bg-gradient-to-br from-[#2A2A2A] to-cut-surface-elevated"}`}
                  >
                    <Gift className="w-8 h-8 text-cut-ivory" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-[#F5F0E8] text-xl font-bold">{selectedReward.title}</h4>
                      {selectedReward.unlockPoints <= currentPoints ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#C99A45]/20 text-[#E2B866] text-xs">
                          متاحة
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#222] text-[#888] text-xs">
                          مقفلة
                        </span>
                      )}
                    </div>
                    <p className="text-[#B9B0A2] text-sm mb-2">{selectedReward.subtitle}</p>
                    <p className="text-[#666] text-sm">{selectedReward.description}</p>
                  </div>

                  {/* Status */}
                  <div className="text-center md:text-right">
                    {selectedReward.unlockPoints <= currentPoints ? (
                      <p className="text-[#E2B866] text-sm">
                        يمكنك الاستفادة منها الآن!
                      </p>
                    ) : (
                      <div>
                        <p className="text-[#666] text-xs mb-1">متبقي</p>
                        <p className="text-[#C99A45] text-2xl font-bold">
                          {selectedReward.unlockPoints - currentPoints}
                        </p>
                        <p className="text-[#666] text-xs">نقطة للوصول إليها</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedRewardId(null)}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#222] 
                             flex items-center justify-center text-[#888]
                             hover:bg-[#333] hover:text-[#F5F0E8] transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Status Summary */}
        {nextUpcomingReward && (
          <div className="mt-8 md:mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl
                            bg-gradient-to-r from-[#C99A45]/10 to-[#E2B866]/5
                            border border-[#C99A45]/20">
              <Sparkles className="w-5 h-5 text-[#C99A45]" />
              <span className="text-[#B9B0A2] text-sm">
                أقرب مكافأة:
                <span className="text-[#E2B866] font-bold mr-1"> {nextUpcomingReward.title} </span>
                بعد
                <span className="text-[#C99A45] font-bold mx-1">
                  {nextUpcomingReward.unlockPoints - currentPoints}
                </span>
                نقطة
              </span>
              <Sparkles className="w-5 h-5 text-[#C99A45]" />
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default CutClubRewardGiftMilestones;
