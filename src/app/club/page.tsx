import { getClubGate } from '@/lib/club/registry';

export default function ClubPage() {
  const gate = getClubGate();
  return (
    <section aria-labelledby="club-title" className="max-w-2xl rounded-3xl border border-amber-200/20 p-6 sm:p-10">
      <p className="mb-4 text-sm text-amber-200">CUT CLUB</p>
      <h1 id="club-title" className="text-2xl font-bold sm:text-3xl">مساحة الأعضاء غير متاحة حاليًا</h1>
      <p className="mt-5 leading-8 text-neutral-300">
        {gate === 'disabled' ? 'لم يتم تفعيل مساحة الأعضاء بعد.' : 'الوصول الآمن لحسابات الأعضاء غير متاح بعد.'}
        {' '}تسجيل الدخول وعرض بيانات الحساب والمكافآت غير متاحين. يمكنك استخدام الحجز العام دون الدخول إلى حساب عضو.
      </p>
      <a href="/book" className="mt-8 inline-block rounded-xl bg-amber-200 px-6 py-3 font-semibold text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">الحجز العام</a>
      <p className="mt-6 text-sm text-neutral-400">Explore وWallet وMe غير متاحة حاليًا.</p>
    </section>
  );
}
