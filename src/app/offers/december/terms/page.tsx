import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'شروط امتحان ديسمبر',robots:{index:false,follow:false}};
export default function DecemberTerms(){
 if(process.env.DECEMBER_EXAM_PREVIEW!=='true')notFound();
 return <main dir="rtl" className="min-h-screen bg-[#0C0C0C] text-[#F2F0E9] px-5 py-12"><article className="max-w-2xl mx-auto bg-[#F2F0E9] text-[#0C0C0C] p-6 md:p-10 rounded space-y-5">
 <p className="font-bold text-[#CF252B] text-sm">CUT / DECEMBER EXAM — معاينة داخلية</p><h1 className="text-3xl font-black">شروط امتحان ديسمبر</h1>
 <p>العرض خلال مدة الحملة المفعلة، في الفروع المشاركة، للطلاب وغير الطلاب. النسب والخدمات تخضع للإعدادات المعتمدة قبل الإطلاق.</p>
 <ul className="list-disc ps-5 space-y-3">
 <li>يُستخدم العرض مرة واحدة لكل عميل في CUT SALON، وليس مرة لكل فرع.</li>
 <li>التسجيل لا يحتاج OTP للحملة؛ يتم التحقق من الهوية ورقم الموبايل عند الاستقبال. تسجيل CUT CLUB منفصل.</li>
 <li>خصم الطالب يتطلب بيانات المؤسسة التعليمية وإظهار كارنيه ساري في الفرع.</li>
 <li>خصم CUT CLUB يتطلب عضوية فعالة مرتبطة ببيانات العميل.</li>
 <li>الصاحب المدعو يجب أن يكون جديدًا على CUT ويستخدم كود الدعوة قبل أول زيارة مؤهلة. التسجيل وحده لا يؤكد الدعوة؛ تتأكد بعد إتمام فاتورة مدفوعة مؤهلة.</li>
 <li>يُحتسب أعلى مستوى دعوات مستحق فقط، ومجموع الخصومات لا يتجاوز 100%.</li>
 <li>الخصم على حلاقة الشعر والدقن فقط، بما فيها حلاقة الفيد والقصة الاحترافية وخدمة الشعر والدقن المشتركة. المنتجات والعلاجات والصبغات والخدمات الإضافية غير مشمولة. لا يُجمع العرض مع خصومات أخرى.</li>
 <li>خصم الخدمتين يُحتسب لخدمتين مؤهلتين مختلفتين، والخدمة المشتركة تُعد خدمة واحدة.</li>
 <li>النتيجة الظاهرة قبل الزيارة تقديرية. الخصم النهائي بعد مراجعة الشروط وحفظ الفاتورة.</li>
 <li>التقييم على Google اختياري ولا يؤثر على الاستحقاق.</li>
 <li>الموافقة على الرسائل التسويقية اختيارية ومنفصلة عن التسجيل.</li>
 </ul><p className="text-sm">هذه الشروط للمعاينة؛ لا تمثل تفعيلًا للحملة أو وعدًا بتطبيق خصم قبل اكتمال الاعتماد.</p>
 <Link href="/offers/december" className="inline-block rounded bg-[#CF252B] px-4 py-3 text-white font-bold">العودة للامتحان</Link>
 </article></main>;
}
