"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Scissors,
  UserRound,
} from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import BarberPhoto from "@/components/BarberPhoto";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  filterBarbersForPublicDiscovery,
  listGlobalBarbers,
  resolveBarberDisplayName,
  resolveBarberPhotoUrl,
  resolveBookableBranchesForBarber,
  seedBarberProfileCache,
  type PublicBarber,
  type PublicBranch,
} from "@/lib/booking-api";
import {
  clearBookEntryBarber,
  saveBookEntryBarber,
} from "@/lib/book-flow-entry";

type BookMode = "intent" | "location" | "barber";

function branchTitle(branch: PublicBranch) {
  return (branch.shortName || branch.branchName || branch.branchCode).trim();
}

function addressLines(address: string | null): string[] {
  if (!address?.trim()) return [];
  const parts = address
    .split(/[,\n|]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(", ")];
  return [address.trim()];
}

function parseMode(raw: string | null): BookMode {
  if (raw === "location" || raw === "barber") return raw;
  return "intent";
}

export default function BookBranchesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, dir } = useLanguage();
  const ar = lang === "ar";
  const Chevron = ar ? ChevronLeft : ChevronRight;
  const {
    branches,
    isLoadingBranches,
    branchesError,
    selectBranch,
    refetchBranches,
  } = useBranch();

  const rawMode = searchParams.get("mode");
  // Legacy deep-links from earlier barber-scope page flow → barber list.
  const mode: BookMode =
    rawMode === "scope" ? "barber" : parseMode(rawMode);

  const [barbers, setBarbers] = useState<PublicBarber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [barbersError, setBarbersError] = useState(false);
  const [barbersReload, setBarbersReload] = useState(0);

  useEffect(() => {
    if (rawMode === "scope") {
      router.replace("/book?mode=barber");
    }
  }, [rawMode, router]);

  useEffect(() => {
    if (mode !== "barber") return;
    if (isLoadingBranches) return;
    let cancelled = false;
    const controller = new AbortController();
    setBarbersLoading(true);
    setBarbersError(false);
    listGlobalBarbers(controller.signal)
      .then((res) => {
        if (cancelled) return;
        setBarbers(
          filterBarbersForPublicDiscovery(res.data ?? [], branches).filter(
            (b) => b.isBookableOnline !== false && b.id > 0,
          ),
        );
      })
      .catch((err) => {
        if (cancelled || controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setBarbers([]);
        setBarbersError(true);
      })
      .finally(() => {
        if (!cancelled) setBarbersLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [mode, branches, barbersReload, isLoadingBranches]);

  const goLocationMode = () => {
    clearBookEntryBarber();
    router.push("/book?mode=location");
  };

  const goBarberMode = () => {
    clearBookEntryBarber();
    router.push("/book?mode=barber");
  };

  const onSelectBranch = (branch: PublicBranch) => {
    clearBookEntryBarber();
    selectBranch(branch);
    router.push(
      `/book/services?branch=${encodeURIComponent(branch.branchCode)}&visit=individual`,
    );
  };

  /** Continue barber-first booking as an in-page flow (same steps as modal). */
  const onSelectBarber = (barber: PublicBarber) => {
    const { allowedBranches, resolution } = resolveBookableBranchesForBarber({
      barberProfileBranches: barber.branches ?? [],
      publicBranches: branches,
    });
    if (resolution === "none" || barber.id <= 0) return;

    const name = resolveBarberDisplayName(barber, lang);
    const image = resolveBarberPhotoUrl(barber);
    const role = barber.job || (ar ? "حلاق محترف" : "Professional barber");
    const branchCodes = allowedBranches.map((b) => b.branchCode);

    saveBookEntryBarber({
      id: barber.id,
      name,
      image,
      role,
      serviceIds: barber.serviceIds,
      branchCodes,
      availabilityScope: null,
      catalogBranchCode: null,
    });

    seedBarberProfileCache({
      empId: barber.id,
      displayName: name,
      image,
      publicBranches: barber.branches,
      serviceIds: barber.serviceIds,
    });

    router.push(`/book/with/${barber.id}`);
  };

  const chromeBack =
    mode === "intent"
      ? undefined
      : { href: "/book", label: ar ? "رجوع للبداية" : "Back to start" };

  return (
    <BookFlowChrome backHref={chromeBack?.href} backLabel={chromeBack?.label}>
      {mode === "intent" ? (
        <IntentStep ar={ar} dir={dir} onLocation={goLocationMode} onBarber={goBarberMode} />
      ) : null}

      {mode === "location" ? (
        <LocationStep
          ar={ar}
          Chevron={Chevron}
          branches={branches}
          isLoading={isLoadingBranches}
          error={branchesError}
          onRetry={refetchBranches}
          onSelect={onSelectBranch}
        />
      ) : null}

      {mode === "barber" ? (
        <BarberStep
          ar={ar}
          lang={lang}
          Chevron={Chevron}
          barbers={barbers}
          isLoading={barbersLoading || isLoadingBranches}
          error={barbersError}
          onRetry={() => setBarbersReload((n) => n + 1)}
          onSelect={onSelectBarber}
        />
      ) : null}
    </BookFlowChrome>
  );
}

function IntentStep({
  ar,
  dir,
  onLocation,
  onBarber,
}: {
  ar: boolean;
  dir: "rtl" | "ltr";
  onLocation: () => void;
  onBarber: () => void;
}) {
  const cards = [
    {
      key: "location",
      icon: MapPin,
      eyebrow: ar ? "المسار الأول" : "Path one",
      title: ar ? "اختيار فرع" : "Choose a branch",
      body: ar
        ? "ابدأ بالفرع الأقرب ليك، وبعدين اختار الخدمة والميعاد."
        : "Start with the branch that suits you, then pick your service and time.",
      onClick: onLocation,
    },
    {
      key: "barber",
      icon: Scissors,
      eyebrow: ar ? "المسار الثاني" : "Path two",
      title: ar ? "اختيار حلاق معيّن" : "Choose a barber",
      body: ar
        ? "اختار حلاقك المفضّل، وبعدين نكمّل الحجز بنفس تجربة الحجز التفصيلية."
        : "Choose your preferred barber, then continue in the full booking experience.",
      onClick: onBarber,
    },
  ] as const;

  return (
    <section className="relative bg-cut-soft-ivory px-5 pb-16 pt-8 sm:px-8" dir={dir}>
      <div className="mx-auto max-w-xl">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-black uppercase tracking-[0.22em] text-cut-burgundy"
        >
          {ar ? "مرحبًا بك في الحجز" : "Welcome to booking"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`mt-3 text-[1.85rem] font-black leading-tight text-cut-black sm:text-[2.15rem] ${
            ar ? "font-heading" : "font-display"
          }`}
        >
          {ar ? "ازاي تحب تبدأ؟" : "How would you like to start?"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 max-w-md text-[15px] leading-7 text-cut-black/60"
        >
          {ar
            ? "اختار المسار الأنسب ليك — فرع قريب، أو حلاق معيّن تعرفه وتثق فيه."
            : "Pick the path that fits you — a nearby branch, or a barber you already trust."}
        </motion.p>

        <div className="mt-8 grid gap-3">
          {cards.map((card, index) => (
            <motion.button
              key={card.key}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 + index * 0.06 }}
              onClick={card.onClick}
              className="group flex w-full items-start gap-4 rounded-2xl border border-cut-black/10 bg-cut-ivory px-4 py-5 text-start shadow-[0_10px_30px_rgba(5,5,5,0.04)] transition hover:-translate-y-0.5 hover:border-cut-burgundy/35 hover:shadow-[0_14px_36px_rgba(74,0,15,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-burgundy active:scale-[0.99] sm:px-5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cut-bronze/30 bg-cut-warm-paper text-cut-burgundy transition group-hover:border-cut-burgundy/40 group-hover:bg-cut-burgundy group-hover:text-cut-ivory">
                <card.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cut-burgundy/80">
                  {card.eyebrow}
                </span>
                <span className="mt-1 block text-[1.05rem] font-black text-cut-black sm:text-[1.15rem]">
                  {card.title}
                </span>
                <span className="mt-1.5 block text-[13px] leading-6 text-cut-black/55">
                  {card.body}
                </span>
              </span>
              <ChevronRight
                className={`mt-3 h-5 w-5 shrink-0 text-cut-black/25 transition group-hover:text-cut-burgundy ${
                  ar ? "rotate-180" : ""
                }`}
                strokeWidth={1.75}
                aria-hidden
              />
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationStep({
  ar,
  Chevron,
  branches,
  isLoading,
  error,
  onRetry,
  onSelect,
}: {
  ar: boolean;
  Chevron: typeof ChevronLeft;
  branches: PublicBranch[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (branch: PublicBranch) => void;
}) {
  return (
    <section className="relative bg-cut-soft-ivory">
      <BookDelayedWaitingOverlay
        busy={isLoading}
        delayMs={800}
        lang={ar ? "ar" : "en"}
        label={ar ? "جاري تحميل الفروع…" : "Loading locations…"}
      />
      <div className="border-b border-cut-black/10 px-5 py-5 sm:px-8">
        <h1 className="text-[13px] font-black uppercase tracking-[0.18em] text-cut-black">
          {ar ? "اختر فرع الخدمة" : "Select service location"}
        </h1>
        <p className="mt-2 text-sm text-cut-black/55">
          {ar
            ? "اختار الفرع، وبعدين نكمّل باقي تفاصيل الحجز."
            : "Choose a branch, then continue with the rest of your booking."}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-cut-black/55">
          <Loader2 className="h-4 w-4 animate-spin" />
          {ar ? "جاري تحميل الفروع…" : "Loading locations…"}
        </div>
      )}

      {!isLoading && error && (
        <div className="px-5 py-12 text-center sm:px-8">
          <p className="text-sm text-cut-black/65">
            {ar ? "تعذر تحميل الفروع. حاول مرة أخرى." : "Couldn't load locations. Please try again."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex min-h-11 items-center bg-cut-black px-5 text-sm font-bold text-cut-ivory"
          >
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      )}

      {!isLoading && !error && branches.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-cut-black/55 sm:px-8">
          {ar ? "لا توجد فروع متاحة حاليًا." : "No locations available right now."}
        </p>
      )}

      {!isLoading && !error && branches.length > 0 && (
        <ul className="divide-y divide-cut-black/10">
          {branches.map((branch) => {
            const lines = addressLines(branch.address);
            return (
              <li key={branch.branchCode}>
                <button
                  type="button"
                  onClick={() => onSelect(branch)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-start transition hover:bg-cut-warm-paper/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-burgundy sm:px-8"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-cut-bronze/30 bg-cut-ivory">
                    <span className="font-brand text-[11px] font-black tracking-[0.14em] text-cut-black">
                      CUT
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-cut-black">
                      {branchTitle(branch)}
                    </p>
                    {lines.length > 0 ? (
                      <div className="mt-1 space-y-0.5 text-[13px] leading-5 text-cut-black/55">
                        {lines.map((line) => (
                          <p key={line} className="truncate">
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[13px] text-cut-black/45">
                        {ar ? "الإسكندرية، مصر" : "Alexandria, Egypt"}
                      </p>
                    )}
                  </div>
                  <Chevron className="h-5 w-5 shrink-0 text-cut-black/35" strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function BarberStep({
  ar,
  lang,
  Chevron,
  barbers,
  isLoading,
  error,
  onRetry,
  onSelect,
}: {
  ar: boolean;
  lang: "ar" | "en";
  Chevron: typeof ChevronLeft;
  barbers: PublicBarber[];
  isLoading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (barber: PublicBarber) => void;
}) {
  return (
    <section className="relative bg-cut-soft-ivory">
      <BookDelayedWaitingOverlay
        busy={isLoading}
        delayMs={800}
        lang={lang}
        label={ar ? "جاري تحميل الحلاقين…" : "Loading barbers…"}
      />
      <div className="border-b border-cut-black/10 px-5 py-5 sm:px-8">
        <h1 className="text-[13px] font-black uppercase tracking-[0.18em] text-cut-black">
          {ar ? "اختر حلاقك" : "Choose your barber"}
        </h1>
        <p className="mt-2 text-sm text-cut-black/55">
          {ar
            ? "اختار الحلاق، وبعدين نكمّل خطوات الحجز في الصفحة."
            : "Pick your barber, then continue the booking steps on the next page."}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-cut-black/55">
          <Loader2 className="h-4 w-4 animate-spin" />
          {ar ? "جاري تحميل الحلاقين…" : "Loading barbers…"}
        </div>
      )}

      {!isLoading && error && (
        <div className="px-5 py-12 text-center sm:px-8">
          <p className="text-sm text-cut-black/65">
            {ar ? "تعذر تحميل الحلاقين. حاول مرة أخرى." : "Couldn't load barbers. Please try again."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex min-h-11 items-center bg-cut-black px-5 text-sm font-bold text-cut-ivory"
          >
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      )}

      {!isLoading && !error && barbers.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-cut-black/55 sm:px-8">
          {ar ? "لا يوجد حلاقون متاحون حاليًا." : "No barbers available right now."}
        </p>
      )}

      {!isLoading && !error && barbers.length > 0 && (
        <ul className="divide-y divide-cut-black/10">
          {barbers.map((barber) => {
            const name = resolveBarberDisplayName(barber, lang);
            const role = barber.job || (ar ? "حلاق محترف" : "Professional barber");
            return (
              <li key={barber.id}>
                <button
                  type="button"
                  onClick={() => onSelect(barber)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-start transition hover:bg-cut-warm-paper/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cut-burgundy sm:px-8"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-cut-bronze/25 bg-cut-warm-paper">
                    <BarberPhoto
                      src={resolveBarberPhotoUrl(barber)}
                      name={name}
                      imgClassName="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-cut-black">{name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-cut-black/55">
                      <UserRound className="h-3.5 w-3.5 text-cut-burgundy/70" />
                      {role}
                    </p>
                  </div>
                  <Chevron className="h-5 w-5 shrink-0 text-cut-black/35" strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
