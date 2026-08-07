"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { BookFlowChrome } from "@/components/book/BookFlowChrome";
import { useBranch } from "@/context/BranchContext";
import { useLanguage } from "@/context/LanguageContext";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";
import { saveClient } from "@/lib/clientStorage";
import {
  readBookFlowDraft,
  saveBookFlowDraft,
  type BookFlowDraft,
} from "@/lib/book-flow-draft";

type LookupStatus = "idle" | "loading" | "found" | "new" | "error";

function toLocalMobileInput(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("20") && d.length >= 12) return d.slice(2);
  if (d.startsWith("0") && d.length >= 11) return d.slice(1);
  return d;
}

function toLookupDigits(local: string) {
  const d = local.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) return d;
  if (d.startsWith("20")) return d;
  return `0${d}`;
}

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

  const [localPhone, setLocalPhone] = useState(() =>
    toLocalMobileInput(draft?.customer?.phone ?? ""),
  );
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [lookedUpName, setLookedUpName] = useState<string | null>(
    draft?.customer?.name ?? null,
  );
  const [clientId, setClientId] = useState<number | null>(
    draft?.customer?.clientId ?? null,
  );

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

  const lookupDigits = toLookupDigits(localPhone);
  const canContinue = lookupDigits.replace(/\D/g, "").length >= 10;

  useEffect(() => {
    const digits = lookupDigits.replace(/\D/g, "");
    if (digits.length < 10) {
      setLookupStatus("idle");
      setLookedUpName(null);
      setClientId(null);
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
  }, [lookupDigits]);

  const onContinue = () => {
    if (!canContinue || !draft || !branchCode) return;
    const phone = lookupDigits.replace(/\D/g, "");
    const nextDraft: BookFlowDraft = {
      ...draft,
      branchCode,
      visit: visitKind,
      customer: {
        phone,
        name: lookedUpName,
        clientId,
        found: lookupStatus === "found",
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
        <div className="px-5 pt-6 sm:px-6">
          <h1 className="text-[13px] font-black uppercase tracking-[0.14em] text-cut-black">
            {ar ? "أدخل رقم موبايلك" : "Enter your mobile number"}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-cut-black/60">
            {ar
              ? "هنستخدم الرقم ده عشان نلاقي حسابك عندنا ونأكد حجزك."
              : "We'll use this to look up your profile and confirm your booking."}
          </p>
        </div>

        <div className="mt-8 px-5 sm:px-6">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-cut-black/15 bg-cut-ivory">
            <div className="flex items-center gap-2 border-e border-cut-black/10 px-3 text-sm font-semibold text-cut-black">
              <span aria-hidden className="text-base leading-none">
                🇪🇬
              </span>
              <span>EG</span>
              <ChevronDown className="h-3.5 w-3.5 text-cut-black/40" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-2 px-3 text-sm font-semibold text-cut-black/70">
              +20
            </div>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={localPhone}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d\s]/g, "").slice(0, 12);
                setLocalPhone(next.replace(/\s/g, ""));
              }}
              placeholder={ar ? "1xxxxxxxxx" : "1xxxxxxxxx"}
              className="min-w-0 flex-1 bg-transparent px-2 py-3.5 text-base text-cut-black outline-none placeholder:text-cut-black/35"
              aria-label={ar ? "رقم الموبايل" : "Mobile number"}
            />
          </div>

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
            {lookupStatus === "new" ? (
              <p className="text-cut-black/55">
                {ar ? "رقم جديد — هنكمل بياناتك في الخطوات التالية." : "New number — we'll collect your details next."}
              </p>
            ) : null}
            {lookupStatus === "error" ? (
              <p className="text-red-700">
                {ar ? "تعذر البحث الآن. تقدر تكمّل عادي." : "Lookup failed. You can still continue."}
              </p>
            ) : null}
          </div>
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
              ? "بالمتابعة، أنت موافق على سياسة الخصوصية وشروط الاستخدام الخاصة بـ Cut Salon."
              : "By continuing you agree to Cut Salon's Privacy Policy and Terms of Use."}
          </p>
        </div>
      </section>
    </BookFlowChrome>
  );
}
