"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { saveClient } from "@/lib/clientStorage";
import {
  BOOK_PHONE_COUNTRIES,
  detectPhoneCountry,
  isInternationalPhoneReady,
  nationalFromStored,
  toInternationalDigits,
  type BookPhoneCountry,
} from "@/lib/phone-countries";
import {
  readBookFlowDraft,
  saveBookFlowDraft,
  type BookFlowDraft,
} from "@/lib/book-flow-draft";

type LookupStatus = "idle" | "loading" | "found" | "new" | "error";

export default function BookPhoneClient() {
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

  const cartHref = branchCode
    ? `/book/cart?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`
    : "/book";

  const initialCountry = useMemo(
    () => detectPhoneCountry(draft?.customer?.phone ?? ""),
    [draft?.customer?.phone],
  );

  const [country, setCountry] = useState<BookPhoneCountry>(initialCountry);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [localPhone, setLocalPhone] = useState(() =>
    nationalFromStored(draft?.customer?.phone ?? "", initialCountry),
  );
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [lookedUpName, setLookedUpName] = useState<string | null>(
    draft?.customer?.name ?? null,
  );
  const [newCustomerName, setNewCustomerName] = useState(
    () =>
      draft?.customer?.found === false
        ? (draft.customer.name || "").trim()
        : "",
  );
  const [clientId, setClientId] = useState<number | null>(
    draft?.customer?.clientId ?? null,
  );
  const pickerRef = useRef<HTMLDivElement>(null);

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
    if (!draft?.serviceIds?.length || !draft.professional) {
      router.replace(cartHref);
    }
  }, [draft, router, cartHref]);

  useEffect(() => {
    if (!countryOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setCountryOpen(false);
        setCountryQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [countryOpen]);

  const internationalDigits = toInternationalDigits(country, localPhone);
  const resolvedName =
    lookupStatus === "found"
      ? (lookedUpName || "").trim()
      : lookupStatus === "new" || lookupStatus === "error"
        ? newCustomerName.trim()
        : "";
  const needsNewName = lookupStatus === "new" || lookupStatus === "error";
  const canContinue =
    isInternationalPhoneReady(internationalDigits) &&
    lookupStatus !== "loading" &&
    lookupStatus !== "idle" &&
    resolvedName.length >= 2;

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return BOOK_PHONE_COUNTRIES;
    return BOOK_PHONE_COUNTRIES.filter((c) => {
      const name = (ar ? c.nameAr : c.nameEn).toLowerCase();
      return (
        name.includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/^\+/, ""))
      );
    });
  }, [countryQuery, ar]);

  useEffect(() => {
    const digits = internationalDigits.replace(/\D/g, "");
    if (!isInternationalPhoneReady(digits)) {
      setLookupStatus("idle");
      setLookedUpName(null);
      setClientId(null);
      setNewCustomerName("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookupStatus("loading");
      const controller = new AbortController();
      const kill = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(
          `/api/client/lookup?mobile=${encodeURIComponent(digits)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          ok?: boolean;
          found?: boolean;
          client?: { id?: number; name?: string; mobile?: string };
        };
        if (cancelled) return;
        if (data.ok && data.found && data.client?.name) {
          const name = String(data.client.name).trim();
          setLookedUpName(name);
          setClientId(typeof data.client.id === "number" ? data.client.id : null);
          setLookupStatus("found");
          saveClient({
            id: data.client.id,
            name,
            phone: String(data.client.mobile || digits).replace(/\D/g, "") || digits,
          });
        } else if (data.ok) {
          setLookedUpName(null);
          setClientId(null);
          setLookupStatus("new");
        } else {
          setLookupStatus("error");
        }
      } catch {
        if (!cancelled) {
          setLookedUpName(null);
          setClientId(null);
          setLookupStatus("new");
        }
      } finally {
        clearTimeout(kill);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [internationalDigits]);

  const onSelectCountry = (next: BookPhoneCountry) => {
    setCountry(next);
    setCountryOpen(false);
    setCountryQuery("");
    setLookupStatus("idle");
    setLookedUpName(null);
    setClientId(null);
  };

  const onContinue = () => {
    if (!canContinue || !draft || !branchCode) return;
    const phone = internationalDigits.replace(/\D/g, "");
    const name = resolvedName;
    const found = lookupStatus === "found";

    saveClient({
      ...(clientId != null ? { id: clientId } : {}),
      name,
      phone,
    });

    const nextDraft: BookFlowDraft = {
      ...draft,
      branchCode,
      visit: visitKind,
      customer: {
        phone,
        name,
        clientId,
        found,
      },
      appointment: null,
    };
    saveBookFlowDraft(nextDraft);
    router.push(
      `/book/time?branch=${encodeURIComponent(branchCode)}&visit=${visitKind}`,
    );
  };

  return (
    <BookFlowChrome
      backHref={cartHref}
      backLabel={ar ? "رجوع للسلة" : "Back to cart"}
      footer={false}
    >
      <section className="relative -mt-4 min-h-[55svh] rounded-t-[1.75rem] bg-cut-soft-ivory pb-36 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <BookDelayedWaitingOverlay
          busy={lookupStatus === "loading"}
          delayMs={600}
          lang={lang}
          label={ar ? "جاري التحقق من الرقم…" : "Looking up your number…"}
        />
        <div className="px-5 pt-6 sm:px-6">
          <h1 className="text-[13px] font-black uppercase tracking-[0.14em] text-cut-black">
            {ar ? "أدخل رقم موبايلك" : "Enter your mobile number"}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-cut-black/60">
            {ar
              ? "نستخدم الرقم للبحث عن حسابك وتأكيد الحجز. يمكنك اختيار دولتك."
              : "We’ll use this number to find your profile and confirm your booking. Pick your country."}
          </p>
        </div>

        <div className="mt-8 px-5 sm:px-6">
          <div className="relative" ref={pickerRef}>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-cut-black/15 bg-cut-ivory focus-within:border-cut-burgundy focus-within:ring-2 focus-within:ring-cut-burgundy/15">
              <button
                type="button"
                onClick={() => setCountryOpen((v) => !v)}
                aria-expanded={countryOpen}
                aria-haspopup="listbox"
                className="inline-flex shrink-0 items-center gap-1.5 border-e border-cut-black/10 px-3 py-3.5 text-sm font-semibold text-cut-black transition hover:bg-cut-warm-paper/70"
              >
                <span aria-hidden className="text-base leading-none">
                  {country.flag}
                </span>
                <span className="tabular-nums text-cut-black/80">+{country.dial}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-cut-black/40 transition ${countryOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={localPhone}
                onChange={(e) => {
                  const next = e.target.value
                    .replace(/[^\d\s]/g, "")
                    .replace(/\s/g, "")
                    .slice(0, country.maxNational);
                  setLocalPhone(next);
                }}
                placeholder={country.placeholder}
                className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-cut-black outline-none placeholder:text-cut-black/35"
                aria-label={ar ? "رقم الموبايل" : "Mobile number"}
                dir="ltr"
              />
            </div>

            {countryOpen ? (
              <div
                className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-cut-black/10 bg-cut-ivory shadow-[0_16px_48px_rgba(74,0,15,0.14)]"
                role="listbox"
                aria-label={ar ? "اختر الدولة" : "Choose country"}
              >
                <div className="flex items-center gap-2 border-b border-cut-black/8 px-3 py-2.5">
                  <Search className="h-4 w-4 text-cut-black/35" strokeWidth={2} />
                  <input
                    type="search"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder={ar ? "ابحث عن دولة…" : "Search country…"}
                    className="min-w-0 flex-1 bg-transparent text-sm text-cut-black outline-none placeholder:text-cut-black/40"
                    autoFocus
                  />
                </div>
                <ul className="max-h-64 overflow-y-auto py-1">
                  {filteredCountries.map((c) => {
                    const selected = c.iso === country.iso;
                    return (
                      <li key={`${c.iso}-${c.dial}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => onSelectCountry(c)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-start transition ${
                            selected
                              ? "bg-cut-burgundy/10 text-cut-burgundy"
                              : "text-cut-black hover:bg-cut-warm-paper/80"
                          }`}
                        >
                          <span className="text-lg leading-none" aria-hidden>
                            {c.flag}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {ar ? c.nameAr : c.nameEn}
                          </span>
                          <span className="shrink-0 tabular-nums text-sm text-cut-black/55">
                            +{c.dial}
                          </span>
                          {selected ? (
                            <Check className="h-4 w-4 shrink-0 text-cut-burgundy" strokeWidth={2.25} />
                          ) : (
                            <span className="w-4" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {filteredCountries.length === 0 ? (
                    <li className="px-3 py-4 text-center text-sm text-cut-black/45">
                      {ar ? "لا توجد نتائج" : "No results"}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>

          <p className="mt-2 text-[12px] text-cut-black/45" dir="ltr">
            +{country.dial}
            {localPhone ? ` ${localPhone}` : ""}
          </p>

          <div className="mt-3 min-h-6 text-sm">
            {lookupStatus === "loading" ? (
              <p className="inline-flex items-center gap-2 text-cut-black/55">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {ar ? "جاري البحث عن رقمك…" : "Looking up your number…"}
              </p>
            ) : null}
            {lookupStatus === "found" && lookedUpName ? (
              <p className="text-cut-burgundy">
                {ar ? `مرحبًا ${lookedUpName}` : `Welcome back, ${lookedUpName}`}
              </p>
            ) : null}
            {needsNewName ? (
              <p className="text-cut-black/55">
                {ar
                  ? "رقم جديد — يرجى إدخال اسمك للمتابعة."
                  : "New number — please enter your name to continue."}
              </p>
            ) : null}
          </div>

          {needsNewName ? (
            <div className="mt-5">
              <label
                htmlFor="book-phone-name"
                className="mb-2 block text-[13px] font-semibold text-cut-black"
              >
                {ar ? "الاسم" : "Name"}
              </label>
              <input
                id="book-phone-name"
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value.slice(0, 80))}
                placeholder={ar ? "اكتب اسمك هنا" : "Enter your name"}
                className="min-h-11 w-full rounded-xl border border-cut-black/15 bg-cut-ivory px-3 text-sm text-cut-black outline-none placeholder:text-cut-black/35 focus:border-cut-burgundy focus:ring-2 focus:ring-cut-burgundy/15"
                autoComplete="name"
              />
              {newCustomerName.trim().length > 0 && newCustomerName.trim().length < 2 ? (
                <p className="mt-2 text-[12px] text-cut-black/50">
                  {ar ? "الاسم قصير جدًا." : "Name is too short."}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cut-black/10 bg-cut-soft-ivory/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cut-black text-sm font-bold uppercase tracking-[0.14em] text-cut-ivory transition hover:bg-cut-wine-black disabled:opacity-40"
          >
            {ar ? "متابعة" : "Continue"}
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-cut-black/45">
            {ar
              ? "بالمتابعة، أنت توافق على سياسة الخصوصية وشروط الاستخدام الخاصة بـ Cut Salon."
              : "By continuing you agree to Cut Salon’s Privacy Policy and Terms of Use."}
          </p>
        </div>
      </section>
    </BookFlowChrome>
  );
}
