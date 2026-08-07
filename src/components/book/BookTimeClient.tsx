"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { arEG, enUS } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookTimeWaiting } from "@/components/book/BookTimeWaiting";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getAvailableDays,
  getAvailableSlots,
  type AvailableDay,
  type AvailableSlot,
} from "@/lib/booking-api";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { readBookFlowDraft, saveBookFlowDraft } from "@/lib/book-flow-draft";

function parseHour(time: string): number {
  const [h] = time.split(":").map(Number);
  return Number.isFinite(h) ? h : -1;
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

type PeriodKey = "morning" | "afternoon" | "evening";

function groupByPeriod(slots: AvailableSlot[], ar: boolean) {
  const buckets: Record<PeriodKey, AvailableSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const slot of slots.filter((s) => s.available !== false)) {
    const hour = parseHour(slot.time);
    if (hour >= 5 && hour < 12) buckets.morning.push(slot);
    else if (hour >= 12 && hour < 17) buckets.afternoon.push(slot);
    else buckets.evening.push(slot);
  }
  const titles: Record<PeriodKey, string> = {
    morning: ar ? "الصباح" : "Morning",
    afternoon: ar ? "بعد الظهر" : "Afternoon",
    evening: ar ? "المساء" : "Evening",
  };
  return (Object.keys(buckets) as PeriodKey[])
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, title: titles[key], slots: buckets[key] }));
}

function dayChipLabel(date: Date, today: Date, lang: "ar" | "en") {
  const locale = lang === "ar" ? arEG : enUS;
  if (isSameDay(date, today)) {
    return lang === "ar"
      ? `اليوم ${format(date, "M/d")}`
      : `Today ${format(date, "M/d")}`;
  }
  return `${format(date, "EEE", { locale })} ${format(date, "M/d")}`;
}

