import type { LocalizedText } from "./types";

/**
 * Landing / home copy — one Arabic-first UI, English via localization.
 * Do not fork layouts for language; only strings + document dir change.
 */
export const landingCopy = {
  hero: {
    ariaLabel: { ar: "القسم الرئيسي", en: "Hero" },
    issueLabel: { ar: "THE CUT ISSUE", en: "THE CUT ISSUE" },
    brandMeta: { ar: "CUT SALON", en: "CUT SALON" },
    locationTrust: {
      ar: "بنخدم الإسكندرية من فرعين · جليم · كامب شيزار",
      en: "Now serving Alexandria from 2 locations · Gleem · Camp Caesar",
    },
    locationNew: { ar: "جديد", en: "NEW" },
    title: { ar: "خليك مختلف", en: "Define the CUT" },
    body: {
      ar: "اختار الحلاق، احجز في ثوانٍ، وادخل Cut Salon بتجربة رجالية فاخرة — حادة، واثقة، ومبنية على التفاصيل.",
      en: "Experience refined grooming at CUT Salon — from precision haircuts and beard detailing to complete preparation for your biggest occasions.",
    },
    bookNow: { ar: "احجز الآن", en: "Book Now" },
    nearestSlot: { ar: "أقرب ميعاد متاح", en: "Nearest available slot" },
    hint: {
      ar: "اختار الخدمة لمعرفة أقرب ميعاد",
      en: "Choose a service to see the nearest slot",
    },
    pillProsTitle: { ar: "حلاقين محترفين", en: "Expert barbers" },
    pillProsSub: { ar: "معايير عالية", en: "High standards" },
    pillLuxuryTitle: { ar: "تجربة فاخرة", en: "Luxury experience" },
    pillLuxurySub: { ar: "أناقة وراحة", en: "Style & comfort" },
    pillTimingTitle: { ar: "مواعيد دقيقة", en: "On-time visits" },
    pillTimingSub: { ar: "حجز سريع", en: "Fast booking" },
    barbersStripAria: { ar: "حلاقين متاحين", en: "Available barbers" },
    barberRole: { ar: "حلاق محترف", en: "Professional barber" },
  },
  services: {
    watermark: { ar: "الخدمات", en: "SERVICES" },
    eyebrow: { ar: "THE SERVICE EDIT", en: "THE SERVICE EDIT" },
    title: { ar: "مصممة لكل تفصيلة.", en: "Crafted for every detail." },
    body: {
      ar: "استكشف خدمات مبنية حول ستايلك وروتينك ومناسباتك.",
      en: "Explore services designed around your style, routine and occasion.",
    },
    cardEyebrow: { ar: "CUT SALON SERVICES", en: "CUT SALON SERVICES" },
    fallbackCategory: { ar: "العناية", en: "Grooming" },
    serviceOne: { ar: "خدمة متاحة", en: "available service" },
    serviceMany: { ar: "خدمات متاحة", en: "available services" },
    fromPrice: { ar: "يبدأ من", en: "from" },
    currency: { ar: "ج.م", en: "EGP" },
    explore: { ar: "استكشف الخدمات", en: "Explore services" },
    groomEyebrow: { ar: "THE GROOM EDIT", en: "THE GROOM EDIT" },
    groomTitle: { ar: "باقات العريس", en: "Groom packages" },
    groomBody: {
      ar: "تجارب تجهيز ليوم الزفاف، مصممة حول التفاصيل اللي تهمك.",
      en: "Wedding-day grooming experiences designed around the details that matter.",
    },
    explorePackages: { ar: "استكشف الباقات", en: "Explore packages" },
  },
  barbers: {
    teamLabel: { ar: "فريقنا", en: "Our team" },
    titleLead: { ar: "اختَر ", en: "Choose " },
    titleAccent: { ar: "حلاقك المفضل", en: "your preferred barber" },
    nearestCta: { ar: "اختار أقرب ميعاد", en: "Find nearest slot" },
    nearestBadge: { ar: "أسرع", en: "Fastest" },
    browseCaption: {
      ar: "أو تصفّح مواعيد الحلاقين المتاحة",
      en: "Or browse available barber times",
    },
    retry: { ar: "إعادة المحاولة", en: "Try again" },
    onlineUnavailableForBarber: {
      ar: "الحجز الإلكتروني غير متاح لهذا الحلاق",
      en: "Online booking is not available for this barber",
    },
    professionalRole: { ar: "حلاق محترف", en: "Professional barber" },
    location: { ar: "Cut Salon · الإسكندرية", en: "CUT Salon · Alexandria" },
    bookWith: { ar: "احجز مع", en: "Book with" },
    nearestName: { ar: "أقرب حلاق متاح", en: "Nearest available barber" },
    nearestButton: { ar: "احجز أقرب ميعاد", en: "Book nearest slot" },
    bookingClosedDefault: {
      ar: "الحجز غير متاح اليوم. برجاء اتصل أو احجز عبر الواتساب",
      en: "Booking is unavailable today. Please call or book via WhatsApp.",
    },
    bookingStatusError: {
      ar: "تعذر التحقق من حالة الحجز",
      en: "Could not verify booking status",
    },
    noBarbers: {
      ar: "لا يوجد حلاقون متاحون للحجز الإلكتروني حالياً",
      en: "No barbers are available for online booking right now",
    },
    loadError: {
      ar: "تعذر تحميل قائمة الحلاقين، حاول مرة أخرى",
      en: "Could not load barbers. Please try again.",
    },
    closedEyebrow: { ar: "CUT SALON / BOOKING", en: "CUT SALON / BOOKING" },
    closedTitle: {
      ar: "الحجز الإلكتروني غير متاح حاليًا",
      en: "Online booking is temporarily unavailable",
    },
    callToBook: { ar: "اتصل للحجز", en: "Call to book" },
  },
  cta: {
    eyebrow: { ar: "تواصل معنا", en: "Contact us" },
    title: { ar: "كلّمنا مباشرة", en: "Call us directly" },
    body: {
      ar: "للتأكيد أو الاستفسار — اتصل بالخط الأرضي أو الموبايل، أو راسلنا على واتساب.",
      en: "For confirmation or questions — call the landline or mobile, or message us on WhatsApp.",
    },
    landlineLabel: { ar: "الخط الأرضي", en: "Landline" },
    mobileLabel: { ar: "الموبايل", en: "Mobile" },
    whatsappLabel: { ar: "واتساب", en: "WhatsApp" },
    landlineDisplay: { ar: "03 5861483", en: "03 5861483" },
    mobileDisplay: { ar: "0101 212 6899", en: "0101 212 6899" },
  },
  benefits: {
    eyebrow: { ar: "لماذا Cut Salon؟", en: "Why Cut Salon?" },
    titleBefore: { ar: "ليه تختار ", en: "Why choose " },
    titleAccent: { ar: "Cut Salon؟", en: "Cut Salon?" },
    items: [
      {
        title: { ar: "حجز سريع", en: "Fast booking" },
        desc: {
          ar: "احجز موعدك خلال ثوانٍ من موبايلك.",
          en: "Book your appointment in seconds from your phone.",
        },
      },
      {
        title: { ar: "اختيار الحلاق", en: "Choose your barber" },
        desc: {
          ar: "اختَر الحلاق اللي تفضله بسهولة.",
          en: "Easily pick the barber you prefer.",
        },
      },
      {
        title: { ar: "تنظيم المواعيد", en: "Organized schedule" },
        desc: {
          ar: "نظام حجز يساعد على تقليل الزحام.",
          en: "A booking system that helps reduce waiting and crowding.",
        },
      },
      {
        title: { ar: "تجربة احترافية", en: "Professional experience" },
        desc: {
          ar: "خدمة مميزة وجودة عالية كل زيارة.",
          en: "Premium service and consistent quality every visit.",
        },
      },
    ] as const,
  },
  howItWorks: {
    eyebrow: { ar: "خطوات الحجز", en: "Booking steps" },
    titleBefore: { ar: "كيف ", en: "How to " },
    titleAccent: { ar: "تحجز؟", en: "book?" },
    stepLabel: { ar: "الخطوة", en: "Step" },
    steps: [
      {
        number: { ar: "١", en: "01" },
        title: { ar: "اختَر الحلاق", en: "Choose your barber" },
        desc: {
          ar: "تصفّح فريقنا واختَر الحلاق المناسب لك.",
          en: "Browse our team and pick the right barber for you.",
        },
      },
      {
        number: { ar: "٢", en: "02" },
        title: { ar: "اختَر الميعاد", en: "Pick a time" },
        desc: {
          ar: "اختَر اليوم والوقت المناسب.",
          en: "Choose the day and time that suits you.",
        },
      },
      {
        number: { ar: "٣", en: "03" },
        title: { ar: "أكد الحجز", en: "Confirm" },
        desc: {
          ar: "استلم تأكيد حجزك فوراً.",
          en: "Get your booking confirmation instantly.",
        },
      },
    ] as const,
    waitNoteBefore: {
      ar: "عند حضورك في الموعد قد يكون هناك انتظار بسيط من ",
      en: "When you arrive for your appointment there may be a short wait of ",
    },
    waitNoteAccent: { ar: "1 إلى 10 دقائق", en: "1 to 10 minutes" },
    waitNoteAfter: {
      ar: " كحد أقصى حتى يبدأ دورك.",
      en: " at most before your turn begins.",
    },
  },
  footer: {
    about: {
      ar: "صالون رجالي متخصص في قصات الشعر الحديثة والعناية باللحية، مع نظام حجز مسبق لتقديم تجربة أفضل.",
      en: "A men’s salon specializing in modern haircuts and beard care, with advance booking for a better experience.",
    },
    contactTitle: { ar: "تواصل معنا", en: "Contact us" },
    phoneLabel: { ar: "الهاتف / واتساب", en: "Phone / WhatsApp" },
    branchesTitle: { ar: "الفروع", en: "Branches" },
    branchName: { ar: "فرع جليم – سابا باشا", en: "Gleem branch — Saba Pasha" },
    branchAddress: {
      ar: "يسرى قمحة، فلمنج، قسم أول الرمل، الإسكندرية",
      en: "Yousry Kamha, Fleming, El Raml 1st, Alexandria",
    },
    campBranchName: { ar: "فرع كامب شيزار", en: "Camp Caesar branch" },
    campBranchAddress: {
      ar: "كامب شيزار، الإسكندرية — أحدث فروع CUT",
      en: "Camp Caesar, Alexandria — CUT’s newest home",
    },
    campOpeningBadge: { ar: "افتتاح جديد", en: "Grand opening" },
    campOpeningStatus: { ar: "مفتوح الآن", en: "Now open" },
    campOpeningOffer: {
      ar: "خصم 50% على كل الخدمات في زيارتك الأولى",
      en: "50% off every service on your first visit",
    },
    campBookCta: { ar: "احجز في كامب شيزار", en: "Book Camp Caesar" },
    mapLink: { ar: "الموقع على الخريطة", en: "View on map" },
    rights: {
      ar: "جميع الحقوق محفوظة.",
      en: "All rights reserved.",
    },
  },
} as const satisfies Record<string, unknown>;

export type LandingHeroKey = keyof typeof landingCopy.hero;

/** Type helper for LocalizedText entries in landing copy. */
export type LandingLocalized = LocalizedText;
