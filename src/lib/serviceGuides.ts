export const serviceGuides = {
  haircut: {
    ar: "قص الشعر للرجال في الإسكندرية", en: "Men’s haircuts in Alexandria",
    introAr: "ابدأ باختيار القصة التي تناسب طول شعرك وطريقة تصفيفه اليومية. أحضر صورة مرجعية ووضّح الطول الذي تريد الاحتفاظ به، خاصة عند الجوانب ومقدمة الرأس. راجع اسم الخدمة في قائمة الفرع قبل الحجز؛ لا تفترض أن الغسيل أو التصفيف مشمولان ما لم يذكرهما وصف الخدمة.",
    introEn: "Choose a cut around your current length and daily styling routine. Bring a reference photo and explain how much length you want to keep, especially at the sides and front. Check the branch’s service name before booking; wash and styling are included only when the service description says so.",
    questionAr: "كيف أختار خدمة قص الشعر؟", questionEn: "How do I choose a haircut service?",
    answerAr: "قارن أسماء الخدمات المتاحة في الفرع أدناه. إذا كنت تريد تغييرًا كبيرًا، ناقش الطول والشكل المطلوبين مع الحلاق قبل البدء. خدمة الشعر والذقن المجمعة تختلف عن قص الشعر وحده؛ راجع اختيارك في الحجز.",
    answerEn: "Compare the services listed for your branch below. For a major change, discuss the desired length and shape with your barber before starting. A combined hair and beard service differs from a haircut alone; check your selection when booking.",
  },
  beard: {
    ar: "حلاقة وتهذيب اللحية في الإسكندرية", en: "Beard grooming in Alexandria",
    introAr: "حدّد أولًا هل تريد الاحتفاظ بطول اللحية مع تهذيب شكلها أم حلاقتها. وضّح شكل حدود الخد والرقبة الذي تفضله قبل البدء. أسماء الخدمات قد تشمل الشعر والذقن معًا؛ القائمة التالية تعرض ما يذكر اللحية في كتالوج الفرع، وليس وعدًا بتقنية أو منتجات بعينها.",
    introEn: "Decide whether you want to keep your beard length and tidy its shape or have it shaved. Explain your preferred cheek and neckline before starting. Some services combine hair and beard grooming; the list below shows branch catalog entries mentioning beards, without promising particular products or techniques.",
    questionAr: "هل خدمة اللحية تشمل قص الشعر؟", questionEn: "Does a beard service include a haircut?",
    answerAr: "راجع اسم الخدمة: اختر خدمة مجمعة فقط إذا كانت تذكر الشعر والذقن معًا. إذا كنت تريد الحفاظ على طول اللحية، أخبر الحلاق بذلك بوضوح بدل الاكتفاء بطلب حلاقة عامة.",
    answerEn: "Check the service name: choose a combined service only when it explicitly mentions both hair and beard. If keeping your beard length matters, explain that to your barber rather than requesting a general shave.",
  },
} as const;
export type ServiceGuideKey = keyof typeof serviceGuides;
export function matchesGuide(key: ServiceGuideKey, name: string) {
  return (key === "haircut" ? /hair\s*cut|قص\s*(?:ال)?شعر|حلاقة\s*(?:ال)?شعر/i : /beard|لحي|ذقن|دقن/i).test(name);
}
