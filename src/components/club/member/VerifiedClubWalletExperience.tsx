import { AuthorizedClubOverview } from "./MemberOverview";
import { ClientVoucherHandoff } from "./ClientVoucherHandoff";
import type { MemberOverviewView } from "./memberViewModels";
import type { ClubVoucherSummary, VerifiedVoucherCode } from "./ClientVoucherHandoff";

/**
 * CUT CLUB authenticated member Wallet composition. NOT mounted on /club
 * until server-authenticated WhatsApp login + tenant-owned BFF is approved.
 *
 * Important: memberSessionReady is merely a PRESENTATION gate, not a session
 * verifier. The trusted server must check a persisted revocable session on
 * every fetch and build props only from authorized, owner-scoped data.
 */
export function VerifiedClubWalletExperience(input: Readonly<{
  data: MemberOverviewView | null;
  vouchers: readonly ClubVoucherSummary[] | null;
  memberSessionReady: boolean;
  revealCode: (inventoryId: number) => Promise<VerifiedVoucherCode | null>;
}>) {
  if (!input.memberSessionReady || !input.data) {
    return (
      <div className="space-y-5" dir="rtl">
        <AuthorizedClubOverview data={null} />
        <ClientVoucherHandoff memberSessionReady={false} vouchers={null} revealCode={input.revealCode} />
        <a href="/book" className="inline-flex rounded-lg border border-[#d2b7a3] px-5 py-3 text-sm font-semibold">احجز زيارتك</a>
      </div>
    );
  }
  return (
    <div className="space-y-5" dir="rtl">
      <AuthorizedClubOverview data={input.data} />
      <ClientVoucherHandoff
        memberSessionReady={true}
        vouchers={input.vouchers}
        revealCode={input.revealCode}
      />
    </div>
  );
}
