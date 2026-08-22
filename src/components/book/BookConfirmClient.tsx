"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { arEG, enUS } from "date-fns/locale";
import { Loader2, Pencil } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import { BookTimeWaiting } from "@/components/book/BookTimeWaiting";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  BookingApiError,
  createBookingPlan,
  getLocalizedBookingErrorMessage,
  getServices,
  localizeBranchName,
  submitBookingFromPlan,
  type BookingService,
  type PublicBookingErrorCode,
} from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { normalizeEgyptianPhone } from "@/lib/booking-management/display";
import { saveBookFlowConfirmation } from "@/lib/book-flow-confirmation";
import { clearBookFlowDraft, readBookFlowDraft, saveBookFlowDraft } from "@/lib/book-flow-draft";
import { saveClient } from "@/lib/clientStorage";

function serviceLabel(service: BookingService, lang: "ar" | "en") {
  if (lang === "ar") return (service.nameAr || service.name || service.nameEn || "").trim();
  return (service.nameEn || service.name || service.nameAr || "").trim();
}

function money(value: number, lang: "ar" | "en") {
  const n = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(value);
  return lang === "ar" ? `${n} ج.م` : `EGP ${n}`;
}

function formatSlotLabel(time: string, lang: "ar" | "en") {
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isFinite(hh)) return time;
  const d = new Date();
  d.setHours(hh, mm || 0, 0, 0);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatDateLabel(dateStr: string, lang: "ar" | "en") {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, MMM d, yyyy", {
      locale: lang === "ar" ? arEG : enUS,
    });
  } catch {
    return dateStr;
  }
}

function buildNotes(draft: NonNullable<ReturnType<typeof readBookFlowDraft>>, ar: boolean) {
  const parts: string[] = [];
  if (draft.visit === "group") {
    parts.push(
      ar
        ? "حجز جماعي — يُرجى إضافة عدد الحضور في الملاحظات إن لزم"
        : "Group appointment — add party size in notes if needed",
    );
  }
  if (draft.promoCode) {
    parts.push(ar ? `كود خصم/إحالة: ${draft.promoCode}` : `Promo/referral: ${draft.promoCode}`);
  }
  return parts.length ? parts.join("\n") : undefined;
}

type SubmitState = "idle" | "planning" | "creating";