export default function BookTimeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
  const { branches, selectedBranch, selectBranch, isLoadingBranches } = useBranch();
  const ChevronPrev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const ChevronNext = dir === "rtl" ? ChevronLeft : ChevronRight;

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
  const isNearest = !professional || professional.kind === "nearest";
  const empId = professional?.kind === "specific" ? professional.id : undefined;

  const phoneHref = branchCode
    ? `/book/phone?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";

  const [days, setDays] = useState<AvailableDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [daysError, setDaysError] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [dayWindowStart, setDayWindowStart] = useState(0);

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
    if (!draft?.serviceIds?.length || !draft.professional || !draft.customer?.phone) {
      router.replace(phoneHref);
    }
  }, [draft, router, phoneHref]);

  useEffect(() => {
    if (!branchCode || !serviceIds.length) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setDaysLoading(true);
      setDaysError(false);
      try {
        const res = await getAvailableDays(
          {
            branchCode,
            serviceIds,
            mode: isNearest ? "nearest" : "specific",
            ...(empId != null ? { empId } : {}),
          },
          controller.signal,
        );
        if (cancelled) return;
        const available = (res.data ?? []).filter((d) => d.available);
        setDays(available);
        setSelectedDate((prev) => prev ?? available[0]?.date ?? null);
      } catch {
        if (!cancelled) {
          setDaysError(true);
          setDays([]);
        }
      } finally {
        if (!cancelled) setDaysLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchCode, serviceIds, isNearest, empId]);

  useEffect(() => {
    if (!branchCode || !selectedDate || !serviceIds.length) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      setSlotsLoading(true);
      setSlotsError(false);
      try {
        const res = await getAvailableSlots(
          {
            branchCode,
            date: selectedDate,
            serviceIds,
            mode: isNearest ? "nearest" : "specific",
            ...(empId != null ? { empId } : {}),
          },
          controller.signal,
        );
        if (cancelled) return;
        setSlots((res.data ?? []).filter((s) => s.available !== false));
      } catch {
        if (!cancelled) {
          setSlotsError(true);
          setSlots([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [branchCode, selectedDate, serviceIds, isNearest, empId]);

  const today = startOfDay(new Date());
  const visibleDays = days.slice(dayWindowStart, dayWindowStart + 5);
  const periods = groupByPeriod(slots, ar);

  const onPickSlot = (slot: AvailableSlot) => {
    if (!draft || !branchCode || !selectedDate) return;
    const nextDraft = {
      ...draft,
      branchCode,
      visit: visitKind as "individual" | "group",
      appointment: {
        date: selectedDate,
        time: slot.time,
        empId: slot.empId ?? empId ?? null,
        dayOffset: slot.dayOffset ?? 0,
        branchCode: slot.branchCode ?? branchCode,
        branchName: slot.branchName ?? selectedBranch?.branchName ?? branchCode,
        barberName: slot.barberName ?? null,
      },
    };
    saveBookFlowDraft(nextDraft);
    router.push(
      `/book/confirm?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`,
    );
  };

  return (
    <BookFlowChrome
      backHref={phoneHref}
      backLabel={ar ? "رجوع لرقم الموبايل" : "Back to phone"}
      footer={false}
    >
      <section className="relative -mt-4 min-h-[55svh] rounded-t-[1.75rem] bg-cut-soft-ivory pb-10 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between gap-3 border-b border-cut-black/10 px-5 py-5 sm:px-6">
          <h1 className="text-[13px] font-black uppercase tracking-[0.14em] text-cut-black">
            {ar ? "اختر ميعاد الخدمة" : "Select service time"}
          </h1>
          <CalendarDays className="h-5 w-5 text-cut-black/45" strokeWidth={1.6} />
        </div>

        {daysLoading ? (
          <BookTimeWaiting
            lang={lang}
            label={ar ? "بنرتّب المواعيد ليك…" : "Lining up your times…"}
          />
        ) : null}

        {!daysLoading && daysError ? (
          <p className="px-5 py-12 text-center text-sm text-cut-black/65">
            {ar ? "تعذر تحميل الأيام المتاحة." : "Couldn't load available days."}
          </p>
        ) : null}

        {!daysLoading && !daysError && days.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-cut-black/65">
            {ar ? "لا توجد مواعيد متاحة حاليًا لهذا الاختيار." : "No available times for this selection."}
          </p>
        ) : null}

        {!daysLoading && !daysError && days.length > 0 ? (
          <>
            <div className="flex items-center gap-1 border-b border-cut-black/10 px-2 py-3 sm:px-3">
              <button
                type="button"
                aria-label={ar ? "الأيام السابقة" : "Previous days"}
                disabled={dayWindowStart <= 0}
                onClick={() => setDayWindowStart((v) => Math.max(0, v - 1))}
                className="inline-flex h-10 w-10 items-center justify-center text-cut-black/55 disabled:opacity-30"
              >
                <ChevronPrev className="h-5 w-5" />
              </button>
              <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
                {visibleDays.map((day) => {
                  const date = parseISO(day.date);
                  const active = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className={`min-w-0 flex-1 px-1 py-2 text-center text-[13px] font-semibold transition ${
                        active
                          ? "border-b-2 border-cut-black text-cut-black"
                          : "border-b-2 border-transparent text-cut-black/50 hover:text-cut-black"
                      }`}
                    >
                      {dayChipLabel(date, today, lang)}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-label={ar ? "الأيام التالية" : "Next days"}
                disabled={dayWindowStart + 5 >= days.length}
                onClick={() =>
                  setDayWindowStart((v) => Math.min(Math.max(0, days.length - 5), v + 1))
                }
                className="inline-flex h-10 w-10 items-center justify-center text-cut-black/55 disabled:opacity-30"
              >
                <ChevronNext className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-5 sm:px-6">
              {slotsLoading ? (
                <BookTimeWaiting
                  compact
                  lang={lang}
                  label={ar ? "بنحضّر الأوقات المتاحة…" : "Sharpening available slots…"}
                />
              ) : null}

              {!slotsLoading && slotsError ? (
                <p className="py-8 text-center text-sm text-cut-black/65">
                  {ar ? "تعذر تحميل الأوقات لهذا اليوم." : "Couldn't load times for this day."}
                </p>
              ) : null}

              {!slotsLoading && !slotsError && periods.length === 0 ? (
                <p className="py-8 text-center text-sm text-cut-black/65">
                  {ar ? "لا توجد أوقات متاحة في هذا اليوم." : "No times available on this day."}
                </p>
              ) : null}

              {!slotsLoading && !slotsError
                ? periods.map((period) => (
                    <div key={period.key} className="mb-7">
                      <h2 className="mb-3 text-base font-bold text-cut-black">{period.title}</h2>
                      <div className="flex flex-wrap gap-2.5">
                        {period.slots.map((slot) => (
                          <button
                            key={`${slot.time}-${slot.empId ?? "x"}-${slot.dayOffset ?? 0}`}
                            type="button"
                            onClick={() => onPickSlot(slot)}
                            className="min-h-11 min-w-[5.5rem] rounded-full border border-cut-black bg-cut-ivory px-4 text-sm font-semibold tabular-nums text-cut-black transition hover:bg-cut-warm-paper"
                          >
                            {slot.label ?? formatSlotLabel(slot.time, lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </>
        ) : null}
      </section>
    </BookFlowChrome>
  );
}
