import type { ReactNode } from 'react';
import type { ClubModuleDefinition, ClubModuleState } from '@/lib/club/registry';

export function ClubNavigation() {
  return (
    <nav aria-label="CUT CLUB" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-neutral-950 pb-[env(safe-area-inset-bottom)] md:static md:border-b md:border-t-0 md:pb-0">
      <ul className="mx-auto grid max-w-5xl grid-cols-5 text-center text-xs sm:text-sm" dir="ltr">
        <li><a href="/club" aria-current="page" className="block px-1 py-5 text-amber-200 focus-visible:outline focus-visible:outline-2">Home</a></li>
        <li><button disabled className="w-full px-1 py-5 text-neutral-500">Explore</button></li>
        <li><a href="/book" className="block px-1 py-5 text-white focus-visible:outline focus-visible:outline-2">Book<span className="sr-only"> — الحجز العام</span></a></li>
        <li><button disabled className="w-full px-1 py-5 text-neutral-500">Wallet</button></li>
        <li><button disabled className="w-full px-1 py-5 text-neutral-500">Me</button></li>
      </ul>
    </nav>
  );
}

export function ClubShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-dvh bg-neutral-950 text-neutral-100 [--cut-campaign-bar-height:0px]">
      <a href="#club-content" className="sr-only focus:not-sr-only focus:block focus:p-4">انتقل إلى المحتوى</a>
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6">
        <span dir="ltr" className="text-xl font-bold tracking-[0.2em] text-amber-200">CUT CLUB</span>
        <span className="text-sm text-neutral-400">مساحة الأعضاء</span>
      </header>
      <ClubNavigation />
      <main id="club-content" className="mx-auto max-w-5xl px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-10 md:pb-12">{children}</main>
    </div>
  );
}

const stateText: Record<ClubModuleState, string> = {
  loading: 'جارٍ التحميل',
  empty: 'لا توجد معلومات للعرض',
  unavailable: 'غير متاح حاليًا',
};

/** Presentation only: no customer-shaped props, values, requests or actions. */
export function ClubModule({ module, state = 'unavailable' }: { module: ClubModuleDefinition; state?: ClubModuleState }) {
  return (
    <article aria-label={module.title} aria-busy={state === 'loading'} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="font-semibold">{module.title}</h2>
      <p className="mt-3 text-sm text-neutral-400">{stateText[state]}</p>
    </article>
  );
}
