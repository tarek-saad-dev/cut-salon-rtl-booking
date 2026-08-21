"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import BookingModal, { type BarberBookingInfo } from "@/components/BookingModal";
import { useLanguage } from "@/context/LanguageContext";
import {
  getPublicBarberProfile,
  resolveBarberDisplayName,
  resolveBarberPhotoUrl,
  seedBarberProfileCache,
  type BarberProfileSeed,
  type PublicBarber,
} from "@/lib/booking-api";
import {
  clearBookEntryBarber,
  readBookEntryBarber,
  type BookEntryBarber,
} from "@/lib/book-flow-entry";

function toBookingBarber(
  empId: number,
  entry: BookEntryBarber | null,
  profile: PublicBarber | null,
  lang: "ar" | "en",
): { barber: BarberBookingInfo; profileSeed: BarberProfileSeed } {
  const ar = lang === "ar";
  const name =
    entry?.name ||
    (profile ? resolveBarberDisplayName(profile, lang) : "") ||
    (ar ? "الحلاق" : "Barber");
  const image =
    entry?.image ?? (profile ? resolveBarberPhotoUrl(profile) : null);
  const role =
    entry?.role ||
    profile?.job ||
    (ar ? "حلاق محترف" : "Professional barber");
  const publicBranches =
    profile?.branches ??
    (entry?.branchCodes.length
      ? entry.branchCodes.map((branchCode) => ({
          branchCode,
          branchName: branchCode,
        }))
      : undefined);
  const serviceIds = entry?.serviceIds ?? profile?.serviceIds;

  return {
    barber: {
      id: empId,
      name,
      image,
      role,
      location: ar ? "Cut Salon · الإسكندرية" : "CUT Salon · Alexandria",
      publicBranches,
      serviceIds,
    },
    profileSeed: {
      empId,
      displayName: name,
      image,
      publicBranches,
      serviceIds,
    },
  };
}

export default function BookBarberFirstPage({ empId }: { empId: number }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [barber, setBarber] = useState<BarberBookingInfo | null>(null);
  const [profileSeed, setProfileSeed] = useState<BarberProfileSeed | null>(
    null,
  );
  const [sessionKey, setSessionKey] = useState(0);

  const ar = lang === "ar";

  useEffect(() => {
    if (!Number.isFinite(empId) || empId <= 0) {
      setStatus("missing");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setStatus("loading");

    (async () => {
      const entry = readBookEntryBarber();
      const entryMatch = entry?.id === empId ? entry : null;

      let profile: PublicBarber | null = null;
      try {
        const res = await getPublicBarberProfile(empId, controller.signal);
        profile = res.data ?? null;
      } catch {
        profile = null;
      }

      if (cancelled) return;

      if (!entryMatch && !profile) {
        setStatus("missing");
        return;
      }

      const next = toBookingBarber(empId, entryMatch, profile, lang);
      seedBarberProfileCache(next.profileSeed);
      setBarber(next.barber);
      setProfileSeed(next.profileSeed);
      setSessionKey((k) => k + 1);
      setStatus("ready");
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [empId, lang]);

  const leave = () => {
    clearBookEntryBarber();
    router.push("/book?mode=barber");
  };

  const loadingCopy = useMemo(
    () => (ar ? "جاري تجهيز الحجز…" : "Preparing your booking…"),
    [ar],
  );

  if (status === "missing") {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-cut-soft-ivory px-6 text-center">
        <p className="text-sm text-cut-black/65">
          {ar
            ? "مش لاقين الحلاق ده. اختار حلاق تاني من القائمة."
            : "We couldn’t find that barber. Pick another from the list."}
        </p>
        <button
          type="button"
          onClick={leave}
          className="rounded-full bg-cut-burgundy px-5 py-2.5 text-sm font-semibold text-cut-ivory"
        >
          {ar ? "رجوع لاختيار الحلاق" : "Back to barbers"}
        </button>
      </main>
    );
  }

  if (status !== "ready" || !barber) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-[var(--booking-bg,#fdfbf7)]">
        <Loader2 className="h-6 w-6 animate-spin text-cut-burgundy" />
        <p className="text-sm text-cut-black/55">{loadingCopy}</p>
      </main>
    );
  }

  return (
    <BookingModal
      key={sessionKey}
      open
      presentation="page"
      fromBookFlow
      entryMode="barber_first"
      initialMode="specific"
      initialAvailabilityScope="all_branches"
      barber={barber}
      profileSeed={profileSeed}
      onOpenChange={(next) => {
        if (!next) leave();
      }}
    />
  );
}
