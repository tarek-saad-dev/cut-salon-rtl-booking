import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DecemberRegistrationForm from "./DecemberRegistrationForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"امتحان ديسمبر", robots:{index:false,follow:false}};

/** Internal preview only. Public registration is deliberately unavailable until the POS contract is live. */
export default function DecemberExamPreview() {
  if (process.env.DECEMBER_EXAM_PREVIEW !== "true") notFound();
  const registrationEnabled=process.env.DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED==="true";
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
            <p className="mt-8 text-sm border border-neutral-700 rounded-lg p-4" role="status">معاينة داخلية — الحملة لم تُطلق للعملاء بعد.</p>
          </section>
          <section className="bg-[#F2F0E9] text-[#0C0C0C] rounded-sm p-6 md:p-9 shadow-xl">
            <header className="flex items-center justify-between border-b border-neutral-400 pb-5">
              <h2 className="font-bold text-xl">ورقة الامتحان</h2><span dir="ltr" className="text-[#CF252B] font-bold">DEC / 26</span>
            </header>
            <ol className="divide-y divide-neutral-300">
              {["دي أول زيارة ليك؟","إنت طالب؟","عضو في CUT CLUB؟","هتعمل خدمتين أو أكتر؟","هتجيب كام صاحب جديد؟"].map((label,i)=>(
                <li key={label} className="py-5 flex items-center gap-4">
                  <span aria-hidden="true" className="text-[#CF252B] font-mono">0{i+1}</span>
                  <span className="font-semibold">{label}</span>
                </li>
              ))}
            </ol>
            <p className="border-t border-neutral-400 pt-4 text-sm leading-relaxed">العرض مرة واحدة للعميل. الدعوات تتأكد بعد إتمام أول زيارة للصاحب. النسب تُعرض بعد اعتماد الحملة.</p>
          </section>
        </div>
        <div className="mt-12 max-w-2xl mx-auto"><DecemberRegistrationForm enabled={registrationEnabled}/></div>
      </div>
    </main>
  );
}
