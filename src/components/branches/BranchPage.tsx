import Link from "next/link";
import { type Branch, branchSchema, serializeBranchSchema } from "@/lib/branches";

const linkStyle = "inline-flex min-h-12 items-center rounded-lg border border-cut-bronze/40 px-5 py-3 text-cut-warm-beige hover:bg-cut-bronze/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cut-bronze";

export default function BranchPage({ branch, other }: { branch: Branch; other: Branch }) {
  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-cut-black text-cut-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeBranchSchema(branchSchema(branch)) }} />
      <div className="container max-w-4xl px-5 py-8 md:py-16">
        <nav aria-label="مسار الصفحة" className="mb-12 flex flex-wrap gap-3 text-cut-warm-beige">
          <Link href="/" className={linkStyle}>CUT Salon — الرئيسية</Link>
          <Link href="/prices" className={linkStyle}>الخدمات والأسعار</Link>
        </nav>
        <header className="border-b border-cut-bronze/25 pb-12">
          <p lang="en" className="mb-4 tracking-widest text-cut-bronze">{branch.englishName} · Alexandria</p>
          <h1 className="font-heading text-3xl font-bold leading-relaxed md:text-5xl">CUT Salon — حلاق {branch.name} بالإسكندرية</h1>
          <p className="mt-6 text-lg leading-loose text-cut-ivory/80">{branch.intro}</p>
          <Link href="/book" className={`${linkStyle} mt-6`}>احجز زيارة لفرع {branch.name}</Link>
          <p className="mt-3 leading-loose text-cut-ivory/70">اختر فرع {branch.name} داخل صفحة الحجز.</p>
        </header>
        <section aria-labelledby="location" className="py-10">
          <h2 id="location" className="text-2xl font-bold text-cut-warm-beige">الوصول إلى فرع {branch.name}</h2>
          <address className="mt-4 not-italic leading-loose">{branch.address}</address>
          <p className="my-5 leading-loose text-cut-ivory/80">{branch.visit}</p>
          <a href={branch.map} className={linkStyle}>موقع فرع {branch.name} على الخريطة</a>
        </section>
        <section aria-labelledby="services" className="border-t border-cut-bronze/25 py-10">
          <h2 id="services" className="text-2xl font-bold text-cut-warm-beige">الشعر واللحية — جهّز لزيارتك</h2>
          <p className="my-5 leading-loose text-cut-ivory/80">من قصات الشعر الحديثة إلى العناية باللحية، اختَر الخدمة التي تناسب روتينك. راجع قائمة الخدمات والأسعار، وتحقق من الخيارات المتاحة أثناء الحجز قبل تأكيد موعدك.</p>
          <Link href="/prices" className={linkStyle}>تصفح الخدمات والأسعار</Link>
          <h2 className="mt-8 text-2xl font-bold text-cut-warm-beige">كيف تحجز في {branch.name}؟</h2>
          <p className="my-5 leading-loose text-cut-ivory/80">{branch.booking}</p>
          <Link href="/book" className={linkStyle}>ابدأ الحجز واختر الفرع</Link>
        </section>
        <section aria-labelledby="contact" className="border-t border-cut-bronze/25 py-10">
          <h2 id="contact" className="text-2xl font-bold text-cut-warm-beige">تواصل مع CUT Salon</h2>
          <p className="my-5 leading-loose">رقم التواصل المركزي للفرعين للاستفسارات والمساعدة في الحجز والوصول: <bdi>+20 101 212 6899</bdi></p>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+201012126899" className={linkStyle}>اتصل بالرقم المركزي</a>
            <a href="https://wa.me/201012126899" className={linkStyle}>واتساب CUT المركزي</a>
          </div>
        </section>
        <nav aria-label="الفرع الآخر" className="border-t border-cut-bronze/25 pt-8">
          <Link href={other.path} className={linkStyle}>تعرّف على فرع {other.name}</Link>
        </nav>
      </div>
    </main>
  );
}
