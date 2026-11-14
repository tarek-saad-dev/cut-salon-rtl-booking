import type { MemberOverviewView, MemberSummary, MemberWallet, UpcomingVisit } from "./memberViewModels";
import { formatCoins, formatEGPCredit, validProgress } from "./memberViewModels";

const unavailable = "البيانات غير متاحة حاليًا";

function Surface({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <section aria-label={title} className="rounded-2xl border border-[#a48879]/25 bg-[#170d10] p-5 shadow-[0_12px_32px_#00000022] sm:p-7">
      {children}
    </section>
  );
}

/** Presentation ONLY: never fetches, authenticates, chooses a clientId or changes a balance. */
export function MemberIdentityCard({ member }: Readonly<{ member: MemberSummary | null }>) {
  if (member === null) {
    return (
      <Surface title="بطاقة CUT CLUB">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d2b7a3]">CUT CLUB</p>
        <h2 className="mt-3 text-lg font-semibold text-[#fcf9ed]">بطاقة العضو</h2>
        <p className="mt-3 text-sm text-[#c3b4aa]">{unavailable}</p>
      </Surface>
    );
  }

  const coins = formatCoins(member.coins);
  const progress = validProgress(member.nextTierProgress) ? member.nextTierProgress : null;

  return (
    <Surface title="بطاقة CUT CLUB">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p dir="ltr" className="text-xs font-bold tracking-[0.3em] text-[#d2b7a3]">CUT CLUB · MEMBER</p>
          <h2 className="mt-4 text-2xl font-semibold text-[#fcf9ed] sm:text-3xl">{member.displayName}</h2>
          <p dir="ltr" className="mt-2 text-xs tracking-[0.1em] text-[#c3b4aa]">{member.cutId}</p>
        </div>
        {member.tierName ? (
          <span className="rounded-full border border-[#d2b7a3]/50 px-4 py-2 text-xs font-semibold text-[#e7cab4]">
            {member.tierName}
          </span>
        ) : null}
      </div>

      <div className="mt-8 border-t border-white/10 pt-5">
        <p className="text-xs text-[#c3b4aa]">CUT Coins المتاحة</p>
        {coins === null ? (
          <p className="mt-2 text-sm text-[#c3b4aa]">{unavailable}</p>
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums text-[#fcf9ed]" data-unit="CUT-Coins">
            <bdi>{coins}</bdi> <span className="text-sm font-normal text-[#d2b7a3]">CC</span>
          </p>
        )}
      </div>

      {progress !== null ? (
        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#d2b7a3]">
            <span>{progress.label}</span>
            <span dir="ltr"><bdi>{progress.completed}</bdi> / {progress.target}</span>
          </div>
          <progress
            aria-label={progress.label}
            max={progress.target}
            value={progress.completed}
            className="h-2 w-full accent-[#a48879]"
          />
        </div>
      ) : null}
    </Surface>
  );
}

