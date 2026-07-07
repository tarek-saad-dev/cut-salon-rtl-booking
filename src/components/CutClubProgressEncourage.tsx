import { Gift } from "lucide-react";

interface CutClubProgressEncourageProps {
  currentPoints?: number;
  nextRewardPoints?: number;
  rewardTitle?: string;
  rewardSubtitle?: string;
}

const CutClubProgressEncourage = ({
  currentPoints = 725,
  nextRewardPoints = 800,
  rewardTitle = "Free Skin Cleaning",
  rewardSubtitle,
}: CutClubProgressEncourageProps) => {
  // Calculate progress
  const remainingPoints = Math.max(nextRewardPoints - currentPoints, 0);
  const progressPercentage = Math.min((currentPoints / nextRewardPoints) * 100, 100);
  const isRewardUnlocked = currentPoints >= nextRewardPoints;

  return (
    <section className="w-full bg-cut-black py-8 md:py-12 px-4">
      <div className="container mx-auto max-w-[1120px]">
        {/* Main Card */}
        <div 
          className="relative w-full rounded-3xl overflow-hidden group
                     transition-all duration-500 ease-out
                     hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,154,69,0.15)]"
          style={{
            background: `linear-gradient(145deg, #101010 0%, #080808 50%, #050505 100%)`,
          }}
        >
          {/* Border with Gold Glow */}
          <div className="absolute inset-0 rounded-3xl p-[1px]
                          bg-gradient-to-r from-[#8A6326]/40 via-[#C99A45]/60 to-[#8A6326]/40
                          group-hover:from-[#C99A45]/60 group-hover:via-[#E2B866] group-hover:to-[#C99A45]/60
                          transition-all duration-500">
            <div className="w-full h-full rounded-3xl bg-cut-black" />
          </div>

          {/* Subtle Radial Glow Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          w-[80%] h-[80%] bg-[#C99A45]/5 blur-[80px] rounded-full pointer-events-none" />

          {/* Top Highlight Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r 
                          from-transparent via-[#C99A45]/30 to-transparent" />

          {/* Card Content */}
          <div className="relative p-6 md:p-10">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between gap-8">
              {/* Left - Text Content */}
              <div className="flex-1">
                {/* Encouragement Text */}
                <p className="text-[#F5F0E8] text-lg md:text-xl font-semibold mb-2">
                  باقي{" "}
                  <span className="text-[#C99A45] text-2xl md:text-3xl font-bold">
                    {isRewardUnlocked ? 0 : remainingPoints}
                  </span>{" "}
                  نقطة وتفتح مكافأة
                </p>

                {/* Reward Title */}
                <h3 className="text-[#E2B866] text-2xl md:text-3xl font-bold tracking-wide mb-6">
                  {isRewardUnlocked ? "🎉 مبروك! تم فتح المكافأة" : rewardTitle}
                </h3>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-[16px] rounded-full overflow-hidden bg-[#1B1B1B] shadow-inner">
                    {/* Progress Fill */}
                    <div 
                      className="h-full rounded-full relative transition-all duration-700 ease-out"
                      style={{
                        width: `${progressPercentage}%`,
                        background: `linear-gradient(90deg, #C99A45 0%, #E2B866 50%, #C99A45 100%)`,
                      }}
                    >
                      {/* Inner Shine Effect */}
                      <div className="absolute top-0 left-0 right-0 h-[40%] 
                                      bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
                      {/* Soft Shadow */}
                      <div className="absolute top-0 right-0 w-4 h-full 
                                      bg-gradient-to-l from-[#E2B866]/40 to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Points Label */}
                <p className="text-[#B9B0A2] text-sm">
                  <span className="text-[#F5F0E8] font-semibold">{currentPoints}</span>
                  {" / "}
                  <span className="text-[#C99A45]">{nextRewardPoints}</span>
                  {" "}نقطة
                </p>

                {/* Optional Subtitle */}
                {rewardSubtitle && (
                  <p className="text-[#B9B0A2]/70 text-xs mt-3">{rewardSubtitle}</p>
                )}
              </div>

              {/* Right - Gift Icon */}
              <div className="flex-shrink-0">
                <div 
                  className="relative w-24 h-24 md:w-28 md:h-28 rounded-full 
                             flex items-center justify-center
                             transition-all duration-500 group-hover:scale-105"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #1A2820 0%, #0d0d0d 100%)`,
                    boxShadow: `0 0 30px rgba(201, 154, 69, 0.3), 
                                inset 0 1px 0 rgba(201, 154, 69, 0.1)`,
                  }}
                >
                  {/* Inner Border */}
                  <div className="absolute inset-0 rounded-full border border-[#C99A45]/50 
                                  group-hover:border-[#E2B866] transition-colors duration-300" />
                  
                  {/* Glow Ring */}
                  <div className="absolute -inset-1 rounded-full border border-[#C99A45]/20 
                                  blur-sm group-hover:border-[#E2B866]/40 transition-all duration-300" />
                  
                  {/* Gift Icon */}
                  <Gift 
                    className={`w-10 h-10 md:w-12 md:h-12 transition-all duration-300 ${
                      isRewardUnlocked 
                        ? "text-[#E2B866] drop-shadow-[0_0_10px_rgba(226,184,102,0.5)]" 
                        : "text-[#C99A45]"
                    }`}
                    strokeWidth={1.5}
                  />

                  {/* Success Badge if Unlocked */}
                  {isRewardUnlocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full 
                                    bg-gradient-to-br from-[#E2B866] to-[#C99A45]
                                    flex items-center justify-center text-cut-black text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden flex flex-col items-center text-center">
              {/* Gift Icon */}
              <div className="mb-6">
                <div 
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #1A2820 0%, #0d0d0d 100%)`,
                    boxShadow: `0 0 25px rgba(201, 154, 69, 0.25)`,
                  }}
                >
                  <div className="absolute inset-0 rounded-full border border-[#C99A45]/50" />
                  <Gift 
                    className={`w-8 h-8 ${
                      isRewardUnlocked 
                        ? "text-[#E2B866] drop-shadow-[0_0_8px_rgba(226,184,102,0.5)]" 
                        : "text-[#C99A45]"
                    }`}
                    strokeWidth={1.5}
                  />
                  {isRewardUnlocked && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full 
                                    bg-gradient-to-br from-[#E2B866] to-[#C99A45]
                                    flex items-center justify-center text-cut-black text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Encouragement Text */}
              <p className="text-[#F5F0E8] text-base font-semibold mb-2">
                باقي{" "}
                <span className="text-[#C99A45] text-xl font-bold">
                  {isRewardUnlocked ? 0 : remainingPoints}
                </span>{" "}
                نقطة وتفتح مكافأة
              </p>

              {/* Reward Title */}
              <h3 className="text-[#E2B866] text-xl font-bold tracking-wide mb-5">
                {isRewardUnlocked ? "🎉 مبروك! تم فتح المكافأة" : rewardTitle}
              </h3>

              {/* Progress Bar */}
              <div className="w-full mb-4">
                <div className="h-[14px] rounded-full overflow-hidden bg-[#1B1B1B]">
                  <div 
                    className="h-full rounded-full relative transition-all duration-700"
                    style={{
                      width: `${progressPercentage}%`,
                      background: `linear-gradient(90deg, #C99A45 0%, #E2B866 50%, #C99A45 100%)`,
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[40%] 
                                    bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
                  </div>
                </div>
              </div>

              {/* Points Label */}
              <p className="text-[#B9B0A2] text-sm">
                <span className="text-[#F5F0E8] font-semibold">{currentPoints}</span>
                {" / "}
                <span className="text-[#C99A45]">{nextRewardPoints}</span>
                {" "}نقطة
              </p>

              {rewardSubtitle && (
                <p className="text-[#B9B0A2]/70 text-xs mt-2">{rewardSubtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CutClubProgressEncourage;
