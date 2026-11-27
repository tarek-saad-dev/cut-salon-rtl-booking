import Link from 'next/link';
import type {DecemberRates} from '@/lib/december/rates';
export default function DecemberHomePromo({rates}:{rates:DecemberRates}){
 const max=Math.min(100,rates.firstVisit+rates.student+rates.club+rates.multiService+rates.friends[2]);
 return <section dir="rtl" aria-label="امتحان ديسمبر - معاينة" className="bg-[#0C0C0C] px-5 py-8 md:py-12">
  <div className="mx-auto max-w-6xl grid md:grid-cols-[1.4fr_1fr] gap-6 rounded-sm bg-[#F2F0E9] text-[#0C0C0C] p-6 md:p-10">
   <div><p className="font-mono text-xs tracking-widest text-[#CF252B]" dir="ltr">CUT SALON / DEC 2026 · PREVIEW</p>
   <h2 className="mt-3 text-4xl md:text-6xl font-black leading-tight">امتحان <span className="text-[#CF252B]">ديسمبر.</span></h2>
   <p className="mt-3 text-lg font-bold">صاحبك المرة دي هيوفرلك فلوس!</p><p className="mt-2 text-sm leading-relaxed">سجل، لمّ صحابك الجداد، واعرف شروط الخصم قبل زيارتك.</p>
   <Link href="/offers/december" className="inline-flex mt-5 bg-[#0C0C0C] text-[#F2F0E9] px-6 py-3 font-bold rounded-sm">شوف ورقة الامتحان</Link></div>
   <div className="border border-[#0C0C0C]/30 p-5 flex flex-col justify-center items-center text-center">
    <p className="text-sm">خصم محتمل عند استيفاء الشروط</p><p dir="ltr" className="text-6xl md:text-7xl font-black text-[#CF252B]">{max}%</p>
    <p className="text-sm mt-2">مرة واحدة لكل عميل · النتيجة النهائية في الفرع</p><p className="text-xs mt-4">معاينة اختبارية — الحملة لم تُطلق للعملاء.</p>
   </div>
  </div>
 </section>;
}
