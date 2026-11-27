import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DecemberRegistrationForm from "./DecemberRegistrationForm";
import DecemberMyExam from "./DecemberMyExam";
import {readDecemberRates} from "@/lib/december/rates";
import {readEducationSuggestions} from "@/lib/december/education";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"امتحان ديسمبر", robots:{index:false,follow:false}};

/** Internal preview only. Public registration is deliberately unavailable until the POS contract is live. */
export default async function DecemberExamPreview({searchParams}:{searchParams:Promise<{ref?:string|string[]}>}) {
  if (process.env.DECEMBER_EXAM_PREVIEW !== "true") notFound();
  const {ref}=await searchParams;
  const initialReferral=typeof ref==="string" && /^CUT-[A-F0-9]{16}$/i.test(ref)?ref.toUpperCase():"";
  const [rates,suggestions]=await Promise.all([readDecemberRates(),readEducationSuggestions()]);
  const registrationEnabled=rates!==null;
  const questions=[{label:"دي أول زيارة ليك؟",rate:rates?.firstVisit},{label:"إنت طالب؟",rate:rates?.student},{label:"عضو في CUT CLUB؟",rate:rates?.club},{label:"هتعمل خدمتين أو أكتر؟",rate:rates?.multiService}];
  return (
    <main dir="rtl" className="min-h-screen bg-[#0C0C0C] text-[#F2F0E9] px-5 py-14 md:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs tracking-widest text-[#e76c70]" dir="ltr">CUT SALON / DEC 2026</p>
        <div className="grid gap-10 md:grid-cols-2 md:items-center mt-8">
          <section>
            <p className="text-sm text-neutral-400">THE DECEMBER EXAM</p>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mt-4">امتحان<br/><span className="text-[#e76c70]">ديسمبر.</span></h1>
            <p className="mt-6 text-xl leading-relaxed">صاحبك المرة دي هيوفرلك فلوس!</p>
            <p className="mt-3 text-neutral-400 leading-relaxed">سجّل، لمّ صحابك الجداد، واعرف الخصم اللي تستحقه.</p>
            <a href="#december-register" className="inline-block mt-6 rounded-md bg-[#CF252B] px-6 py-3 font-bold text-white">ابدأ الامتحان</a>
            <p className="mt-8 text-sm border border-neutral-700 rounded-lg p-4" role="status">معاينة داخلية — الحملة لم تُطلق للعملاء بعد.</p>
          </section>
          <section className="bg-[#F2F0E9] text-[#0C0C0C] rounded-sm p-6 md:p-9 shadow-xl">
            <header className="flex items-center justify-between border-b border-neutral-400 pb-5">
              <h2 className="font-bold text-xl">ورقة الامتحان</h2><span dir="ltr" className="text-[#CF252B] font-bold">DEC / 26</span>
            </header>
            <ol className="divide-y divide-neutral-300">
              {questions.map(({label,rate},i)=>(
                <li key={label} className="py-5 flex items-center gap-4">
                  <span aria-hidden="true" className="text-[#CF252B] font-mono">0{i+1}</span>
                  <span className="font-semibold flex-1">{label}</span>{rate!==undefined&&<strong dir="ltr" className="text-[#CF252B] text-xl">+{rate}%</strong>}
                </li>
              ))}
            </ol>
            <h3 className="font-bold mt-4">هتجيب كام صاحب جديد؟</h3>
            <div className="grid grid-cols-3 gap-2 my-4">{["صاحب","صاحبين","3 أو أكتر"].map((label,i)=><div key={label} className="border border-neutral-300 p-3 text-center rounded"><p className="text-xs">{label}</p><p className="font-black text-xl text-[#CF252B]">{rates?rates.friends[i]+"%":"—"}</p></div>)}</div>
            <p className="border-t border-neutral-400 pt-4 text-sm leading-relaxed">العرض مرة واحدة للعميل. الدعوات تتأكد بعد إتمام أول زيارة للصاحب. إجمالي الخصم لا يتجاوز 100%. الخصم النهائي بعد التحقق في الفرع.</p>
          </section>
        </div>
        <div id="december-register" className="mt-12 max-w-2xl mx-auto scroll-mt-8"><DecemberRegistrationForm enabled={registrationEnabled} initialReferral={initialReferral} suggestions={suggestions}/>{registrationEnabled&&<div className="mt-6"><DecemberMyExam rates={rates!}/></div>}</div>
        <section className="mt-12 border-t border-neutral-700 pt-8 max-w-2xl mx-auto space-y-4"><h2 className="font-bold text-2xl">جاهز لزيارتك؟</h2><p className="text-neutral-300">سجل أولًا، وخلي صحابك يستخدموا لينك دعوتك. احجز من نظام الحجز الحالي أو زور الفرع. الحجز وحده مش تأكيد للخصم.</p><div className="flex gap-3 flex-wrap"><Link href="/book" className="rounded bg-[#F2F0E9] text-[#0C0C0C] px-5 py-3 font-bold">احجز زيارتك</Link><Link href="/club" className="border rounded px-5 py-3">CUT CLUB</Link><Link href="/offers/december/terms" className="underline px-2 py-3">الشروط</Link></div></section>
      </div>
    </main>
  );
}