export default function BookConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();

  const draft = useMemo(() => readBookFlowDraft(), []);
  const branchFromQuery = normalizeBranchCode(searchParams.get("branch") ?? "");
  const visitKind =
    searchParams.get("visit") === "group" || draft?.visit === "group"
      ? "group"
      : "individual";

  const branchCode =
    normalizeBranchCode(selectedBranch?.branchCode ?? "") ||
    branchFromQuery ||
    normalizeBranchCode(draft?.branchCode ?? "");

  const serviceIds = draft?.serviceIds ?? [];
  const professional = draft?.professional ?? null;
  const appointment = draft?.appointment ?? null;
  const customer = draft?.customer ?? null;
  const isNearest = !professional || professional.kind === "nearest";
  const empId = professional?.kind === "specific" ? professional.id : undefined;

  const timeHref = branchCode
    ? `/book/time?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";
  const phoneHref = branchCode
    ? `/book/phone?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";
  const locationHref = "/book";

  const [catalog, setCatalog] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const customerName = (draft?.customer?.name || "").trim();
  const [promoInput, setPromoInput] = useState(draft?.promoCode ?? "");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(draft?.promoCode ?? null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const needsName = customerName.length < 2;

  useEffect(() => {
    if (isLoadingBranches) return;
    if (selectedBranch) return;
    if (branchCode) {
      const match = branches.find(
        (b) => normalizeBranchCode(b.branchCode) === branchCode,
      );
      if (match) {
        selectBranch(match);
        return;
      }
    }
    router.replace("/book");
  }, [isLoadingBranches, selectedBranch, branchCode, branches, selectBranch, router]);

  useEffect(() => {
    if (
      !draft?.serviceIds?.length ||
      !draft.professional ||
      !draft.customer?.phone ||
      !draft.appointment?.date ||
      !draft.appointment?.time
    ) {
      router.replace(timeHref);
      return;
    }
    if (!(draft.customer.name || "").trim()) {
      router.replace(phoneHref);
    }
  }, [draft, router, timeHref, phoneHref]);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await getServices(branchCode, controller.signal);
        if (cancelled) return;
        setCatalog(res.data?.services ?? []);
      } catch {
        if (!cancelled) {
          setError(true);
          setCatalog([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchCode]);

  const selectedServices = useMemo(() => {
    const map = new Map(catalog.map((s) => [s.id, s]));
    return serviceIds.map((id) => map.get(id)).filter(Boolean) as BookingService[];
  }, [catalog, serviceIds]);

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const locationLabel = useMemo(() => {
    if (selectedBranch) return localizeBranchName(selectedBranch, lang);
    const fromList = branches.find(
      (b) => normalizeBranchCode(b.branchCode) === branchCode,
    );
    if (fromList) return localizeBranchName(fromList, lang);
    return appointment?.branchName || branchCode;
  }, [selectedBranch, branches, branchCode, lang, appointment?.branchName]);

  const barberLabel =
    appointment?.barberName ||
    (professional?.kind === "specific"
      ? professional.name
      : ar
        ? "أول حلاق متاح"
        : "First Available");

  const timeLabel = appointment?.time ? formatSlotLabel(appointment.time, lang) : "";
  const dateLabel = appointment?.date ? formatDateLabel(appointment.date, lang) : "";
  const withLine = ar
    ? `مع ${barberLabel} @ ${timeLabel}`
    : `with ${barberLabel} @ ${timeLabel}`;

  const phone = customer?.phone ?? "";
  const phoneReady = normalizeEgyptianPhone(phone) != null;
  const submitting = submitState !== "idle";
  const canConfirm =
    Boolean(branchCode && appointment && selectedServices.length && professional && phoneReady) &&
    customerName.length >= 2 &&
    !submitting &&
    !loading &&
    !error;

  const resolveError = (err: unknown) => {
    if (err instanceof BookingApiError) {
      return getLocalizedBookingErrorMessage(err.code as PublicBookingErrorCode, lang) || err.message;
    }
    return ar ? "تعذر تأكيد الحجز. حاول مرة أخرى." : "Couldn't confirm the booking. Please try again.";
  };

  const onConfirm = async () => {
    if (!canConfirm || !draft || !appointment || !branchCode) return;
    const normalizedPhone = normalizeEgyptianPhone(phone);
    const name = customerName.trim();
    if (!normalizedPhone || name.length < 2) return;

    setSubmitError(null);

    const nextDraft = {
      ...draft,
      branchCode,
      visit: visitKind as "individual" | "group",
      promoCode: appliedPromo,
      customer: {
        ...draft.customer!,
        phone: draft.customer!.phone,
        name,
      },
    };
    saveBookFlowDraft(nextDraft);

    const mode = isNearest ? "nearest" : "specific";
    const notes = buildNotes(nextDraft, ar);
    const dayOffset = appointment.dayOffset ?? 0;

    try {
      setSubmitState("planning");
      const planRes = await createBookingPlan({
        branchCode,
        customer: { name, phone: normalizedPhone },
        serviceIds,
        date: appointment.date,
        time: appointment.time,
        dayOffset,
        mode,
        ...(empId != null ? { empId } : {}),
        notes,
      });

      const plan = planRes.data;
      if (!plan?.planToken) {
        setSubmitError(
          ar ? "تعذر تجهيز الحجز. حاول مرة أخرى." : "Couldn't prepare the booking. Please try again.",
        );
        setSubmitState("idle");
        return;
      }

      setSubmitState("creating");
      const result = await submitBookingFromPlan({
        plan,
        customer: { name, phone: normalizedPhone },
        notes,
        branchCode,
        date: appointment.date,
        time: appointment.time,
        dayOffset,
        serviceIds,
        mode,
        ...(empId != null ? { empId } : {}),
      });

      if (result.outcome !== "success" || !result.booking) {
        const msg =
          result.error?.message ||
          (result.error?.code
            ? getLocalizedBookingErrorMessage(
                result.error.code as PublicBookingErrorCode,
                lang,
              )
            : null) ||
          (ar ? "تعذر تأكيد الحجز." : "Couldn't confirm the booking.");
        setSubmitError(msg);
        setSubmitState("idle");
        return;
      }

      const booking = result.booking;
      saveClient({ name, phone: normalizedPhone.replace(/\D/g, "") || phone });
      saveBookFlowConfirmation({
        customerName: name,
        date: (booking.date || appointment.date).trim(),
        time: (booking.time || appointment.time).trim(),
        branchName: (booking.branchName || locationLabel).trim(),
        branchCode: booking.branchCode || branchCode,
        barberName: (booking.barberName || barberLabel).trim() || null,
        bookingCode: booking.bookingCode || null,
      });
      clearBookFlowDraft();
      router.push("/book/confirmed");
    } catch (err) {
      setSubmitError(resolveError(err));
      setSubmitState("idle");
    }
  };

  const editRow = (
    label: string,
    value: string,
    href: string,
    ariaEdit: string,
  ) => (
    <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
      <p className="shrink-0 text-[15px] font-bold text-cut-black">{label}</p>
      <button
        type="button"
        onClick={() => router.push(href)}
        aria-label={ariaEdit}
        className="group inline-flex max-w-[65%] items-start gap-2 text-end text-[15px] text-cut-black underline decoration-cut-black/35 underline-offset-4 transition hover:decoration-cut-burgundy hover:text-cut-burgundy"
      >
        <span className="min-w-0 break-words">{value}</span>
        <Pencil
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cut-black/70 group-hover:text-cut-burgundy"
          strokeWidth={2}
        />
      </button>
    </div>
  );

  const confirmLabel =
    submitState === "planning"
      ? ar
        ? "جاري التجهيز…"
        : "Preparing…"
      : submitState === "creating"
        ? ar
          ? "جاري التأكيد…"
          : "Confirming…"
        : ar
          ? "تأكيد الحجز"
          : "Confirm booking";

  const waitingLabel =
    submitState === "planning"
      ? ar
        ? "جاري تجهيز الحجز…"
        : "Preparing your booking…"
      : ar
        ? "جاري تأكيد الحجز…"
        : "Confirming your booking…";

  return (
    <BookFlowChrome
      backHref={timeHref}
      backLabel={ar ? "رجوع للمواعيد" : "Back to times"}
      footer={false}
      entryScroll={false}
      heroTitle={ar ? "راجع وأكّد" : "Review & confirm"}
    >
      {submitting ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-cut-soft-ivory/55 px-4 backdrop-blur-md"
          role="alertdialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={waitingLabel}
        >
          <div className="w-full max-w-md rounded-3xl border border-cut-black/10 bg-cut-soft-ivory/90 px-2 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <BookTimeWaiting lang={lang} tone="confirm" label={waitingLabel} />
          </div>
        </div>
      ) : null}

      <section
        className={`relative bg-cut-soft-ivory pb-36 md:-mt-4 md:min-h-[55svh] md:rounded-t-[1.75rem] md:shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ${
          submitting ? "pointer-events-none select-none" : ""
        }`}
        aria-hidden={submitting || undefined}
      >
        <BookDelayedWaitingOverlay
          busy={loading && !submitting}
          delayMs={800}
          lang={lang}
          label={ar ? "جاري تحميل تفاصيل الحجز…" : "Loading booking details…"}
        />
        <div className="border-b border-cut-black/10 px-5 py-5 sm:px-6">
          <h1 className="text-[13px] font-black uppercase tracking-[0.14em] text-cut-black">
            {ar ? "تأكيد الحجز" : "Confirm your booking"}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-cut-black/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ar ? "جاري التحميل…" : "Loading…"}
          </div>
        ) : null}

        {!loading && error ? (
          <p className="px-5 py-12 text-center text-sm text-cut-black/65">
            {ar ? "تعذر تحميل تفاصيل الحجز." : "Couldn't load booking details."}
          </p>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="divide-y divide-cut-black/10 border-b border-cut-black/10">
              {editRow(
                ar ? "الموقع" : "Location",
                locationLabel,
                locationHref,
                ar ? "تعديل الفرع" : "Edit location",
              )}
              {editRow(
                ar ? "التاريخ" : "Date",
                dateLabel,
                timeHref,
                ar ? "تعديل التاريخ" : "Edit date",
              )}
              {editRow(
                ar ? "الوقت" : "Time",
                timeLabel,
                timeHref,
                ar ? "تعديل الوقت" : "Edit time",
              )}
            </div>

            <div className="border-b border-cut-black/10 px-5 py-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[15px] font-bold text-cut-black">
                  {ar ? "العناصر" : "Items"}
                </p>
                <p className="text-[15px] font-bold text-cut-black">
                  {ar ? "التكلفة" : "Cost"}
                </p>
              </div>
              <ul className="space-y-4">
                {selectedServices.map((service) => (
                  <li key={service.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-cut-black">
                        {serviceLabel(service, lang)}
                      </p>
                      <p className="mt-1 text-[13px] text-cut-black/55">{withLine}</p>
                    </div>
                    <p className="shrink-0 text-[15px] font-semibold text-cut-black">
                      {money(service.price ?? 0, lang)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-cut-black/10 pt-3">
                <p className="text-[15px] font-bold text-cut-black">
                  {ar ? "الإجمالي" : "Total"}
                </p>
                <p className="text-[15px] font-bold text-cut-black">
                  {money(totalPrice, lang)}
                </p>
              </div>
            </div>

            <div className="space-y-4 border-b border-cut-black/10 px-5 py-5 sm:px-6">
              <div>
                <label
                  htmlFor="book-promo-code"
                  className="mb-2 block text-[13px] font-semibold text-cut-black"
                >
                  {ar ? "كود خصم أو إحالة" : "Promo or referral code"}
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="book-promo-code"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.slice(0, 40))}
                    placeholder={ar ? "أضف الكود" : "Add code"}
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-cut-black/20 bg-cut-ivory px-3 text-sm text-cut-black outline-none placeholder:text-cut-black/35 focus:border-cut-burgundy"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = promoInput.trim().slice(0, 40);
                      const next = code || null;
                      setAppliedPromo(next);
                      if (!draft || !branchCode) return;
                      saveBookFlowDraft({
                        ...draft,
                        branchCode,
                        visit: visitKind,
                        promoCode: next,
                      });
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-cut-black px-5 text-sm font-bold text-cut-ivory transition hover:bg-cut-wine-black"
                  >
                    {ar ? "تطبيق" : "Apply"}
                  </button>
                </div>
                {appliedPromo ? (
                  <p className="mt-2 text-[12px] text-cut-burgundy">
                    {ar ? `تم تطبيق الكود: ${appliedPromo}` : `Applied: ${appliedPromo}`}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="mb-1 text-[13px] font-semibold text-cut-black">
                  {ar ? "رقم الموبايل" : "Mobile number"}
                </p>
                <p className="text-[15px] text-cut-black/75" dir="ltr">
                  {phone}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[13px] font-semibold text-cut-black">
                  {ar ? "الاسم" : "Name"}
                </p>
                <p className="text-[15px] font-semibold text-cut-black">{customerName}</p>
                {needsName ? (
                  <p className="mt-2 text-[12px] text-cut-black/50">
                    {ar
                      ? "الاسم ناقص — رجّع لخطوة الموبايل."
                      : "Name is missing — go back to the phone step."}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {submitError}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cut-black/10 bg-cut-soft-ivory/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={!canConfirm}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cut-black text-sm font-bold uppercase tracking-[0.14em] text-cut-ivory transition hover:bg-cut-wine-black disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </section>
    </BookFlowChrome>
  );
}
