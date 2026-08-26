"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Scissors, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { CompactBarberRow } from "@/components/book/CompactBarberRow";
import {
  bookStepVariants,
  stepOrderIndex,
} from "@/components/book/bookStepMotion";
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
import { resolveBookBranchHeroLabel } from "@/lib/booking/branch-label";
import { formatStaleSlotNotice } from "@/lib/bookingV2/recoverStaleSlot";

function stepIndex(step: BookO2Step, visible: BookO2Step[]) {
  const i = visible.indexOf(step);
  return i >= 0 ? i : 0;
}

export default function BookO2Client() {
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
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

  const desktopOnlyFooter = (node: React.ReactNode) => (
    <div className="hidden md:block">{node}</div>
  );

  const branchHeroLabel = s.branchCode
    ? resolveBookBranchHeroLabel(
        s.branchCode,
        publicBranches.find(
          (b) =>
            String(b.branchCode).toUpperCase() === String(s.branchCode).toUpperCase(),
        )?.branchName,
        lang,
      )
    : undefined;

  return (
    <BookFlowChrome
      backHref={chromeBack.href}
      onBack={chromeBack.onBack}
      backLabel={chromeBack.label}
      footer={s.step === "intent"}
      entryScroll={false}
      heroTitle={title}
      heroBranchLabel={branchHeroLabel}
      heroBranchCode={s.branchCode ?? undefined}
      heroMeta={
        branchHeroLabel
          ? undefined
          : ar
            ? "CUT Salon · الإسكندرية"
            : "CUT Salon · Alexandria"
      }
      stepIndex={idx + 1}
      stepTotal={visibleSteps.length}
      avatarSrc={s.empId ? s.barberImage : null}
      avatarName={s.barberName ?? undefined}
    >
      <div
        className="mx-auto max-w-xl px-3 py-3 sm:px-8 md:px-8 md:py-6 [perspective:1200px]"
        dir={dir}
        data-testid="book-o2-shell"
      >
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
                <h2 className="hidden text-xl font-black text-cut-black md:block">
                  {ar ? "اختار الفرع" : "Choose a branch"}
                </h2>
                <div className="md:mt-5">
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
                {desktopOnlyFooter(<BookingNavFooter onBack={goBack} />)}
              </section>
            ) : null}

            {s.step === "barber" ? (
              <section>
                <h2 className="hidden text-xl font-black text-cut-black md:block">
                  {ar ? "اختار حلاقك" : "Choose your barber"}
                </h2>
                <div className="space-y-2 md:mt-5">
                  {s.catalogLoading ? (
                    <SkeletonRows compact />
                  ) : (
                    s.barbers
                      .filter((b) => b.isBookableOnline !== false && b.id > 0)
                      .map((b) => (
                        <CompactBarberRow
                          key={b.id}
                          dir={dir === "rtl" ? "rtl" : "ltr"}
                          name={b.nameAr || b.nameEn || b.name}
                          role={b.job || (ar ? "حلاق محترف" : "Professional barber")}
                          imageSrc={b.photoUrl || b.imageUrl}
                          onClick={() => s.selectBarber(b)}
                        />
                      ))
                  )}
                </div>
                {desktopOnlyFooter(<BookingNavFooter onBack={goBack} />)}
              </section>
            ) : null}

            {s.step === "services" ? (
              <section className="flex min-h-0 flex-col md:min-h-[50svh]">
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
                    hideIntro
                  />
                )}
                {s.serviceIds.length === 0
                  ? desktopOnlyFooter(
                      <BookingNavFooter
                        onBack={goBack}
                        backLabel={ar ? "رجوع للخطوة السابقة" : "Back to previous step"}
                      />,
                    )
                  : null}
              </section>
            ) : null}

            {s.step === "schedule" ? (
              <section>
                <h2 className="hidden text-xl font-black text-cut-black md:block">
                  {ar ? "اختار اليوم والوقت" : "Pick date and time"}
                </h2>

                {s.matrixStatus === "loading" ? (
                  <div className="space-y-3 md:mt-6" aria-busy="true">
                    <SkeletonRows />
                    <p className="text-center text-sm text-cut-black/45">
                      {ar ? "بنجهز المواعيد المتاحة…" : "Preparing available times…"}
                    </p>
                  </div>
                ) : null}

                {s.matrixStatus === "error" ? (
                  <p className="mt-3 text-sm text-red-600 md:mt-6" role="alert">
                    {s.matrixError || (ar ? "فشل تحميل المواعيد" : "Could not load availability")}
                  </p>
                ) : null}

                {s.matrixStatus === "empty" ? (
                  <p className="mt-3 text-sm text-cut-black/55 md:mt-6">
                    {ar ? "مفيش مواعيد متاحة حالياً." : "No available times right now."}
                  </p>
                ) : null}

                {s.staleSlotNotice ? (
                  <p className="mt-3 text-sm text-cut-burgundy md:mt-6" role="status">
                    {formatStaleSlotNotice(lang, s.staleSlotNotice)}
                  </p>
                ) : null}

                {s.matrixStatus === "ready" || (s.days.length > 0 && s.matrixStatus !== "error") ? (
                  <div className="md:mt-4">
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
                  </div>
                ) : null}

                {desktopOnlyFooter(
                  <BookingNavFooter
                    onBack={goBack}
                    backLabel={ar ? "رجوع للخدمات" : "Back to services"}
                  />,
                )}
              </section>
            ) : null}

            {s.step === "details" ? (
              <section>
                <h2 className="hidden text-xl font-black text-cut-black md:block">
                  {ar ? "بياناتك" : "Your details"}
                </h2>
                <div className="space-y-3 md:mt-5">
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
                <div className="sticky bottom-0 z-10 -mx-3 mt-6 border-t border-cut-burgundy/15 bg-cut-soft-ivory/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm md:-mx-8 md:px-8">
                  <button
                    type="button"
                    disabled={
                      s.confirmStatus === "planning" ||
                      !s.isPhoneReady() ||
                      s.customerName.trim().length < 2
                    }
                    onClick={() => void s.requestPlan()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cut-burgundy py-3.5 text-[15px] font-black text-cut-ivory shadow-[0_10px_28px_rgba(74,0,15,0.38)] transition hover:bg-cut-burgundy-dark disabled:cursor-not-allowed disabled:bg-cut-burgundy/40 disabled:shadow-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy focus-visible:ring-offset-2"
                  >
                    {s.confirmStatus === "planning" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {ar ? "متابعة للمراجعة" : "Continue to review"}
                  </button>
                </div>
                {desktopOnlyFooter(<BookingNavFooter onBack={goBack} />)}
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
      onClick: onNearest,
    },
    {
      key: "branch",
      icon: MapPin,
      title: ar ? "اختيار فرع" : "Choose a branch",
      onClick: onBranch,
    },
    {
      key: "barber",
      icon: Scissors,
      title: ar ? "اختيار حلاق معين" : "Choose a barber",
      onClick: onBarber,
    },
  ] as const;

  return (
    <section>
      <h1
        className={`hidden text-[1.75rem] font-black leading-tight text-cut-black md:block ${
          ar ? "font-heading" : "font-display"
        }`}
      >
        {ar ? "ازاي تحب تبدأ الحجز؟" : "How would you like to start?"}
      </h1>
      <div className="space-y-2 md:mt-7">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={card.onClick}
              className="flex w-full min-h-[3.75rem] items-center gap-3 rounded-xl border border-cut-black/10 bg-cut-ivory/90 px-3 py-2.5 text-start transition hover:border-cut-burgundy/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy md:items-start md:gap-4 md:rounded-2xl md:px-4 md:py-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cut-bronze/30 bg-cut-warm-paper text-cut-burgundy md:mt-0.5 md:h-11 md:w-11">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-black text-cut-black md:text-[1.02rem]">
                {card.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SkeletonRows({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl bg-cut-black/5 ${
            compact ? "h-[3.75rem]" : "h-16 md:rounded-2xl"
          }`}
        />
      ))}
    </div>
  );
}
