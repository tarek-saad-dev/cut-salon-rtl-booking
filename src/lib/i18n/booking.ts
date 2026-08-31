import type { Language, LocalizedText } from "./types";

export type BookingMessageKey = string;

type Catalog = Record<string, LocalizedText>;

/** Nested booking UI catalog — flat dotted keys via `bookingMessages`. */
export const bookingCatalog = {
  steps: {
    appointment_scope: { ar: "طريقة عرض المواعيد", en: "Appointment options" },
    branch: { ar: "الفرع", en: "Branch" },
    mode: { ar: "طريقة الحجز", en: "Booking type" },
    service: { ar: "الخدمة", en: "Service" },
    date: { ar: "التاريخ", en: "Date" },
    time: { ar: "الوقت", en: "Time" },
    details: { ar: "بياناتك", en: "Your details" },
    review: { ar: "المراجعة", en: "Review" },
  },
  scope: {
    title: { ar: "طريقة عرض المواعيد", en: "Appointment options" },
    subtitle: {
      ar: "اختار كيف تحب تشوف مواعيد الحلاق",
      en: "Choose how you want to find this barber’s appointments",
    },
    allBranchesTitle: {
      ar: "أسرع مواعيد {name} في كل الفروع",
      en: "Fastest appointments with {name} across all branches",
    },
    allBranchesDesc: {
      ar: "هنعرض لك مواعيده المتاحة في جميع الفروع وتختار الوقت والمكان الأنسب لك.",
      en: "See this barber’s available appointments across every branch and choose the time and location that suit you.",
    },
    specificBranchTitle: {
      ar: "مواعيد {name} في فرع محدد",
      en: "{name}’s appointments at a specific branch",
    },
    specificBranchDesc: {
      ar: "اختار الفرع الأقرب ليك واعرض مواعيد الحلاق فيه فقط.",
      en: "Choose your preferred branch and view appointments available there only.",
    },
    legendGleem: { ar: "جليم", en: "Gleem" },
    legendCamp: { ar: "كامب شيزار", en: "Camp Caesar" },
    legendBoth: { ar: "متاح في الفرعين", en: "Available at both" },
  },
  actions: {
    back: { ar: "رجوع", en: "Back" },
    backToServices: { ar: "رجوع للخدمات", en: "Back to services" },
    backToDate: { ar: "رجوع للتاريخ", en: "Back to date" },
    continue: { ar: "متابعة", en: "Continue" },
    continueToReview: { ar: "متابعة للمراجعة", en: "Continue to review" },
    confirmBooking: { ar: "تأكيد الحجز", en: "Confirm booking" },
    editSelections: { ar: "تعديل الاختيارات", en: "Edit selections" },
    edit: { ar: "تعديل", en: "Edit" },
    retry: { ar: "إعادة المحاولة", en: "Retry" },
    safeRetry: { ar: "إعادة المحاولة الآمنة", en: "Safe retry" },
    close: { ar: "إغلاق", en: "Close" },
    doneThanks: { ar: "تم", en: "Done" },
    copy: { ar: "نسخ", en: "Copy" },
    copied: { ar: "تم النسخ", en: "Copied" },
    confirmBranchContinue: { ar: "تأكيد فرع {name} ومتابعة", en: "Confirm {name} and continue" },
    showNextDaySlots: { ar: "عرض مواعيد اليوم التالي", en: "Show next day’s slots" },
    switchToNearestBarber: { ar: "اختيار حلاق آخر بجودة عالية", en: "Choose another high-quality barber" },
    refreshSlots: { ar: "تحديث المواعيد", en: "Refresh slots" },
    changeBranch: { ar: "تغيير الفرع", en: "Change branch" },
    viewAllBranches: {
      ar: "عرض مواعيده في كل الفروع",
      en: "View appointments across all branches",
    },
  },
  header: {
    bookWith: { ar: "احجز مع {name}", en: "Book with {name}" },
    bookNearest: { ar: "أقرب موعد متاح", en: "Find the nearest available slot" },
    dialogDescription: {
      ar: "واجهة حجز موعد في Cut Salon: اختيار الفرع والخدمة والحلاق واليوم والساعة ثم المراجعة والتأكيد.",
      en: "Cut Salon booking: choose branch, service, barber, day and time, then review and confirm.",
    },
    closeAria: { ar: "إغلاق نافذة الحجز", en: "Close booking dialog" },
    professionalBarber: { ar: "حلاق محترف", en: "Professional barber" },
    nearestBarber: { ar: "أقرب حلاق متاح", en: "Nearest available barber" },
  },
  branch: {
    title: { ar: "في أي فرع تحب تحجز؟", en: "Which branch would you like?" },
    titleBarberFirst: { ar: "اختر الفرع الأنسب لك", en: "Choose the branch that suits you" },
    subtitle: { ar: "اختار الفرع الأقرب ليك", en: "Pick the nearest branch" },
    subtitleBarberFirst: { ar: "اختار فرعاً يعمل به هذا الحلاق", en: "Pick a branch where this barber works" },
    loadingSlow: {
      ar: "جارٍ تجهيز فروع {name}، قد يستغرق ذلك لحظات.",
      en: "Preparing {name}’s branches. This may take a moment.",
    },
    loadingShort: { ar: "جاري تحميل الفروع…", en: "Loading branches…" },
    loadFailedTitle: {
      ar: "تعذر تحميل فروع {name}",
      en: "Couldn’t load {name}’s branches",
    },
    loadFailedBody: {
      ar: "حاول مرة أخرى، أو ارجع لاختيار حلاق آخر.",
      en: "Try again, or go back and choose another barber.",
    },
    staleWarning: {
      ar: "تعذر تحديث بيانات الحلاق — نعرض آخر فروع محفوظة.",
      en: "Couldn’t refresh this barber — showing the last saved branches.",
    },
    scopeLoadingAria: {
      ar: "جاري تجهيز خيارات المواعيد",
      en: "Preparing appointment options",
    },
    branchLoadingAria: {
      ar: "جاري تجهيز قائمة الفروع",
      en: "Preparing branch list",
    },
    empty: { ar: "لا توجد فروع متاحة حاليًا", en: "No branches are currently available." },
    emptyForBarber: {
      ar: "لا توجد فروع عامة متاحة للحجز مع هذا الحلاق حالياً",
      en: "This barber has no public bookable branches right now",
    },
    chooseAnotherBarber: { ar: "اختيار حلاق آخر", en: "Choose another barber" },
    chooseAnotherBranch: { ar: "اختيار فرع آخر", en: "Choose another branch" },
    loading: { ar: "جاري تحميل الفروع...", en: "Loading branches…" },
    chipCamp: { ar: "كامب شيزار", en: "Camp Caesar" },
    chipGleem: { ar: "سابا باشا", en: "Saba Pasha" },
    label: { ar: "الفرع", en: "Branch" },
  },
  mode: {
    title: { ar: "تحب تحجز إزاي؟", en: "How would you like to book?" },
    subtitle: { ar: "اختار الطريقة اللي تناسبك", en: "Choose what works for you" },
    nearestTitle: { ar: "أقرب حلاق متاح", en: "Nearest available barber" },
    nearestDesc: {
      ar: "النظام يختارلك أقرب ميعاد حسب المتاح. لا نحدد حلاقاً من المتصفح.",
      en: "We’ll pick the soonest available slot. We don’t assign a barber in the browser.",
    },
    specificTitle: { ar: "اختيار الحلاق", en: "Choose a barber" },
    specificDesc: {
      ar: "لو عندك حلاق مفضل، اختاره واحجز معاه.",
      en: "Prefer someone specific? Pick them and book.",
    },
    pickBarber: { ar: "اختار الحلاق", en: "Choose a barber" },
    methodLabel: { ar: "طريقة الحجز", en: "Booking method" },
    chooseBarberShort: { ar: "اختيار حلاق", en: "Choose barber" },
  },
  service: {
    title: { ar: "اختر خدمتك الأساسية", en: "Choose your main service" },
    subtitle: { ar: "ابدأ بالخدمة الرئيسية المناسبة لك", en: "Start with the main service that fits you" },
    completeVisit: { ar: "كمّل تجربتك", en: "Complete your visit" },
    featuredHeading: { ar: "الخدمات المميزة", en: "Featured services" },
    moreServices: { ar: "خدمات أخرى", en: "More services" },
    allServicesHeading: { ar: "كل الخدمات", en: "All services" },
    otherChoices: { ar: "اختيارات أخرى", en: "Other choices" },
    otherServices: { ar: "خدمات أخرى", en: "Other services" },
    otherServicesHint: {
      ar: "اختار أي خدمة لوحدها أو ضيفها مع خدمتك الأساسية",
      en: "Book alone or add to your main service",
    },
    otherAddons: { ar: "إضافات أخرى", en: "Other add-ons" },
    addonsTitle: { ar: "إضافات ممكن تعجبك", en: "Add-ons you might like" },
    addonsHint: { ar: "اختيارات إضافية لتحسين التجربة", en: "Extra options to improve the experience" },
    empty: { ar: "لا توجد خدمات متاحة للحجز الآن", en: "No services available to book right now" },
    emptyForBarberBranch: {
      ar: "لا توجد خدمات متاحة لهذا الحلاق في هذا الفرع.",
      en: "No services are available for this barber at this branch.",
    },
    loadFailedTitle: { ar: "تعذر تحميل الخدمات.", en: "We couldn’t load the services." },
    loadFailedBody: { ar: "حاول مرة أخرى.", en: "Please try again." },
    selectedLabel: { ar: "تم الاختيار", en: "Selected" },
    countOne: { ar: "خدمة", en: "service" },
    countTwo: { ar: "خدمتان", en: "2 services" },
    countMany: { ar: "خدمات", en: "services" },
    cartTitle: { ar: "خدماتك", en: "Your visit" },
    cartView: { ar: "عرض السلة", en: "View cart" },
    cartHide: { ar: "إخفاء السلة", en: "Hide cart" },
    cartSubtotal: { ar: "الإجمالي", en: "Subtotal" },
    cartRemove: { ar: "إزالة", en: "Remove" },
    cartRemoveAria: { ar: "إزالة الخدمة من السلة", en: "Remove service from cart" },
    cartUpsellTitle: { ar: "زود تجربتك", en: "Add more to your visit" },
    cartUpsellHint: {
      ar: "ارجع لقائمة الخدمات واختار اللي يناسبك",
      en: "Go back to the services list and pick what you want",
    },
    cartAddAnother: { ar: "ضيف خدمة كمان", en: "Add another service" },
    cartAdd: { ar: "إضافة", en: "Add" },
    cartAddedToast: { ar: "تم إضافة {name} للسلة", en: "Added {name} to cart" },
    cartAddedToastShort: { ar: "تم الإضافة للسلة", en: "Added to cart" },
    cartContinue: { ar: "متابعة الحجز", en: "Continue booking" },
    chooseToContinue: { ar: "اختر خدمة للمتابعة", en: "Choose a service to continue" },
    nextStep: { ar: "التالي", en: "Next" },
    showMoreServices: { ar: "عرض باقي الخدمات", en: "Show more services" },
    cartItemsAria: { ar: "الخدمات المختارة", en: "Selected services" },
    filtersAria: { ar: "تصفية الخدمات", en: "Filter services" },
    filterPopular: { ar: "الأكثر طلبًا", en: "Most popular" },
    filterAll: { ar: "كل الخدمات", en: "All services" },
    filterHair: { ar: "حلاقة", en: "Hair" },
    filterBeard: { ar: "دقن", en: "Beard" },
    filterCare: { ar: "عناية", en: "Care" },
    filterPackages: { ar: "باكدجات", en: "Packages" },
    catSkincare: { ar: "عناية البشرة", en: "Skincare" },
    catMasks: { ar: "ماسكات", en: "Masks" },
    catHair: { ar: "شعر", en: "Hair" },
    catBeardFace: { ar: "دقن ووجه", en: "Beard & face" },
    catComfort: { ar: "راحة ولمسة نهائية", en: "Comfort & finish" },
    badgeMostRequested: { ar: "الأكثر طلبًا", en: "Most requested" },
    badgeFeaturedPackage: { ar: "باكدج مميز", en: "Featured package" },
    badgeBestValue: { ar: "أفضل قيمة", en: "Best value" },
    badgeQuickService: { ar: "خدمة سريعة", en: "Quick service" },
    badgeRecommended: { ar: "ينصح بها", en: "Recommended" },
    badgeCommonlyAdded: { ar: "تُضاف كثيرًا", en: "Commonly added" },
    badgeCompletesService: { ar: "تكمل الخدمة", en: "Completes the service" },
    badgePremiumExperience: { ar: "تجربة مميزة", en: "Premium experience" },
    badgeStrongCare: { ar: "عناية قوية", en: "Intensive care" },
    badgeQuickTouch: { ar: "لمسة سريعة", en: "Quick touch" },
    badgeComfortTouch: { ar: "لمسة راحة", en: "Comfort touch" },
  },
  date: {
    title: { ar: "اختر التاريخ", en: "Choose a date" },
    subtitle: { ar: "الأيام المتاحة للحجز مميزة بالأخضر", en: "Available days are highlighted in green" },
    empty: { ar: "لا توجد أيام متاحة حالياً", en: "No days available" },
    emptyHint: { ar: "جرب تغيير الخدمة أو الحلاق", en: "Try changing service or barber" },
    emptyForSelection: { ar: "لا توجد أيام متاحة حاليًا لهذه الاختيارات", en: "No days available for these choices" },
    loading: {
      ar: "جاري البحث عن الأيام المتاحة... قد يستغرق ذلك عدة ثوانٍ",
      en: "Looking for available days… this may take a few seconds",
    },
    nextMonth: { ar: "الشهر التالي", en: "Next month" },
    prevMonth: { ar: "الشهر السابق", en: "Previous month" },
    legendSelected: { ar: "المحدد", en: "Selected" },
    legendToday: { ar: "اليوم", en: "Today" },
    legendAvailable: { ar: "متاح", en: "Available" },
    legendUnavailable: { ar: "غير متاح", en: "Unavailable" },
    branchContext: {
      ar: "عرض مواعيد فرع {name}",
      en: "Showing appointments at {name}",
    },
  },
  time: {
    title: { ar: "اختر الوقت", en: "Choose a time" },
    subtitle: { ar: "اختر الوقت الأنسب لك — المواعيد المتاحة فقط", en: "Pick what works — available slots only" },
    empty: { ar: "لا توجد أوقات متاحة لهذا اليوم", en: "No times available for this day" },
    emptyNearestHint: {
      ar: "الحلاق مش متاح في اليوم ده، بس فيه حلاقين تانيين بجودة عالية في نفس اليوم",
      en: "This barber isn’t free that day, but other high-quality barbers are",
    },
    nearestFeatured: { ar: "أقرب ميعاد متاح", en: "Soonest available" },
    nearestFeaturedHint: { ar: "أسرع وقت يمكنك الحجز فيه", en: "Earliest you can book" },
    earliestAvailable: { ar: "أقرب موعد متاح", en: "Earliest available" },
    filterAll: { ar: "كل الفروع", en: "All branches" },
    filterGleem: { ar: "جليم", en: "Gleem" },
    filterCamp: { ar: "كامب شيزار", en: "Camp Caesar" },
    periodMorning: { ar: "صباحًا", en: "Morning" },
    periodAfternoon: { ar: "ظهرًا وعصرًا", en: "Afternoon" },
    periodEvening: { ar: "مساءً وليلاً", en: "Evening & night" },
    slotCountOne: { ar: "ميعاد", en: "slot" },
    slotCountMany: { ar: "مواعيد", en: "slots" },
    nextDayHint: {
      ar: "لو لم تجد الوقت المناسب، يمكنك متابعة الحجز في اليوم التالي",
      en: "If nothing fits, continue with the next day",
    },
    legendSelected: { ar: "محدد", en: "Selected" },
    legendAvailable: { ar: "متاح", en: "Available" },
    barberLocationLabel: { ar: "مكان الصنايعي في اليوم ده", en: "Barber location that day" },
    barberNotWorking: { ar: "{name} مش شغال في اليوم ده", en: "{name} isn’t working that day" },
    barberAtBranch: { ar: "{name} موجود في فرع {branch}", en: "{name} is at {branch}" },
    confirming: { ar: "جاري التأكيد…", en: "Confirming…" },
    locationError: {
      ar: "تعذر تأكيد الفرع لهذا اليوم — كمّل اختيار الوقت على الفرع المحدد",
      en: "Couldn’t confirm branch for this day — continue with the selected branch",
    },
    checkingBranch: { ar: "جاري التأكد من فرع {name}...", en: "Checking {name}’s branch…" },
    crossTitle: { ar: "مواعيد الحلاق", en: "Barber availability" },
    crossSubtitle: {
      ar: "كل المواعيد المتاحة عبر الفروع — اختار الموعد والفرع معاً",
      en: "All slots across branches — pick time and branch together",
    },
    crossAllSlots: { ar: "جميع المواعيد", en: "All slots" },
    crossFilterAria: { ar: "تصفية المواعيد حسب الفرع", en: "Filter slots by branch" },
    overnightBadge: { ar: "ليلي", en: "Overnight" },
  },
  overnight: {
    afterMidnight: { ar: "بعد منتصف الليل", en: "After midnight" },
    explanation: {
      ar: "هذه المواعيد تأتي بعد منتصف الليل ضمن دوام الصالون.",
      en: "These times fall after midnight within the salon’s working hours.",
    },
  },
  details: {
    title: { ar: "بياناتك", en: "Your details" },
    phone: { ar: "رقم الهاتف", en: "Phone number" },
    phonePlaceholder: { ar: "01xxxxxxxxx", en: "01xxxxxxxxx" },
    name: { ar: "الاسم", en: "Name" },
    namePlaceholder: { ar: "اكتب اسمك", en: "Enter your name" },
    notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
    welcomeBack: { ar: "مرحباً، {name}", en: "Welcome, {name}" },
    newCustomer: { ar: "عميل جديد — أول مرة؟ اكتب اسمك", en: "New customer — first time? Enter your name" },
    services: { ar: "الخدمات", en: "Services" },
    date: { ar: "التاريخ", en: "Date" },
    time: { ar: "الوقت", en: "Time" },
    planPriceHint: {
      ar: "السعر والمدة النهائية تظهر بعد تجهيز خطة الحجز من النظام.",
      en: "Final price and duration appear after the system prepares your plan.",
    },
  },
  review: {
    title: { ar: "راجع حجزك", en: "Review your booking" },
    subtitle: {
      ar: "السعر والمدة من النظام — لم يتم تأكيد الحجز بعد",
      en: "Price & duration from the system — not confirmed yet",
    },
    barber: { ar: "الحلاق", en: "Barber" },
    barberPending: { ar: "يُحدد عند التأكيد", en: "Assigned on confirm" },
    service: { ar: "الخدمة", en: "Service" },
    appointment: { ar: "الموعد", en: "Appointment" },
    customerDetails: { ar: "بيانات العميل", en: "Customer details" },
    totalFinal: { ar: "الإجمالي النهائي", en: "Final total" },
    durationFinal: { ar: "المدة الإجمالية", en: "Total duration" },
    phone: { ar: "الهاتف", en: "Phone" },
    name: { ar: "الاسم", en: "Name" },
  },
  success: {
    title: { ar: "تم تأكيد حجزك بنجاح", en: "Booking confirmed successfully" },
    subtitle: {
      ar: "احتفظ بهذا المرجع لموعدك.",
      en: "Keep this reference for your appointment.",
    },
    bookingCode: { ar: "كود الحجز", en: "Booking code" },
    summary: { ar: "الموعد", en: "Appointment" },
    confirmationDetailsAria: { ar: "تفاصيل تأكيد الحجز", en: "Booking confirmation details" },
    craftsman: { ar: "مع", en: "With" },
    dayAndDate: { ar: "اليوم والتاريخ", en: "Day & date" },
    clock: { ar: "الساعة", en: "Time" },
    services: { ar: "الخدمات", en: "Services" },
    total: { ar: "الإجمالي", en: "Total" },
    viewDetails: { ar: "عرض تفاصيل الحجز", en: "View booking details" },
    copiedToast: { ar: "تم نسخ كود الحجز", en: "Booking code copied" },
  },
  infoPanel: {
    detailsHeading: { ar: "تفاصيل الموعد", en: "Appointment details" },
    notSetYet: { ar: "لم يُحدد بعد", en: "Not set yet" },
    determinedByTime: { ar: "يُحدد مع الموعد", en: "Determined by selected time" },
    location: { ar: "الموقع", en: "Location" },
    brandFooter: { ar: "Cut Salon · الإسكندرية", en: "Cut Salon · Alexandria" },
    duration: { ar: "المدة", en: "Duration" },
    price: { ar: "السعر", en: "Price" },
    date: { ar: "التاريخ", en: "Date" },
    time: { ar: "الوقت", en: "Time" },
    service: { ar: "الخدمة", en: "Service" },
  },
  loading: {
    catalog: { ar: "جاري تحميل بيانات الحجز...", en: "Loading booking data…" },
    planning: { ar: "جاري تجهيز خطة الحجز...", en: "Preparing your booking plan…" },
    creating: { ar: "جاري تأكيد حجزك...", en: "Confirming your booking…" },
    crossBranchSlots: { ar: "جاري تحميل المواعيد عبر الفروع...", en: "Loading slots across branches…" },
  },
  empty: {
    crossSlots: { ar: "لا توجد مواعيد متاحة حالياً", en: "No slots available right now" },
    crossSlotsHint: { ar: "جرب تغيير الخدمة أو العودة لاحقاً", en: "Try another service or come back later" },
    noAppointmentsAcrossBranches: {
      ar: "لا توجد مواعيد متاحة عبر الفروع حالياً",
      en: "No appointments available across branches right now",
    },
  },
  a11y: {
    close: { ar: "إغلاق", en: "Close" },
    stepProgress: { ar: "الخطوة {current} من {total}", en: "Step {current} of {total}" },
    stepCompleted: { ar: "مكتمل", en: "Completed" },
    stepCurrent: { ar: "الخطوة الحالية", en: "Current step" },
  },
  validation: {
    customerPhoneRequired: { ar: "يرجى إدخال رقم الهاتف", en: "Please enter phone number" },
    customerNameRequired: { ar: "يرجى إدخال الاسم", en: "Please enter your name" },
    genericInvalid: { ar: "بيانات غير صالحة، يرجى المراجعة", en: "Invalid data, please review" },
  },
  errors: {
    barberIdMissing: { ar: "تعذر بدء الحجز: معرف الحلاق غير متاح", en: "Can’t start booking: barber ID unavailable" },
    barberNotBookableOnline: {
      ar: "هذا الحلاق غير متاح للحجز الإلكتروني حالياً",
      en: "This barber isn’t available for online booking",
    },
    barberBranchesLoadFailed: {
      ar: "تعذر تحميل فروع الحلاق، حاول مرة أخرى",
      en: "Couldn’t load barber branches, try again",
    },
    noPublicBranchesForBarber: {
      ar: "لا توجد فروع عامة متاحة للحجز مع هذا الحلاق حالياً",
      en: "This barber has no public bookable branches right now",
    },
    barberProfileUnavailable: {
      ar: "تعذر تحميل بيانات الحلاق، حاول مرة أخرى",
      en: "Couldn’t load this barber’s profile, try again",
    },
    selectedBranchNoLongerAvailable: {
      ar: "الفرع المحدد لم يعد متاحاً للحجز",
      en: "The selected branch is no longer available for booking",
    },
    branchResolutionFailed: {
      ar: "تعذر تحديد فرع الحجز، حاول مرة أخرى",
      en: "Couldn’t resolve a booking branch, try again",
    },
    invalidBookingStep: {
      ar: "خطوة الحجز غير صالحة، سيتم إعادتك لخطوة سابقة",
      en: "That booking step is no longer valid — returning to a previous step",
    },
    barberNotAvailableAtBranch: {
      ar: "هذا الحلاق غير متاح في الفرع المحدد",
      en: "This barber isn’t available at the selected branch",
    },
    catalogLoadFailed: { ar: "تعذر تحميل بيانات الحجز، حاول مرة أخرى", en: "Couldn’t load booking data, try again" },
    invalidNamePhone: {
      ar: "يرجى إدخال الاسم ورقم الهاتف بشكل صحيح",
      en: "Please enter a valid name and phone number",
    },
    planPrepareFailed: {
      ar: "تعذر تجهيز خطة الحجز. يرجى المحاولة مرة أخرى.",
      en: "Couldn’t prepare booking plan. Please try again.",
    },
    outcomeUnknown: {
      ar: "تعذر التأكد من نتيجة الطلب. قد يكون الحجز تم بالفعل.",
      en: "Couldn’t confirm request result. Booking may already exist.",
    },
    outcomeUnknownDetail: {
      ar: "قد يكون الحجز تم بالفعل. لا تُنشئ طلباً جديداً برقم مختلف.",
      en: "Booking may already exist. Don’t create a new request with a different number.",
    },
    closeWhilePending: {
      ar: "جاري تأكيد الحجز أو النتيجة غير مؤكدة. هل تريد الإغلاق؟ قد يكون الحجز تم بالفعل.",
      en: "Confirmation in progress or unclear. Close anyway? Booking may already exist.",
    },
    bookingDisabledToday: { ar: "الحجز معطل اليوم", en: "Booking is disabled today" },
    bookingDisabledHint: {
      ar: "يرجى التواصل مع الصالون مباشرة للحجز",
      en: "Please contact the salon to book",
    },
    retryAfterSeconds: { ar: "أعد المحاولة بعد {n} ثانية", en: "Retry in {n} seconds" },
    branchesLoadFailed: { ar: "تعذر تحميل قائمة الفروع", en: "Couldn’t load the branch list" },
    partialBarberAvailability: {
      ar: "تعذر التحقق من أحد الفروع — قد تكون المواعيد المعروضة غير مكتملة",
      en: "One branch couldn’t be checked — availability shown may be incomplete",
    },
    slotJustBecameUnavailable: {
      ar: "الميعاد {time} لسه ما عادش متاح. اختار ميعاد تاني.",
      en: "{time} just became unavailable. Please pick another time.",
    },
    slotJustBecameUnavailablePickedNext: {
      ar: "الميعاد {time} لسه ما عادش متاح. اخترنا أقرب ميعاد متاح: {next}.",
      en: "{time} just became unavailable. We selected the next available time: {next}.",
    },
  },
} as const;

