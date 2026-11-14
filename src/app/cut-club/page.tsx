import Image from "next/image";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata("/cut-club", "CUT CLUB | تعرّف على برنامج الولاء في CUT Salon", "دليلك إلى CUT CLUB: هوية العضو والنقاط ومستويات الولاء وكيف تتعرّف على شروط المكافآت. اكتشف الفكرة، راجع الأسعار واحجز زيارتك إلى CUT Salon.");

const concepts = [
  { title: "هوية العضو", eyebrow: "IDENTITY", text: "ملف الولاء يربط العضوية بسجل الزيارات. هوية العضو تساعد على تنظيم التجربة؛ وليست بطاقة دفع أو اشتراكًا مدفوعًا." },
  { title: "النقاط", eyebrow: "POINTS", text: "يسجّل نظام الولاء نقاطًا وفق قواعد البرنامج والعمليات المؤهلة. النقاط ليست نقودًا، ولا نعلن هنا معدل اكتساب أو قيمة استبدال ثابتة." },
  { title: "المستوى", eyebrow: "TIER", text: "مستوى الولاء يعبّر عن التقدّم داخل البرنامج. الوصول إلى مستوى لا يعني الحصول تلقائيًا على كل المكافآت؛ لكل مكافأة شروطها." },
];

const journey = [
  { title: "اختار زيارتك", text: "ابدأ بالخدمات والأسعار، ثم احجز الموعد والفرع المناسبين لك. الحجز متاح دون اشتراط عضوية النادي." },
  { title: "افهم احتساب الزيارة", text: "بعد إتمام الخدمة وتسجيلها، تُحتسب العمليات المؤهلة حسب قواعد الولاء. الحجز وحده لا يعني إضافة نقاط." },
  { title: "اسأل عن المكافأة المناسبة", text: "راجع مع فريق الفرع المكافآت المتاحة وشروط الأهلية قبل اختيارها، بما فيها النقاط المطلوبة وأي حدود للاستخدام." },
];

const faqs = [
  { question: "هل أحتاج عضوية لحجز موعد أو معرفة الأسعار؟", answer: "لا. يمكنك الاطّلاع على الأسعار وحجز زيارتك مباشرة من الموقع دون اشتراط عضوية CUT CLUB." },
  { question: "هل كل زيارة تمنحني مكافأة؟", answer: "لا تضمن كل زيارة نقاطًا أو مكافأة بعينها. الاحتساب مرتبط بالعمليات المؤهلة وقواعد البرنامج، وإتاحة المكافأة تعتمد على شروطها." },
  { question: "كيف أعرف المكافآت المتاحة لي؟", answer: "اسأل فريق الفرع عن المكافآت وشروطها الحالية: النقاط المطلوبة، المستوى إن كان شرطًا، الصلاحية والفروع المشاركة. هذه الصفحة دليل عام وليست قائمة مكافآت شخصية." },
  { question: "هل النقاط رصيد نقدي أو خصم ثابت؟", answer: "النقاط وسيلة ضمن برنامج الولاء، وليست رصيدًا نقديًا. لا توجد في هذه الصفحة وعود بسعر للنقطة أو خصم ثابت أو خدمة مجانية مضمونة." },
  { question: "هل أستطيع إدارة حسابي من هذه الصفحة؟", answer: "هذه صفحة تعريفية عامة لا تعرض رصيدًا شخصيًا ولا تتيح استبدال مكافآت أو تعديل بيانات. تجربة العضو الخاصة مرحلة لاحقة تتطلب تسجيل دخول موثّقًا وحماية الوصول إلى الحساب." },
];

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-warm-beige focus-visible:ring-offset-4 focus-visible:ring-offset-cut-burgundy-dark";

