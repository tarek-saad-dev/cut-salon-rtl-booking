"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { arEG, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { useLanguage } from "@/context/LanguageContext";
import {
  clearBookFlowConfirmation,
  readBookFlowConfirmation,
  type BookFlowConfirmation,
} from "@/lib/book-flow-confirmation";
import { clearBookFlowDraft } from "@/lib/book-flow-draft";

function formatTimeLabel(time: string, lang: "ar" | "en") {
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isFinite(hh)) return time;
  const d = new Date();
  d.setHours(hh, mm || 0, 0, 0);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatDayLabel(dateStr: string, lang: "ar" | "en") {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, d MMMM yyyy", {
      locale: lang === "ar" ? arEG : enUS,
    });
  } catch {
    return dateStr;
  }
}

function GreenCheck() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-500/15"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-emerald-500/30"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_12px_40px_rgba(16,185,129,0.35)]"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.12, type: "spring", stiffness: 260, damping: 16 }}
      >
        <svg
          viewBox="0 0 52 52"
          className="h-10 w-10"
          fill="none"
          aria-hidden
        >
          <motion.path
            d="M14 27.5 L22.5 35.5 L38 17"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full border border-emerald-400/40"
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1.55, opacity: 0 }}
        transition={{ delay: 0.25, duration: 0.9, ease: "easeOut" }}
      />
    </div>
  );
}

export default function BookConfirmedClient() {
  const router = useRouter();
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
  const [data, setData] = useState<BookFlowConfirmation | null>(null);

  useEffect(() => {
    const confirmation = readBookFlowConfirmation();
    if (!confirmation) {
      router.replace("/book");
      return;
    }
    setData(confirmation);
    clearBookFlowDraft();
  }, [router]);

  const copy = useMemo(() => {
    const name = (data?.customerName || "").trim();
    const day = data?.date ? formatDayLabel(data.date, lang) : "";
    const time = data?.time ? formatTimeLabel(data.time, lang) : "";
    const branch = data?.branchName || "";

    if (ar) {
      return {
        thanks: name ? `شكرًا ${name}` : "شكرًا ليك",
        subtitle: "تم تأكيد حجزك بنجاح",
        waiting: `في انتظارك يوم ${day} الساعة ${time} في فرع ${branch}`,
        phrase: "خلّي يومك أنيق… وشكراً إنك اخترت CUT Salon.",
        home: "العودة للرئيسية",
        appointments: "مواعيدك",
      };
    }
    return {
      thanks: name ? `Thank you, ${name}` : "Thank you",
      subtitle: "Your booking is confirmed",
      waiting: `We'll see you on ${day} at ${time} at our ${branch} branch`,
      phrase: "Looking forward to making you look sharp — thanks for choosing CUT Salon.",
      home: "Back to home",
      appointments: "Your appointments",
    };
  }, [data, lang, ar]);

  if (!data) {
    return <div className="min-h-[100svh] bg-cut-soft-ivory" />;
  }

  return (
    <BookFlowChrome footer={false}>
      <section
        dir={dir}
        className="relative -mt-4 min-h-[55svh] rounded-t-[1.75rem] bg-cut-soft-ivory px-5 pb-12 pt-10 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] sm:px-6"
        role="status"
        aria-live="polite"
      >
        <GreenCheck />

        <motion.div
          className="mx-auto mt-8 max-w-md text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-display text-3xl font-bold tracking-tight text-cut-black sm:text-4xl">
            {copy.thanks}
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
            {copy.subtitle}
          </p>
          <p className="mt-6 text-base leading-8 text-cut-black/80">{copy.waiting}</p>
          <p className="mt-5 text-[15px] leading-7 text-cut-burgundy/90">{copy.phrase}</p>

          {data.bookingCode ? (
            <p className="mt-6 text-xs text-cut-black/45">
              {ar ? "رمز الحجز" : "Booking code"}{" "}
              <span className="font-mono font-semibold text-cut-black/70">
                {data.bookingCode}
              </span>
            </p>
          ) : null}
        </motion.div>

        <motion.div
          className="mx-auto mt-10 flex max-w-md flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.45 }}
        >
          <button
            type="button"
            onClick={() => {
              clearBookFlowConfirmation();
              router.push("/");
            }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cut-black text-sm font-bold uppercase tracking-[0.14em] text-cut-ivory transition hover:bg-cut-wine-black"
          >
            {copy.home}
          </button>
          <button
            type="button"
            onClick={() => {
              clearBookFlowConfirmation();
              router.push(
                data.bookingCode
                  ? `/booking?code=${encodeURIComponent(data.bookingCode)}`
                  : "/booking",
              );
            }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-cut-black/20 bg-transparent text-sm font-semibold text-cut-black transition hover:bg-cut-warm-paper"
          >
            {copy.appointments}
          </button>
        </motion.div>
      </section>
    </BookFlowChrome>
  );
}