type NestedCatalog = typeof bookingCatalog;

type FlattenKeys<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends LocalizedText
    ? P extends ""
      ? K
      : `${P}.${K}`
    : T[K] extends Record<string, unknown>
      ? FlattenKeys<T[K], P extends "" ? K : `${P}.${K}`>
      : never;
}[keyof T & string];

export type BookingI18nKey = FlattenKeys<NestedCatalog>;

function flattenCatalog(obj: Record<string, unknown>, prefix = ""): Catalog {
  const out: Catalog = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value &&
      typeof value === "object" &&
      "ar" in (value as object) &&
      "en" in (value as object) &&
      typeof (value as LocalizedText).ar === "string"
    ) {
      out[path] = value as LocalizedText;
    } else if (value && typeof value === "object") {
      Object.assign(out, flattenCatalog(value as Record<string, unknown>, path));
    }
  }
  return out;
}

export const bookingMessages: Catalog = flattenCatalog(bookingCatalog as unknown as Record<string, unknown>);

export type BookingTParams = Record<string, string | number>;

export function translateBooking(
  lang: Language,
  key: BookingI18nKey | string,
  params?: BookingTParams,
): string {
  const entry = bookingMessages[key];
  let text = entry?.[lang] ?? entry?.ar ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

/** Stable error codes emitted by useBookingFlow for UI translation. */
export type BookingFlowErrorCode =
  | "barberIdMissing"
  | "barberNotBookableOnline"
  | "barberBranchesLoadFailed"
  | "noPublicBranchesForBarber"
  | "barberProfileUnavailable"
  | "selectedBranchNoLongerAvailable"
  | "branchResolutionFailed"
  | "invalidBookingStep"
  | "barberNotAvailableAtBranch"
  | "catalogLoadFailed"
  | "invalidNamePhone"
  | "planPrepareFailed"
  | "outcomeUnknown"
  | "branchesLoadFailed";

export function bookingFlowErrorKey(code: BookingFlowErrorCode): BookingI18nKey {
  return `errors.${code}` as BookingI18nKey;
}
