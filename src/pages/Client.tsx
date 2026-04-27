import CutClubHero from "@/components/CutClubHero";
import CutClubRewardGiftMilestones from "@/components/CutClubRewardGiftMilestones";
import CutClubTierJourney from "@/components/CutClubTierJourney";

const Client = () => {
  // This data would typically come from an API or context
  const customerData = {
    customerName: "Ahmed Mohamed",
    memberNo: "004829",
    tier: "Gold Member",
    points: 725,
    // Placeholder for the hero chair image - replace with actual image path
    chairImage: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80",
  };

  const currentPoints = 725;

  return (
    <main className="min-h-screen bg-[#050505]">
      <CutClubHero
        customerName={customerData.customerName}
        memberNo={customerData.memberNo}
        tier={customerData.tier}
        points={customerData.points}
        chairImage={customerData.chairImage}
      />

      {/* Reward Gift Milestones Section */}
      <CutClubRewardGiftMilestones
        currentPoints={currentPoints}
      />

      {/* Tier Journey Map */}
      <CutClubTierJourney
        currentPoints={currentPoints}
      />

      {/* Placeholder for additional sections */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <p className="text-[#B9B0A2] text-lg">
            المزيد من المميزات قريبًا...
          </p>
        </div>
      </section>
    </main>
  );
};

export default Client;
