import { CANONICAL_ORIGIN } from "@/lib/seo";

export const branches = {
  gleem: {
    path: "/branches/gleem",
    name: "جليم – سابا باشا",
    englishName: "CUT Salon Gleem",
    title: "CUT Salon جليم – سابا باشا | حلاق جليم بالإسكندرية",
    description: "تعرّف على فرع CUT Salon جليم – سابا باشا بالإسكندرية: الموقع على الخريطة، قص الشعر والعناية باللحية، الأسعار وخطوات اختيار الفرع للحجز.",
    address: "جليم – سابا باشا، الإسكندرية، مصر",
    map: "https://share.google/F4o7oOQVs3EJSgxaw",
    intro: "لو بتدور على حلاق في جليم، تعرّف على فرع CUT Salon جليم – سابا باشا في الإسكندرية. خطّط لزيارتك لقص الشعر أو العناية باللحية، وراجع الأسعار قبل اختيار موعدك.",
    visit: "فرعنا في جليم – سابا باشا، الإسكندرية، مصر. افتح رابط خريطة الفرع لتحديد وجهتك، ولأي استفسار عن الوصول تواصل مع رقم CUT المركزي قبل الزيارة.",
    booking: "لزيارة فرع جليم – سابا باشا، افتح الحجز واختر فرع جليم، ثم الخدمة والحلاق والموعد المناسب من الخيارات المتاحة. تأكد من اسم الفرع عند مراجعة حجزك.",
  },
  campCaesar: {
    path: "/branches/camp-caesar",
    name: "كامب شيزار",
    englishName: "CUT Salon Camp Caesar",
    title: "CUT Salon كامب شيزار | حلاق كامب شيزار بالإسكندرية",
    description: "خطّط لزيارتك إلى CUT Salon كامب شيزار بالإسكندرية: خريطة الفرع، خدمات الشعر واللحية، رابط الأسعار والحجز والتواصل المركزي للاستفسار عن الوصول.",
    address: "كامب شيزار، الإسكندرية",
    map: "https://maps.app.goo.gl/217r3pLutcKFAW2x7",
    intro: "فرع CUT Salon كامب شيزار هو أحد فرعينا في الإسكندرية. إذا كنت تبحث عن حلاق في كامب شيزار لقص الشعر أو ترتيب اللحية، ابدأ بمراجعة الخدمات والأسعار ثم اختر هذا الفرع داخل الحجز.",
    visit: "فرعنا في كامب شيزار، الإسكندرية. استخدم خريطة كامب شيزار المرتبطة هنا للوصول إلى الفرع المقصود؛ وللاستفسار عن تفاصيل العنوان أو مواعيد العمل قبل التحرك، راسل رقم CUT المركزي.",
    booking: "اختَر كامب شيزار داخل صفحة الحجز قبل متابعة الخدمة والموعد، خصوصًا إذا كنت تقارن بين فرعينا. راجع الفرع المختار في تفاصيل الحجز حتى تكون زيارتك في المكان الذي تقصده.",
  },
} as const;

export type Branch = (typeof branches)[keyof typeof branches];

export function branchSchema(branch: Branch) {
  const url = new URL(branch.path, CANONICAL_ORIGIN).href;
  return {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    "@id": `${url}#barbershop`,
    url,
    name: `CUT Salon – ${branch.name}`,
    alternateName: branch.englishName,
    address: { "@type": "PostalAddress", addressLocality: "Alexandria", addressCountry: "EG" },
    hasMap: branch.map,
    parentOrganization: { "@type": "Organization", name: "CUT Salon", url: CANONICAL_ORIGIN },
  };
}

export function serializeBranchSchema(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
