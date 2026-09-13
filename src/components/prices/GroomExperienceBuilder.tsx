"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import type { Language } from "@/lib/i18n/types";
import {
  buildGroomBookingPayload,
  getGroomTotals,
  optionalItemDescription,
  optionalItemName,
  reconcileOptionalSelection,
  resolveSelectedOptionals,
  toggleOptionalSelection,
  type GroomSelection,
} from "@/lib/groomBuilder";
import {
  getGroomExperience,
  getOptionalGroup,
  getPackageCoreIncludes,
  splitSelectableExtras,
  type ApiPackage,
  type GroomOptionalExtra,
  type GroomOptionalGroup,
} from "@/lib/packagesApi";
import { buildBookHref } from "@/lib/book-o2/buildBookHref";

type Props = { language: Language };

const packageName = (item: ApiPackage, language: Language) =>
  (language === "ar" ? item.nameAr ?? item.nameEn : item.nameEn ?? item.nameAr) ?? "";
const includeName = (item: ApiPackage["includes"][number], language: Language) =>
  (language === "ar"
    ? item.nameAr ?? item.name ?? item.nameEn
    : item.nameEn ?? item.name ?? item.nameAr) ?? "";
const groupTitle = (group: GroomOptionalGroup | null, language: Language, fallback: string) => {
  if (!group) return fallback;
  if (language === "ar") return group.titleAr ?? group.titleEn ?? fallback;
  return group.titleEn ?? group.titleAr ?? fallback;
};
const groupDescription = (group: GroomOptionalGroup | null, language: Language) => {
  if (!group) return null;
  if (language === "ar") return group.descriptionAr ?? group.descriptionEn;
  return group.descriptionEn ?? group.descriptionAr;
};
const money = (value: number, language: Language) =>
  language === "ar"
    ? `${value.toLocaleString("en-US")} ج.م`
    : `EGP ${value.toLocaleString("en-US")}`;
const mins = (value: number, language: Language) =>
  language === "ar" ? `${value} دقيقة` : `${value} min`;

function GroomHeader({ language }: { language: Language }) {
  const ar = language === "ar";
  const sideBorder = ar ? "border-r pr-5 md:pr-8" : "border-l pl-5 md:pl-8";
  return (
    <div
      className={`flex flex-col gap-6 border-cut-bronze/35 md:flex-row md:items-end md:justify-between ${sideBorder}`}
    >
      <div className="max-w-2xl">
        <p className="cut-editorial-label">GROOM PACKAGE</p>
        <h2 className={`mt-3 text-4xl font-black md:text-5xl ${ar ? "" : "font-editorial font-semibold"}`}>
          {ar ? "باكدج العريس" : "Groom Package"}
        </h2>
        <p className="mt-4 text-base leading-8 text-cut-ivory/70">
          {ar
            ? "اختر الباكدج المناسب، ضيف اللي محتاجه، واحجز في خطوة واحدة."
            : "Pick a package, add what you need, and book in one step."}
        </p>
      </div>
      <p className="font-display text-sm tracking-[0.28em] text-cut-bronze">
        {ar ? "يوم يليق بك" : "YOUR BIG DAY"}
      </p>
    </div>
  );
}

function SoonNotice({ language, label }: { language: Language; label?: string }) {
  const ar = language === "ar";
  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-cut-bronze/35 bg-cut-black/30 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cut-bronze/45 bg-cut-burgundy/25">
        <Sparkles className="h-5 w-5 text-cut-bronze" />
      </span>
      <p className="font-editorial text-2xl font-semibold text-cut-warm-beige">
        {ar ? "قريبًا" : "Soon"}
      </p>
      <p className="max-w-sm text-sm leading-7 text-cut-ivory/60">
        {label ?? (ar ? "هنضيف الباكدجات هنا قريبًا." : "Packages will be added here soon.")}
      </p>
    </div>
  );
}

