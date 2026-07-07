import { Scissors, Crown } from "lucide-react";

interface CutClubHeroProps {
  customerName?: string;
  memberNo?: string;
  tier?: string;
  points?: number;
  chairImage?: string;
}

const CutClubHero = ({
  customerName = "Ahmed Mohamed",
  memberNo = "004829",
  tier = "Gold Member",
  points = 725,
  chairImage = "/images/cut-chair-hero.jpg",
}: CutClubHeroProps) => {
  return (
    <section className="relative min-h-[700px] md:min-h-[760px] w-full overflow-hidden bg-cut-black">
      {/* Background Layer */}
      <div className="absolute inset-0">
        {/* Gradient Background Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-cut-black via-cut-black to-[#0d0d0d]" />
        
        {/* Cinematic Barber Chair Image - Right Side */}
        <div 
          className="absolute right-0 top-0 h-full w-full md:w-[65%] bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${chairImage})`,
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-cut-black via-cut-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-cut-black via-transparent to-cut-black/50" />
        </div>

        {/* Gold Glow Effect - Behind Card Area */}
        <div className="absolute bottom-[180px] left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] h-[300px] bg-[#C99A45]/5 blur-[120px] rounded-full" />
        
        {/* Vignette Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(5,5,5,0.4) 100%)`
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 h-full flex flex-col justify-between py-12 md:py-16">
        
        {/* Top Text Section */}
        <div className="text-center md:text-right md:pr-[35%] pt-8 md:pt-16">
          {/* Main Greeting */}
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-[#F5F0E8] mb-4 tracking-wide">
            أهلًا يا {customerName.split(' ')[0]}
          </h1>
          
          {/* Subtitle */}
          <p className="text-[#E2B866] text-xl md:text-2xl font-semibold mb-3">
            كل زيارة لك لها قيمة
          </p>
          
          {/* Description */}
          <p className="text-[#B9B0A2] text-base md:text-lg max-w-md mx-auto md:mr-0">
            استثمر في زياراتك والمكافآت تزيد
          </p>
          
          {/* Stay Sharp Signature */}
          <p className="mt-6 text-[#C99A45] text-xl md:text-2xl italic font-light tracking-wider" 
             style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Stay Sharp
          </p>
        </div>

        {/* Membership Card */}
        <div className="w-full flex justify-center mt-8 md:mt-auto md:mb-8">
          <div 
            className="relative w-[92vw] md:w-[85%] max-w-[1120px] rounded-3xl overflow-hidden group cursor-pointer
                       transition-all duration-500 ease-out
                       hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,154,69,0.25)]"
            style={{
              background: `linear-gradient(145deg, #151515 0%, #050505 50%, #050505 100%)`,
            }}
          >
            {/* Card Border with Gold Glow */}
            <div className="absolute inset-0 rounded-3xl p-[1px] 
                            bg-gradient-to-r from-[#8A6326]/50 via-[#C99A45] to-[#8A6326]/50
                            group-hover:from-[#C99A45] group-hover:via-[#E2B866] group-hover:to-[#C99A45]
                            transition-all duration-500">
              <div className="w-full h-full rounded-3xl bg-cut-black" />
            </div>

            {/* Decorative Corners - Islamic/Arabesque Pattern */}
            <div className="absolute top-0 left-0 w-24 h-24 opacity-30 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#C99A45]/40" strokeWidth="0.5">
                <path d="M0,50 Q25,25 50,0 M0,60 Q30,30 60,0 M0,70 Q35,35 70,0 M0,80 Q40,40 80,0" />
                <circle cx="20" cy="20" r="8" fill="url(#goldGradient)" />
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C99A45" />
                    <stop offset="100%" stopColor="#8A6326" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 opacity-30 pointer-events-none rotate-90">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#C99A45]/40" strokeWidth="0.5">
                <path d="M0,50 Q25,25 50,0 M0,60 Q30,30 60,0 M0,70 Q35,35 70,0 M0,80 Q40,40 80,0" />
                <circle cx="20" cy="20" r="8" fill="url(#goldGradient)" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-30 pointer-events-none -rotate-90">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#C99A45]/40" strokeWidth="0.5">
                <path d="M0,50 Q25,25 50,0 M0,60 Q30,30 60,0 M0,70 Q35,35 70,0 M0,80 Q40,40 80,0" />
                <circle cx="20" cy="20" r="8" fill="url(#goldGradient)" />
              </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 opacity-30 pointer-events-none rotate-180">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#C99A45]/40" strokeWidth="0.5">
                <path d="M0,50 Q25,25 50,0 M0,60 Q30,30 60,0 M0,70 Q35,35 70,0 M0,80 Q40,40 80,0" />
                <circle cx="20" cy="20" r="8" fill="url(#goldGradient)" />
              </svg>
            </div>

            {/* Shimmer Line Animation */}
            <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#E2B866] to-transparent 
                              animate-[shimmer_3s_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Card Content */}
            <div className="relative p-6 md:p-10">
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                {/* Left - Logo Badge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-28 flex flex-col items-center justify-center">
                    {/* Crown Icon */}
                    <Crown className="w-6 h-6 text-[#C99A45] mb-1" />
                    
                    {/* Shield Frame */}
                    <div className="absolute inset-0 border-2 border-[#C99A45] rounded-t-lg rounded-b-2xl 
                                    bg-gradient-to-b from-cut-surface-elevated to-[#0d0d0d]
                                    flex flex-col items-center justify-center">
                      <span className="text-[#C99A45] text-xl font-bold tracking-wider">CUT</span>
                      <Scissors className="w-5 h-5 text-[#C99A45] mt-1" />
                    </div>
                  </div>
                  <span className="text-[#C99A45] text-sm font-semibold tracking-widest mt-3">CUT CLUB</span>
                </div>

                {/* Center - Member Info */}
                <div className="flex-1 text-center px-8">
                  <p className="text-[#C99A45] text-2xl font-semibold mb-2">{tier}</p>
                  <h2 className="text-[#F5F0E8] text-3xl font-bold mb-2">{customerName}</h2>
                  <p className="text-[#B9B0A2] text-sm">Member No. {memberNo}</p>
                </div>

                {/* Right - Points */}
                <div className="text-center">
                  <p className="text-[#B9B0A2] text-sm mb-2">نقاطك الحالية</p>
                  <p className="text-5xl font-bold bg-gradient-to-b from-[#E2B866] to-[#C99A45] bg-clip-text text-transparent">
                    {points}
                  </p>
                  <p className="text-[#C99A45] text-lg mt-1">نقطة</p>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col items-center text-center">
                {/* Logo Badge */}
                <div className="mb-6">
                  <div className="relative w-20 h-24 flex flex-col items-center justify-center">
                    <Crown className="w-5 h-5 text-[#C99A45] mb-1" />
                    <div className="absolute inset-0 border-2 border-[#C99A45] rounded-t-lg rounded-b-2xl 
                                    bg-gradient-to-b from-cut-surface-elevated to-[#0d0d0d]
                                    flex flex-col items-center justify-center">
                      <span className="text-[#C99A45] text-lg font-bold tracking-wider">CUT</span>
                      <Scissors className="w-4 h-4 text-[#C99A45] mt-1" />
                    </div>
                  </div>
                  <span className="text-[#C99A45] text-xs font-semibold tracking-widest mt-2 block">CUT CLUB</span>
                </div>

                {/* Member Info */}
                <div className="mb-6">
                  <p className="text-[#C99A45] text-xl font-semibold mb-1">{tier}</p>
                  <h2 className="text-[#F5F0E8] text-2xl font-bold mb-1">{customerName}</h2>
                  <p className="text-[#B9B0A2] text-xs">Member No. {memberNo}</p>
                </div>

                {/* Points */}
                <div>
                  <p className="text-[#B9B0A2] text-xs mb-1">نقاطك الحالية</p>
                  <p className="text-4xl font-bold bg-gradient-to-b from-[#E2B866] to-[#C99A45] bg-clip-text text-transparent">
                    {points}
                  </p>
                  <p className="text-[#C99A45] text-sm mt-1">نقطة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add shimmer animation to global styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </section>
  );
};

export default CutClubHero;