export function MemberWalletOverview({ wallet }: Readonly<{ wallet: MemberWallet | null }>) {
  if (wallet === null) {
    return <Surface title="محفظة CUT CLUB"><h2 className="text-lg font-semibold">محفظتي</h2><p className="mt-3 text-sm text-[#c3b4aa]">{unavailable}</p></Surface>;
  }

  const coins = formatCoins(wallet.coins);
  const credit = formatEGPCredit(wallet.promoCredit);

  return (
    <Surface title="محفظة CUT CLUB">
      <h2 className="text-lg font-semibold text-[#fcf9ed]">محفظتي</h2>
      <p className="mt-1 text-xs text-[#c3b4aa]">الأرصدة والمكافآت فئات منفصلة وليست قابلة للجمع.</p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#a48879]/20 bg-black/20 p-4">
          <dt className="text-xs text-[#c3b4aa]">CUT Coins</dt>
          <dd className="mt-2 text-xl font-bold text-[#fcf9ed]" data-unit="CUT-Coins">
            {coins === null ? <span className="text-sm font-normal">{unavailable}</span> : <><bdi>{coins}</bdi> <small>CC</small></>}
          </dd>
        </div>
        <div className="rounded-xl border border-[#a48879]/20 bg-black/20 p-4">
          <dt className="text-xs text-[#c3b4aa]">رصيد ترويجي</dt>
          <dd className="mt-2 text-xl font-bold text-[#fcf9ed]" data-unit="EGP-promo-credit">
            {credit === null ? <span className="text-sm font-normal">{unavailable}</span> : <bdi dir="ltr">{credit}</bdi>}
          </dd>
          {wallet.promoCredit?.expiryLabel ? <p className="mt-2 text-xs text-[#c3b4aa]">الصلاحية: {wallet.promoCredit.expiryLabel}</p> : null}
        </div>
      </dl>
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-[#fcf9ed]">قسائم ومكافآت مملوكة</h3>
        {wallet.vouchers === null ? (
          <p className="mt-2 text-sm text-[#c3b4aa]">{unavailable}</p>
        ) : wallet.vouchers.length === 0 ? (
          <p className="mt-2 text-sm text-[#c3b4aa]">لا توجد قسائم مسجلة حاليًا.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {wallet.vouchers.map(voucher => (
              <li key={voucher.id} className="rounded-lg border border-[#a48879]/20 p-3 text-sm text-[#fcf9ed]">
                <span className="font-semibold">{voucher.title}</span>
                <span className="ms-3 text-xs text-[#d2b7a3]">{voucher.statusLabel}</span>
                {voucher.expiryLabel ? <span className="mt-2 block text-xs text-[#c3b4aa]">الصلاحية: {voucher.expiryLabel}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Surface>
  );
}

export function MemberUpcomingVisit({ visit }: Readonly<{ visit: UpcomingVisit }>) {
  return (
    <Surface title="الحجز القادم">
      <h2 className="text-lg font-semibold text-[#fcf9ed]">زيارتك القادمة</h2>
      {visit.state === "unavailable" ? (
        <p className="mt-3 text-sm text-[#c3b4aa]">{unavailable}</p>
      ) : visit.state === "empty" ? (
        <p className="mt-3 text-sm text-[#c3b4aa]">مافيش حجز قادم مسجل على حسابك.</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-[#c3b4aa]">الخدمة</dt><dd className="mt-1 font-semibold">{visit.serviceName}</dd></div>
          <div><dt className="text-xs text-[#c3b4aa]">الفرع</dt><dd className="mt-1 font-semibold">{visit.branchName}</dd></div>
          <div><dt className="text-xs text-[#c3b4aa]">الموعد</dt><dd className="mt-1 font-semibold">{visit.dateLabel}</dd></div>
          {visit.barberName ? <div><dt className="text-xs text-[#c3b4aa]">الحلاق</dt><dd className="mt-1 font-semibold">{visit.barberName}</dd></div> : null}
        </dl>
      )}
      <a className="mt-5 inline-flex rounded-lg border border-[#d2b7a3] px-4 py-2 text-sm font-semibold text-[#fcf9ed] hover:bg-white/10 focus-visible:outline focus-visible:outline-2" href="/book">الحجز العام</a>
    </Surface>
  );
}

/**
 * Composition for future secure Club SSR only.
 * Do NOT render on current /club or public pages until backend #243 is fixed,
 * session-aware server auth and resource ownership are independently verified.
 */
export function AuthorizedClubOverview({ data }: Readonly<{ data: MemberOverviewView | null }>) {
  if (data === null) {
    return (
      <div className="grid gap-4 md:grid-cols-2" dir="rtl">
        <MemberIdentityCard member={null} />
        <MemberWalletOverview wallet={null} />
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2" dir="rtl">
      <MemberIdentityCard member={data.member} />
      <div className="grid content-start gap-4">
        <MemberUpcomingVisit visit={data.upcomingVisit} />
        <MemberWalletOverview wallet={data.wallet} />
      </div>
    </div>
  );
}