export default function CutClubPage() {
  return (
    <main lang="ar" dir="rtl" className="bg-cut-wine-black pb-28 font-body text-cut-ivory lg:pb-0">
      <section aria-labelledby="club-title" className="overflow-hidden border-b border-cut-bronze/30 bg-gradient-to-bl from-cut-burgundy via-cut-burgundy-dark to-cut-wine-black">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <p lang="en" dir="ltr" className="mb-6 text-start font-brand text-sm tracking-[0.3em] text-cut-warm-beige">CUT CLUB / THE LOYALTY EDIT</p>
            <h1 id="club-title" className="font-display font-laxr text-4xl leading-[1.5] sm:text-5xl lg:text-6xl">CUT CLUB،<br />علاقتك بـ CUT<br /><span className="text-cut-warm-beige">أبعد من زيارة.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-cut-soft-ivory">تعرّف على برنامج الولاء في CUT Salon: هوية تجمع زياراتك، ونقاط ومستويات تساعدك على فهم رحلتك مع النادي، ومكافآت تخضع لشروط واضحة.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/book" className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-cut-ivory px-7 py-3 font-bold text-cut-burgundy hover:bg-cut-warm-paper ${focus}`}>احجز زيارتك</a>
              <a href="/prices" className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-cut-warm-beige px-7 py-3 font-bold text-cut-ivory hover:bg-cut-ivory/10 ${focus}`}>اكتشف الأسعار</a>
            </div>
            <a href="#rewards" className={`mt-6 inline-flex min-h-11 items-center text-sm text-cut-warm-beige underline underline-offset-8 ${focus}`}>كيف أكتشف المكافآت؟</a>
          </div>
          <figure className="min-w-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-[5rem] border border-cut-bronze/40 sm:rounded-t-[7rem]">
              <Image src="/hero.png" alt="حلاق يعتني بقصّة شعر عميل داخل صالون CUT" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-cut-warm-beige"><span>العناية تبدأ من تفاصيل الزيارة.</span><span lang="en" dir="ltr" className="tracking-[0.15em]">CUT SALON · ALEXANDRIA</span></figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="about-club" className="bg-cut-ivory px-6 py-16 text-cut-burgundy-dark md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-bold">الفكرة ببساطة</p>
          <h2 id="about-club" className="font-display font-laxr text-3xl leading-relaxed md:text-4xl">ما هو CUT CLUB؟</h2>
          <p className="mt-5 max-w-3xl text-base leading-8">CUT CLUB هو برنامج الولاء الخاص بـ CUT Salon. فكرته تنظيم العلاقة بين العضو وزياراته ومكافآته، بدل النظر إلى كل زيارة بمعزل عن الأخرى. إليك المفاهيم الأساسية قبل أن تختار مكافأة.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {concepts.map(({ title, eyebrow, text }) => (
              <article key={eyebrow} className="border-t border-cut-bronze pt-6">
                <p lang="en" dir="ltr" className="text-start text-xs font-bold tracking-[0.2em]">{eyebrow}</p>
                <h3 className="mt-3 text-xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-8">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="journey-title" className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div><p className="mb-3 text-sm text-cut-warm-beige">من الزيارة إلى المكافأة</p><h2 id="journey-title" className="font-display font-laxr text-3xl leading-relaxed md:text-4xl">رحلتك، خطوة بخطوة.</h2><p className="mt-5 text-sm leading-8 text-cut-soft-ivory">قيمة النادي في وضوح التجربة: تعرف ما الذي تسأل عنه، وما الشروط التي تراجعها.</p></div>
          <ol aria-label="رحلتك مع CUT CLUB" className="space-y-8">
            {journey.map(({ title, text }, index) => (
              <li key={title} className="flex gap-5 border-b border-cut-bronze/30 pb-8">
                <span aria-hidden="true" className="pt-1 font-editorial text-3xl text-cut-warm-beige">0{index + 1}</span>
                <div className="min-w-0"><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-8 text-cut-soft-ivory">{text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="rewards" aria-labelledby="rewards-title" className="scroll-mt-28 border-y border-cut-bronze/30 bg-cut-burgundy-dark px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:gap-16">
          <div><p className="mb-3 text-sm text-cut-warm-beige">مزايا مفهومة، واختيار واعٍ</p><h2 id="rewards-title" className="font-display font-laxr text-3xl leading-relaxed md:text-4xl">اكتشف المكافآت<br />واعرف شروطها أولًا.</h2></div>
          <div className="space-y-5 text-base leading-8 text-cut-soft-ivory">
            <p>اسأل فريق الفرع عن المكافآت المتاحة حاليًا وشروط كل مكافأة. تحقّق من النقاط المطلوبة، وأهلية المستوى، ومدة الصلاحية والفروع المشاركة وأي قيود على الجمع مع عروض أخرى قبل الاستخدام.</p>
            <p>لا نعرض هنا كتالوجًا شخصيًا أو نعد بمكافأة محددة. تفاصيل الإتاحة والاحتساب تُراجع وفق قواعد البرنامج وسجل العمليات، وقد تختلف من مكافأة إلى أخرى.</p>
            <p className="border-s-2 border-cut-bronze ps-5 text-sm">هذه الصفحة للتعرّف على النادي فقط. لا تحتاج إلى إدخال رقم هاتفك أو مشاركة بياناتك لاستكشاف الفكرة.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <h2 id="faq-title" className="mb-8 font-display font-laxr text-3xl leading-relaxed md:text-4xl">أسئلة قبل أول خطوة</h2>
        {faqs.map(({ question, answer }) => (
          <details key={question} className="border-b border-cut-bronze/40 py-2">
            <summary className={`cursor-pointer rounded-lg py-5 pe-3 text-base font-bold leading-8 ${focus}`}>{question}</summary>
            <p className="pb-6 text-sm leading-8 text-cut-soft-ivory">{answer}</p>
          </details>
        ))}
      </section>
      <section aria-labelledby="visit-title" className="bg-cut-ivory px-6 py-14 text-center text-cut-burgundy-dark md:py-20">
        <h2 id="visit-title" className="font-display font-laxr text-3xl leading-relaxed md:text-4xl">ابدأ بزيارة على ذوقك.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-8">اختار الخدمة المناسبة، راجع الأسعار، وحدد موعدك. وفريق الفرع يساعدك تفهم تفاصيل الولاء.</p>
        <a href="/book" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-cut-burgundy px-8 py-3 font-bold text-cut-ivory hover:bg-cut-burgundy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy focus-visible:ring-offset-4 focus-visible:ring-offset-cut-ivory">احجز موعدك في CUT</a>
      </section>
    </main>
  );
}