function GroomPackageCard({
  item,
  selected,
  onSelect,
  language,
}: {
  item: ApiPackage;
  selected: boolean;
  onSelect: () => void;
  language: Language;
}) {
  const ar = language === "ar";
  const coreIncludes = getPackageCoreIncludes(item);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex h-full flex-col rounded-xl border p-5 text-start transition ${
        selected
          ? "border-cut-bronze bg-cut-burgundy/25 shadow-cut-glow"
          : "border-cut-bronze/25 bg-cut-black/40 hover:border-cut-bronze/55"
      }`}
    >
      {item.popular && (
        <span className="absolute -top-3 right-4 rounded-full bg-cut-bronze px-3 py-1 text-[11px] font-black text-cut-black">
          {ar ? "الأكثر طلبًا" : "Most popular"}
        </span>
      )}
      <h3 className="font-editorial text-2xl font-semibold text-cut-ivory">
        {packageName(item, language)}
      </h3>
      <p className="mt-1 text-xs text-cut-ivory/55">
        {mins(item.durationMinutes ?? 0, language)} · {coreIncludes.length}{" "}
        {ar ? "خدمات" : "services"}
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-cut-ivory/80">
        {coreIncludes.map((service) => (
          <li key={service.serviceId} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-cut-bronze" />
            {includeName(service, language)}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-end justify-between border-t border-cut-ivory/10 pt-4">
        <span className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-cut-warm-beige">
            {money(item.price, language)}
          </span>
          {!!item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-cut-ivory/45 line-through">
              {money(item.originalPrice, language)}
            </span>
          )}
        </span>
        <span
          className={`rounded-md px-3 py-2 text-xs font-bold ${
            selected
              ? "bg-cut-ivory text-cut-black"
              : "border border-cut-bronze/45 text-cut-ivory"
          }`}
        >
          {selected ? (ar ? "مختار" : "Selected") : ar ? "اختيار" : "Select"}
        </span>
      </div>
    </button>
  );
}

function OptionalAddonCard({
  item,
  selected,
  onToggle,
  language,
  exclusive,
}: {
  item: GroomOptionalExtra;
  selected: boolean;
  onToggle: () => void;
  language: Language;
  exclusive?: boolean;
}) {
  const description = optionalItemDescription(item, language);
  return (
    <button
      type="button"
      role={exclusive ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-lg border p-3 text-start transition ${
        selected
          ? "border-cut-bronze bg-cut-burgundy/25"
          : "border-cut-bronze/25 bg-cut-black/30 hover:border-cut-bronze/50"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center border transition ${
          exclusive ? "rounded-full" : "rounded"
        } ${
          selected
            ? "border-cut-bronze bg-cut-bronze text-cut-black"
            : "border-cut-ivory/30"
        }`}
      >
        {selected &&
          (exclusive ? (
            <span className="h-2 w-2 rounded-full bg-cut-black" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-sm font-bold text-cut-ivory">
          {exclusive && <MapPin className="h-3.5 w-3.5 text-cut-bronze" />}
          {optionalItemName(item, language)}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-5 text-cut-ivory/55">{description}</span>
        )}
        {item.durationMinutes != null && item.durationMinutes > 0 && (
          <span className="mt-0.5 block text-xs text-cut-ivory/45">
            {mins(item.durationMinutes, language)}
          </span>
        )}
      </span>
      <span className="shrink-0 text-sm font-black text-cut-warm-beige">
        +{money(item.price, language)}
      </span>
    </button>
  );
}

