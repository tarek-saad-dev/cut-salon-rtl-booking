"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Scissors, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import {
  bookStepVariants,
  stepOrderIndex,
} from "@/components/book/bookStepMotion";
import BarberPhoto from "@/components/BarberPhoto";
import BranchPicker from "@/components/BranchPicker";
import BookingServiceSelect from "@/components/BookingServiceSelect";
import BookingCalendar from "@/components/BookingCalendar";
import BookingTimeSlots from "@/components/BookingTimeSlots";
import BookingMultiBranchTimeSlots, {
  type MultiBranchFilter,
} from "@/components/BookingMultiBranchTimeSlots";
import BookingReviewStep from "@/components/BookingReviewStep";
import { BookingNavFooter } from "@/components/BookingNavFooter";
import { useLanguage } from "@/context/LanguageContext";
import { useBookO2Session, type BookO2Step } from "@/hooks/useBookO2Session";
import type { PublicBranch } from "@/lib/booking-api";

function stepIndex(step: BookO2Step, visible: BookO2Step[]) {
  const i = visible.indexOf(step);
  return i >= 0 ? i : 0;
}

export default function BookO2Client() {
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
  const BackIcon = ar ? ChevronRight : ChevronLeft;
  const ForwardIcon = ar ? ChevronLeft : ChevronRight;
  const s = useBookO2Session();
  const [branchFilter, setBranchFilter] = useState<MultiBranchFilter>("all");
  const timeSlotsRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const prevStepRef = useRef<BookO2Step>(s.step);
  const [goingBack, setGoingBack] = useState(false);

  useEffect(() => {
    const prev = prevStepRef.current;
    if (prev !== s.step) {
      setGoingBack(stepOrderIndex(s.step) < stepOrderIndex(prev));
      prevStepRef.current = s.step;
    }
  }, [s.step]);

  const stepMotion = useMemo(() => {
    if (reduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return bookStepVariants(s.step, dir === "rtl" ? "rtl" : "ltr", goingBack);
  }, [s.step, dir, goingBack, reduceMotion]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      s.selectDate(date);
      // Wait for slots to mount, then scroll them into view under the sticky chrome.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          timeSlotsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    },
    [s.selectDate],
  );

  const visibleSteps = useMemo(() => {
    if (s.step === "intent") return ["intent", "services", "schedule", "details", "review"] as BookO2Step[];
    if (s.empId) return ["services", "schedule", "details", "review"] as BookO2Step[];
    if (s.mode === "nearest") {
      if (!s.branchCode && (s.step === "branch" || s.step === "intent")) {
        return ["branch", "services", "schedule", "details", "review"] as BookO2Step[];
      }
      return ["services", "schedule", "details", "review"] as BookO2Step[];
    }
    return ["barber", "services", "schedule", "details", "review"] as BookO2Step[];
  }, [s.step, s.empId, s.mode, s.branchCode]);

  const idx = stepIndex(s.step, visibleSteps);
  const progress = ((idx + 1) / visibleSteps.length) * 100;

  const publicBranches: PublicBranch[] = (s.branches || []).map((b) => ({
    branchCode: b.branchCode,
    branchName: b.branchName || b.branchCode,
    shortName: b.branchName || b.branchCode,
    address: null,
    phone: null,
    timeZone: "Africa/Cairo",
  }));

  const goBack = () => {
    s.goBack();
  };

  const chromeBack =
    s.step === "intent"
      ? { href: "/" as string | undefined, onBack: undefined as (() => void) | undefined, label: ar ? "العودة للرئيسية" : "Back to home" }
      : { href: undefined, onBack: goBack, label: ar ? "رجوع" : "Back" };

  const title =
    s.step === "intent"
      ? ar
        ? "احجز الآن"
        : "Book now"
      : s.empId && s.barberName
      ? ar
        ? `احجز مع ${s.barberName}`
        : `Book with ${s.barberName}`
      : s.mode === "nearest"
        ? ar
          ? "أقرب ميعاد"
          : "Nearest slot"
        : ar
          ? "احجز الآن"
          : "Book now";

  const multiBranch =
    s.mode === "specific" && !s.branchCode && s.multiBranchSlots.length > 0;

  return (
    <BookFlowChrome
      backHref={chromeBack.href}
      onBack={chromeBack.onBack}
      backLabel={chromeBack.label}
      footer={s.step === "intent"}
      heroTitle={title}
      heroMeta={
        s.branchName
          ? s.branchName
          : ar
            ? "CUT Salon · الإسكندرية"
            : "CUT Salon · Alexandria"
      }
    >
      <div className="relative min-h-[70svh] bg-cut-soft-ivory" dir={dir} data-testid="book-o2-shell">
        <div className="sticky top-[calc(var(--cut-campaign-bar-height,0px)+3.5rem)] z-20 border-b border-cut-black/10 bg-cut-soft-ivory/95 backdrop-blur-sm transition-[top] duration-200">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-cut-black">{title}</p>
              <p className="text-[11px] text-cut-black/50">
                {ar
                  ? `الخطوة ${idx + 1} من ${visibleSteps.length}`
                  : `Step ${idx + 1} of ${visibleSteps.length}`}
              </p>
            </div>
            {s.empId ? (
              <div className="h-9 w-9 overflow-hidden rounded-full border border-cut-black/10">
                <BarberPhoto
                  src={s.barberImage}
                  name={s.barberName}
                  imgClassName="h-full w-full object-cover object-top"
                />
              </div>
            ) : null}
          </div>
          <div className="h-1 w-full bg-cut-black/5 overflow-hidden">
            <motion.div
              className={`h-full bg-cut-bronze ${ar ? "origin-right" : "origin-left"}`}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-xl px-5 py-6 sm:px-8 [perspective:1200px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={s.step}
              variants={stepMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              className="origin-top will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
            >
          {s.step === "intent" ? (
            <IntentStep
              ar={ar}
              onNearest={s.selectIntentNearest}
              onBranch={s.selectIntentBranch}
              onBarber={s.selectIntentBarber}
            />
          ) : null}

          {s.step === "branch" ? (
            <section>
              <h2 className="text-xl font-black text-cut-black">
                {ar ? "اختار الفرع" : "Choose a branch"}
              </h2>
              <p className="mt-2 text-sm text-cut-black/55">
                {ar ? "هنعرض المواعيد على الفرع اللي تختاره." : "We will show times for the branch you pick."}
              </p>
              <div className="mt-5">
                {s.catalogLoading ? (
                  <SkeletonRows />
                ) : (
                  <BranchPicker
                    branches={publicBranches}
                    onSelect={(b) => s.selectBranch(b.branchCode)}
                    selectedBranchCode={s.branchCode}
                  />
                )}
              </div>
              <BookingNavFooter onBack={goBack} />
            </section>
          ) : null}

          {s.step === "barber" ? (
            <section>
              <h2 className="text-xl font-black text-cut-black">
                {ar ? "اختار حلاقك" : "Choose your barber"}
              </h2>
              <div className="mt-5 space-y-2">
                {s.catalogLoading ? (
                  <SkeletonRows />
                ) : (
                  s.barbers
                    .filter((b) => b.isBookableOnline !== false && b.id > 0)
                    .map((b, i) => (
                      <motion.button
                        key={b.id}
                        type="button"
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * Math.min(i, 8), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => s.selectBarber(b)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-cut-black/10 bg-cut-ivory px-4 py-3.5 text-start transition hover:border-cut-burgundy/30"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-full border border-cut-black/10">
                          <BarberPhoto
                            src={b.photoUrl || b.imageUrl}
                            name={b.nameAr || b.name}
                            imgClassName="h-full w-full object-cover object-top"
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-cut-black">
                            {b.nameAr || b.nameEn || b.name}
                          </span>
                          <span className="text-xs text-cut-black/50">
                            {b.job || (ar ? "حلاق محترف" : "Professional barber")}
                          </span>
                        </span>
                        <BackIcon className="h-4 w-4 text-cut-black/30" />
                      </motion.button>
                    ))
                )}
              </div>
              <BookingNavFooter onBack={goBack} />
            </section>
          ) : null}

          {s.step === "services" ? (
            <section className="flex min-h-[50svh] flex-col">
              <button
                type="button"
                onClick={goBack}
                className="mb-4 inline-flex min-h-10 items-center gap-1.5 self-start rounded-xl px-1 text-sm font-semibold text-cut-black/70 transition hover:text-cut-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy"
              >
                <BackIcon className="h-4 w-4" strokeWidth={2.25} />
                {ar ? "رجوع للخطوة السابقة" : "Back to previous step"}
              </button>
              {s.catalogLoading ? (
                <SkeletonRows />
              ) : (
                <BookingServiceSelect
                  services={s.services}
                  categories={s.categories}
                  mostPopular={null}
                  selectedIds={s.serviceIds}
                  onCoreSelect={s.selectCoreService}
                  onToggleService={s.toggleService}
                  isLoading={false}
                  isError={s.bootstrapStatus === "error"}
                  totalPrice={s.selectedServices.reduce((sum, x) => sum + x.price, 0)}
                  totalDuration={s.durationMinutes}
                  selectedCount={s.selectedServices.length}
                  onContinue={s.goSchedule}
                  onBack={goBack}
                  backLabel={ar ? "رجوع" : "Back"}
                />
              )}
              {s.serviceIds.length === 0 ? (
                <BookingNavFooter
                  onBack={goBack}
                  backLabel={ar ? "رجوع للخطوة السابقة" : "Back to previous step"}
                />
              ) : null}
            </section>
          ) : null}

          {s.step === "schedule" ? (
            <section>
              <h2 className="text-xl font-black text-cut-black">
                {ar ? "اختار اليوم والوقت" : "Pick date and time"}
              </h2>

              {s.matrixStatus === "loading" ? (
                <div className="mt-6 space-y-3" aria-busy="true">
                  <SkeletonRows />
                  <p className="text-center text-sm text-cut-black/45">
                    {ar ? "بنجهز المواعيد المتاحة…" : "Preparing available times…"}
                  </p>
                </div>
              ) : null}

              {s.matrixStatus === "error" ? (
                <p className="mt-6 text-sm text-red-600" role="alert">
                  {s.matrixError || (ar ? "فشل تحميل المواعيد" : "Could not load availability")}
                </p>
              ) : null}

              {s.matrixStatus === "empty" ? (
                <p className="mt-6 text-sm text-cut-black/55">
                  {ar ? "مفيش مواعيد متاحة حالياً." : "No available times right now."}
                </p>
              ) : null}

              {s.matrixStatus === "ready" || (s.days.length > 0 && s.matrixStatus !== "error") ? (
                <>
                  <BookingCalendar
                    selectedDate={s.selectedDate}
                    onDateSelect={handleDateSelect}
                    availableDays={s.multiBranchDays.length ? s.multiBranchDays : s.days}
                    isLoading={s.matrixStatus === "loading" && s.days.length === 0}
                    showBranchIndicators={multiBranch}
                    legend={multiBranch}
                  />
                  {s.selectedDate ? (
                    <div
                      ref={timeSlotsRef}
                      id="book-o2-time-slots"
                      className="scroll-mt-24"
                    >
                      {multiBranch ? (
                        <BookingMultiBranchTimeSlots
                          slots={s.multiBranchSlots}
                          selectedSlot={s.selectedSlot as never}
                          onSelect={(slot) => s.selectSlot(slot)}
                          isLoading={false}
                          branchFilter={branchFilter}
                          onBranchFilterChange={setBranchFilter}
                          allowedBranches={publicBranches}
                        />
                      ) : (
                        <BookingTimeSlots
                          slots={s.slots}
                          selectedTime={s.selectedSlot?.time}
                          selectedSlot={s.selectedSlot}
                          onTimeSelect={s.selectSlot}
                          isLoading={false}
                        />
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}

              <BookingNavFooter onBack={goBack} backLabel={ar ? "رجوع للخدمات" : "Back to services"} />
            </section>
          ) : null}

          {s.step === "details" ? (
            <section>
              <h2 className="text-xl font-black text-cut-black">
                {ar ? "بياناتك" : "Your details"}
              </h2>
              <div className="mt-5 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-cut-black/70" htmlFor="o2-phone">
                    {ar ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    id="o2-phone"
                    type="tel"
                    value={s.customerPhone}
                    onChange={(e) => s.setCustomerPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="cut-input"
                    dir="ltr"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-cut-black/70" htmlFor="o2-name">
                    {ar ? "الاسم" : "Name"}
                  </label>
                  <input
                    id="o2-name"
                    type="text"
                    value={s.customerName}
                    onChange={(e) => s.setCustomerName(e.target.value)}
                    className="cut-input"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-cut-black/70" htmlFor="o2-notes">
                    {ar ? "ملاحظات (اختياري)" : "Notes (optional)"}
                  </label>
                  <input
                    id="o2-notes"
                    type="text"
                    value={s.notes}
                    onChange={(e) => s.setNotes(e.target.value)}
                    className="cut-input"
                  />
                </div>
              </div>
              {s.confirmError ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {s.confirmError}
                </p>
              ) : null}
              <div className="sticky bottom-0 z-10 -mx-5 mt-8 border-t border-cut-burgundy/15 bg-cut-soft-ivory/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
                <button
                  type="button"
                  disabled={
                    s.confirmStatus === "planning" ||
                    !s.isPhoneReady() ||
                    s.customerName.trim().length < 2
                  }
                  onClick={() => void s.requestPlan()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cut-burgundy py-4 text-[15px] font-black text-cut-ivory shadow-[0_10px_28px_rgba(74,0,15,0.38)] transition hover:bg-cut-burgundy-dark hover:shadow-[0_12px_32px_rgba(74,0,15,0.48)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-cut-burgundy/40 disabled:shadow-none enabled:animate-[book-cta-pulse_2.2s_ease-in-out_infinite]"
                >
                  {s.confirmStatus === "planning" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ForwardIcon className="h-4 w-4 opacity-90" strokeWidth={2.5} />
                  )}
                  {ar ? "متابعة للمراجعة" : "Continue to review"}
                </button>
              </div>
              <BookingNavFooter onBack={goBack} />
            </section>
          ) : null}

          {s.step === "review" && s.plan ? (
            <BookingReviewStep
              branchName={s.branchName || String(s.effectiveBranchCode || "")}
              barberName={
                s.mode === "nearest"
                  ? ar
                    ? "أقرب حلاق"
                    : "Nearest barber"
                  : s.barberName
              }
              serviceLines={s.selectedServices.map((x) => ({
                name: x.nameAr || x.nameEn || x.name,
                durationLabel: `${x.durationMinutes} ${ar ? "د" : "m"}`,
              }))}
              appointmentDateLabel={
                s.selectedDate
                  ? s.selectedDate.toLocaleDateString(ar ? "ar-EG" : "en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : ""
              }
              appointmentTimeLabel={s.selectedSlot?.time || ""}
              customerName={s.customerName}
              customerPhone={s.customerPhone}
              totalDurationLabel={`${s.plan.totalDurationMinutes ?? s.durationMinutes} ${ar ? "دقيقة" : "min"}`}
              totalPriceLabel={`${s.plan.totalPrice ?? 0} ${ar ? "جنيه" : "EGP"}`}
              mutationBanner={
                s.confirmStatus === "creating" ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ar ? "جاري تأكيد الحجز…" : "Confirming…"}
                  </div>
                ) : s.confirmError ? (
                  <p className="text-sm text-red-600">{s.confirmError}</p>
                ) : null
              }
              onEditService={() => s.setStep("services")}
              onEditAppointment={() => s.setStep("schedule")}
              onEditCustomer={() => s.setStep("details")}
              onConfirm={() => void s.confirmCreate()}
              confirmDisabled={s.confirmStatus === "creating"}
              confirmLoading={s.confirmStatus === "creating"}
              onBack={goBack}
            />
          ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BookFlowChrome>
  );
}

function IntentStep({
  ar,
  onNearest,
  onBranch,
  onBarber,
}: {
  ar: boolean;
  onNearest: () => void;
  onBranch: () => void;
  onBarber: () => void;
}) {
  const cards = [
    {
      key: "nearest",
      icon: Zap,
      title: ar ? "أقرب ميعاد" : "Nearest slot",
      body: ar
        ? "أول وقت فاضي مع أي حلاق متاح."
        : "First open time with any available barber.",
      onClick: onNearest,
    },
    {
      key: "branch",
      icon: MapPin,
      title: ar ? "اختيار فرع" : "Choose a branch",
      body: ar
        ? "ابدأ بالفرع، وبعدين الخدمة والميعاد."
        : "Start with a branch, then service and time.",
      onClick: onBranch,
    },
    {
      key: "barber",
      icon: Scissors,
      title: ar ? "اختيار حلاق معين" : "Choose a barber",
      body: ar
        ? "احجز مع حلاقك المفضل مباشرة."
        : "Book directly with your preferred barber.",
      onClick: onBarber,
    },
  ] as const;

  return (
    <section>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-[1.75rem] font-black leading-tight text-cut-black ${ar ? "font-heading" : "font-display"}`}
      >
        {ar ? "ازاي تحب تبدأ الحجز؟" : "How would you like to start?"}
      </motion.h1>
      <p className="mt-3 text-[15px] leading-7 text-cut-black/60">
        {ar
          ? "اختار المسار الأوضح ليك — الحجز سريع ومباشر."
          : "Pick the clearest path — booking stays fast and direct."}
      </p>
      <div className="mt-7 space-y-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={card.onClick}
              className="flex w-full items-start gap-4 rounded-2xl border border-cut-black/10 bg-cut-ivory/90 px-4 py-5 text-start transition hover:border-cut-burgundy/30 sm:px-5"
            >
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cut-bronze/30 bg-cut-warm-paper text-cut-burgundy">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[1.02rem] font-black text-cut-black">{card.title}</span>
                <span className="mt-1.5 block text-[13px] leading-6 text-cut-black/55">{card.body}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-cut-black/5" />
      ))}
    </div>
  );
}