function GroomAddonsGrid({
  language,
  pack,
  selectedOptionalProIds,
  onToggleOptional,
}: {
  language: Language;
  pack: ApiPackage | null;
  selectedOptionalProIds: number[];
  onToggleOptional: (item: GroomOptionalExtra) => void;
}) {
  const ar = language === "ar";
  const { addons, exclusiveByGroup } = splitSelectableExtras(pack);
  const addonsGroup = getOptionalGroup(pack, "groom_addons");
  const homeGroup =
    getOptionalGroup(pack, "home_visit") ??
    Object.keys(exclusiveByGroup)
      .map((key) => getOptionalGroup(pack, key))
      .find(Boolean) ??
    null;
  const homeVisits = exclusiveByGroup.home_visit ?? exclusiveByGroup[homeGroup?.key ?? ""] ?? [];
  const otherExclusive = Object.entries(exclusiveByGroup).filter(([key]) => key !== "home_visit");

  if (!pack) {
    return (
      <div className="pt-10">
        <p className="text-sm text-cut-ivory/55">
          {ar ? "اختَر باكدج أولاً لعرض الإضافات." : "Select a package to see optional extras."}
        </p>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <p className="text-sm font-bold text-cut-warm-beige">
        {groupTitle(addonsGroup, language, ar ? "أضف لطلبك (اختياري)" : "Add to your order (optional)")}
      </p>
      {addons.length === 0 ? (
        <p className="mt-3 text-sm text-cut-ivory/55">
          {ar ? "لا توجد إضافات متاحة لهذا الباكدج." : "No optional add-ons for this package."}
        </p>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {addons.map((item) => (
            <OptionalAddonCard
              key={item.proId}
              item={item}
              language={language}
              selected={selectedOptionalProIds.includes(item.proId)}
              onToggle={() => onToggleOptional(item)}
            />
          ))}
        </div>
      )}

      {(homeVisits.length > 0 || homeGroup) && (
        <>
          <p className="mt-6 text-sm font-bold text-cut-warm-beige">
            {groupTitle(
              homeGroup,
              language,
              ar ? "زيارة خارجية يوم الفرح (اختياري)" : "Home visit (optional)",
            )}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-cut-ivory/60">
            {groupDescription(homeGroup, language) ??
              (ar
                ? "اختار نطاق الزيارة المناسب حسب مكان تجهيز العريس يوم الفرح."
                : "Choose the visit range that matches your wedding location.")}
          </p>
          {homeVisits.length === 0 ? (
            <p className="mt-3 text-sm text-cut-ivory/55">
              {ar
                ? "لا توجد خيارات زيارة خارجية حاليًا."
                : "No home visit options available right now."}
            </p>
          ) : (
            <div
              className="mt-4 grid gap-2.5 sm:grid-cols-3"
              role="radiogroup"
              aria-label={ar ? "زيارة خارجية" : "Home visit"}
            >
              {homeVisits.map((item) => (
                <OptionalAddonCard
                  key={item.proId}
                  item={item}
                  language={language}
                  exclusive
                  selected={selectedOptionalProIds.includes(item.proId)}
                  onToggle={() => onToggleOptional(item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {otherExclusive.map(([key, items]) => {
        const group = getOptionalGroup(pack, key);
        return (
          <div key={key} className="mt-6">
            <p className="text-sm font-bold text-cut-warm-beige">
              {groupTitle(group, language, key)}
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3" role="radiogroup">
              {items.map((item) => (
                <OptionalAddonCard
                  key={item.proId}
                  item={item}
                  language={language}
                  exclusive
                  selected={selectedOptionalProIds.includes(item.proId)}
                  onToggle={() => onToggleOptional(item)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroomOrderBar({
  language,
  pack,
  selectedOptionals,
  onBook,
}: {
  language: Language;
  pack: ApiPackage;
  selectedOptionals: GroomOptionalExtra[];
  onBook: () => void;
}) {
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const totals = getGroomTotals({ pack, selectedOptionals });
  const itemCount = 1 + selectedOptionals.length;

  return (
    <div className="sticky bottom-0 z-[60] mt-8 border-t border-cut-bronze/40 bg-cut-black/95 backdrop-blur">
      {open && (
        <div className="border-b border-cut-bronze/25 px-5 py-4 text-sm md:px-8">
          <ul className="mx-auto max-w-6xl space-y-1.5 text-cut-ivory/80">
            <li className="flex items-center justify-between">
              <span>{packageName(pack, language)}</span>
              <span>{money(pack.price, language)}</span>
            </li>
            {selectedOptionals.map((item) => (
              <li
                key={item.proId}
                className="flex items-center justify-between text-cut-ivory/65"
              >
                <span>{optionalItemName(item, language)}</span>
                <span>{money(item.price, language)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-cut-ivory/80"
        >
          <ShoppingBag className="h-4 w-4 text-cut-bronze" />
          {itemCount} {ar ? "عناصر" : "items"}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <p className="text-xs text-cut-ivory/55">{mins(totals.totalDuration, language)}</p>
            <p className="text-xl font-black text-cut-warm-beige">
              {money(totals.totalPrice, language)}
            </p>
          </div>
          <button
            type="button"
            onClick={onBook}
            className="min-h-12 rounded-lg bg-cut-ivory px-6 font-bold text-cut-black transition hover:bg-cut-soft-ivory"
          >
            {ar ? "احجز الآن" : "Book now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroomExperienceBuilder({ language }: Props) {
  const ar = language === "ar";
  const router = useRouter();
  const { data, isPending, isError } = useQuery({
    queryKey: ["packages", "groom-experience"],
    queryFn: getGroomExperience,
    staleTime: 60_000,
  });

  const groomPackages = data?.packages ?? [];
  const [selection, setSelection] = useState<GroomSelection>({
    selectedPackageId: null,
    selectedOptionalProIds: [],
  });

  const selectedPack =
    groomPackages.find((item) => item.packageId === selection.selectedPackageId) ?? null;

  useEffect(() => {
    setSelection((current) => {
      const next = reconcileOptionalSelection(current.selectedOptionalProIds, selectedPack);
      if (
        next.length === current.selectedOptionalProIds.length &&
        next.every((id, index) => id === current.selectedOptionalProIds[index])
      ) {
        return current;
      }
      return { ...current, selectedOptionalProIds: next };
    });
  }, [selectedPack]);

  const selectedOptionals = useMemo(
    () => resolveSelectedOptionals(selectedPack, selection.selectedOptionalProIds),
    [selectedPack, selection.selectedOptionalProIds],
  );

  const selectPackage = (id: number) => {
    const nextPack = groomPackages.find((item) => item.packageId === id) ?? null;
    setSelection((current) => ({
      selectedPackageId: id,
      selectedOptionalProIds: reconcileOptionalSelection(
        current.selectedOptionalProIds,
        nextPack,
      ),
    }));
  };

  const onToggleOptional = (item: GroomOptionalExtra) => {
    if (!selectedPack) return;
    setSelection((current) => ({
      ...current,
      selectedOptionalProIds: toggleOptionalSelection(
        current.selectedOptionalProIds,
        item,
        selectedPack,
      ),
    }));
  };

  const book = () => {
    if (!selectedPack) return;
    const totals = getGroomTotals({ pack: selectedPack, selectedOptionals });
    const payload = buildGroomBookingPayload({
      pack: selectedPack,
      selectedOptionals,
      totals,
    });

    window.dispatchEvent(
      new CustomEvent("cut:book-groom", {
        detail: {
          packageId: payload.packageId,
          addonProIds: payload.addonProIds,
          serviceIds: payload.serviceIds,
          note: payload.note,
        },
      }),
    );

    router.push(buildBookHref({ mode: "nearest", serviceIds: payload.serviceIds }));
  };

  return (
    <section
      id="groom"
      className="relative isolate scroll-mt-32 overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(74,0,15,0.48),transparent_34%),#170406] py-20 text-cut-ivory md:py-28"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-cut-bronze/35" />
      <p
        aria-hidden
        className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(5rem,18vw,14rem)] font-black text-cut-ivory/[0.03]"
      >
        {ar ? "العريس" : "GROOM"}
      </p>
      <div className="container relative z-10 px-5 md:px-8">
        <GroomHeader language={language} />
        {isPending && (
          <p className="mt-10 text-sm text-cut-ivory/60">
            {ar ? "جارٍ تحميل الباكدجات..." : "Loading packages..."}
          </p>
        )}
        {isError && (
          <p className="mt-10 text-sm text-cut-ivory/60">
            {ar ? "تعذّر تحميل الباكدجات حاليًا." : "Unable to load packages right now."}
          </p>
        )}
        {!isPending && !isError && groomPackages.length === 0 && (
          <SoonNotice
            language={language}
            label={ar ? "باكدجات العريس هتتوفر قريبًا." : "Groom packages will be available soon."}
          />
        )}
        {!isPending && !isError && groomPackages.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {groomPackages.map((item) => (
              <GroomPackageCard
                key={item.packageId}
                item={item}
                language={language}
                selected={selection.selectedPackageId === item.packageId}
                onSelect={() => selectPackage(item.packageId)}
              />
            ))}
          </div>
        )}
        {groomPackages.length > 0 && (
          <GroomAddonsGrid
            language={language}
            pack={selectedPack}
            selectedOptionalProIds={selection.selectedOptionalProIds}
            onToggleOptional={onToggleOptional}
          />
        )}
      </div>
      {selectedPack && (
        <GroomOrderBar
          language={language}
          pack={selectedPack}
          selectedOptionals={selectedOptionals}
          onBook={book}
        />
      )}
    </section>
  );
}
