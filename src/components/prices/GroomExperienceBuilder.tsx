"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import type { Language } from "@/lib/i18n/types";
import { groomAddons, locationVisits, type GroomAddon, type LocationVisit } from "@/lib/groomBuilder";
import { getPackages, type ApiPackage } from "@/lib/packagesApi";

type Props = { language: Language };
type Selection = { selectedPackageId: number | null; selectedAddonIds: string[]; selectedLocationVisit: LocationVisit["id"] | null };
const packageName = (item: ApiPackage, language: Language) => (language === "ar" ? item.nameAr ?? item.nameEn : item.nameEn ?? item.nameAr) ?? "";
const includeName = (item: ApiPackage["includes"][number], language: Language) => (language === "ar" ? item.nameAr ?? item.name ?? item.nameEn : item.nameEn ?? item.name ?? item.nameAr) ?? "";
const text = <T extends Record<Language, string>>(value: T, language: Language) => value[language];
const money = (value: number, language: Language) => language === "ar" ? `${value.toLocaleString("en-US")} ج.م` : `EGP ${value.toLocaleString("en-US")}`;
const mins = (value: number, language: Language) => language === "ar" ? `${value} دقيقة` : `${value} min`;

function GroomHeader({ language }: { language: Language }) {
  const ar = language === "ar";
  const sideBorder = ar ? "border-r pr-5 md:pr-8" : "border-l pl-5 md:pl-8";
  return (
    <div className={`flex flex-col gap-6 border-cut-bronze/35 md:flex-row md:items-end md:justify-between ${sideBorder}`}>
      <div className="max-w-2xl">
        <p className="cut-editorial-label">GROOM PACKAGE</p>
        <h2 className={`mt-3 text-4xl font-black md:text-5xl ${ar ? "" : "font-editorial font-semibold"}`}>{ar ? "باكدج العريس" : "Groom Package"}</h2>
        <p className="mt-4 text-base leading-8 text-cut-ivory/70">{ar ? "اختر الباكدج المناسب، ضيف اللي محتاجه، واحجز في خطوة واحدة." : "Pick a package, add what you need, and book in one step."}</p>
      </div>
      <p className="font-display text-sm tracking-[0.28em] text-cut-bronze">{ar ? "يوم يليق بك" : "YOUR BIG DAY"}</p>
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
      <p className="font-editorial text-2xl font-semibold text-cut-warm-beige">{ar ? "قريبًا" : "Soon"}</p>
      <p className="max-w-sm text-sm leading-7 text-cut-ivory/60">{label ?? (ar ? "هنضيف الباكدجات هنا قريبًا." : "Packages will be added here soon.")}</p>
    </div>
  );
}

function GroomPackageCard({ item, selected, onSelect, language }: { item: ApiPackage; selected: boolean; onSelect: () => void; language: Language }) {
  const ar = language === "ar";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex h-full flex-col rounded-xl border p-5 text-start transition ${selected ? "border-cut-bronze bg-cut-burgundy/25 shadow-cut-glow" : "border-cut-bronze/25 bg-cut-black/40 hover:border-cut-bronze/55"}`}
    >
      {item.popular && (
        <span className="absolute -top-3 right-4 rounded-full bg-cut-bronze px-3 py-1 text-[11px] font-black text-cut-black">
          {ar ? "الأكثر طلبًا" : "Most popular"}
        </span>
      )}
      <h3 className="font-editorial text-2xl font-semibold text-cut-ivory">{packageName(item, language)}</h3>
      <p className="mt-1 text-xs text-cut-ivory/55">{mins(item.durationMinutes ?? 0, language)} · {item.includes.length} {ar ? "خدمات" : "services"}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-cut-ivory/80">
        {item.includes.map((service) => (
          <li key={service.serviceId} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-cut-bronze" />
            {includeName(service, language)}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-end justify-between border-t border-cut-ivory/10 pt-4">
        <span className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-cut-warm-beige">{money(item.price, language)}</span>
          {!!item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-cut-ivory/45 line-through">{money(item.originalPrice, language)}</span>
          )}
        </span>
        <span className={`rounded-md px-3 py-2 text-xs font-bold ${selected ? "bg-cut-ivory text-cut-black" : "border border-cut-bronze/45 text-cut-ivory"}`}>
          {selected ? (ar ? "مختار" : "Selected") : (ar ? "اختيار" : "Select")}
        </span>
      </div>
    </button>
  );
}

type MergedAddon =
  | { kind: "service"; id: string; name: GroomAddon["name"]; price: number; duration: number }
  | { kind: "visit"; id: LocationVisit["id"]; name: LocationVisit["name"]; price: number; duration: number };

function GroomAddonsGrid({ language, selectedAddonIds, selectedLocationVisit, onToggleAddon, onSelectVisit }: {
  language: Language;
  selectedAddonIds: string[];
  selectedLocationVisit: Selection["selectedLocationVisit"];
  onToggleAddon: (id: string) => void;
  onSelectVisit: (id: Selection["selectedLocationVisit"]) => void;
}) {
  const ar = language === "ar";
  const services: MergedAddon[] = groomAddons.map((item) => ({ kind: "service" as const, id: item.id, name: item.name, price: item.packagePrice, duration: item.duration }));
  const visits: MergedAddon[] = locationVisits.map((item) => ({ kind: "visit" as const, id: item.id, name: item.name, price: item.price, duration: item.duration }));

  const isSelected = (item: MergedAddon) => item.kind === "service" ? selectedAddonIds.includes(item.id) : selectedLocationVisit === item.id;
  const toggle = (item: MergedAddon) => item.kind === "service" ? onToggleAddon(item.id) : onSelectVisit(selectedLocationVisit === item.id ? null : item.id);

  const renderCard = (item: MergedAddon) => {
    const selected = isSelected(item);
    return (
      <button
        type="button"
        key={`${item.kind}-${item.id}`}
        onClick={() => toggle(item)}
        aria-pressed={selected}
        className={`flex items-center gap-3 rounded-lg border p-3 text-start transition ${selected ? "border-cut-bronze bg-cut-burgundy/25" : "border-cut-bronze/25 bg-cut-black/30 hover:border-cut-bronze/50"}`}
      >
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-cut-bronze bg-cut-bronze text-cut-black" : "border-cut-ivory/30"}`}>
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-bold text-cut-ivory">
            {item.kind === "visit" && <MapPin className="h-3.5 w-3.5 text-cut-bronze" />}
            {text(item.name, language)}
          </span>
          <span className="block text-xs text-cut-ivory/55">{mins(item.duration, language)}</span>
        </span>
        <span className="shrink-0 text-sm font-black text-cut-warm-beige">+{money(item.price, language)}</span>
      </button>
    );
  };

  return (
    <div className="pt-10">
      <p className="text-sm font-bold text-cut-warm-beige">{ar ? "ضيف لطلبك (اختياري)" : "Add to your order (optional)"}</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map(renderCard)}
      </div>
      <p className="mt-6 text-sm font-bold text-cut-warm-beige">{ar ? "الزيارة المنزلية (اختياري)" : "Home visit (optional)"}</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {visits.map(renderCard)}
      </div>
    </div>
  );
}

function GroomOrderBar({ language, selection, packages, onBook }: { language: Language; selection: Selection; packages: ApiPackage[]; onBook: () => void }) {
  const ar = language === "ar";
  const pack = packages.find((item) => item.packageId === selection.selectedPackageId);
  const addons = groomAddons.filter((item) => selection.selectedAddonIds.includes(item.id));
  const visit = locationVisits.find((item) => item.id === selection.selectedLocationVisit);
  const [open, setOpen] = useState(false);
  if (!pack) return null;
  const totalPrice = pack.price + addons.reduce((sum, item) => sum + item.packagePrice, 0) + (visit?.price ?? 0);
  const totalDuration = (pack.durationMinutes ?? 0) + addons.reduce((sum, item) => sum + item.duration, 0) + (visit?.duration ?? 0);
  const itemCount = 1 + addons.length + (visit ? 1 : 0);

  return (
    <div className="sticky bottom-0 z-[60] mt-8 border-t border-cut-bronze/40 bg-cut-black/95 backdrop-blur">
      {open && (
        <div className="border-b border-cut-bronze/25 px-5 py-4 text-sm md:px-8">
          <ul className="mx-auto max-w-6xl space-y-1.5 text-cut-ivory/80">
            <li className="flex items-center justify-between"><span>{packageName(pack, language)}</span><span>{money(pack.price, language)}</span></li>
            {addons.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-cut-ivory/65"><span>{text(item.name, language)}</span><span>{money(item.packagePrice, language)}</span></li>
            ))}
            {visit && (
              <li className="flex items-center justify-between text-cut-ivory/65"><span>{text(visit.name, language)}</span><span>{money(visit.price, language)}</span></li>
            )}
          </ul>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-sm font-bold text-cut-ivory/80">
          <ShoppingBag className="h-4 w-4 text-cut-bronze" />
          {itemCount} {ar ? "عناصر" : "items"}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <p className="text-xs text-cut-ivory/55">{mins(totalDuration, language)}</p>
            <p className="text-xl font-black text-cut-warm-beige">{money(totalPrice, language)}</p>
          </div>
          <button type="button" onClick={onBook} className="min-h-12 rounded-lg bg-cut-ivory px-6 font-bold text-cut-black transition hover:bg-cut-soft-ivory">
            {ar ? "احجز الآن" : "Book now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroomExperienceBuilder({ language }: Props) {
  const ar = language === "ar";
  const { data: groomPackages = [], isPending, isError } = useQuery({
    queryKey: ["packages", "groom"],
    queryFn: () => getPackages("groom"),
    staleTime: 60_000,
  });
  const [selection, setSelection] = useState<Selection>({ selectedPackageId: null, selectedAddonIds: [], selectedLocationVisit: null });

  const selectPackage = (id: number) =>
    setSelection((current) => ({ ...current, selectedPackageId: id }));

  const toggleAddon = (id: string) =>
    setSelection((current) => ({
      ...current,
      selectedAddonIds: current.selectedAddonIds.includes(id)
        ? current.selectedAddonIds.filter((item) => item !== id)
        : [...current.selectedAddonIds, id],
    }));

  const selectVisit = (id: Selection["selectedLocationVisit"]) =>
    setSelection((current) => ({ ...current, selectedLocationVisit: id }));

  const book = () => {
    const pack = groomPackages.find((item) => item.packageId === selection.selectedPackageId);
    if (!pack) return;
    const addons = groomAddons.filter((item) => selection.selectedAddonIds.includes(item.id));
    const visit = locationVisits.find((item) => item.id === selection.selectedLocationVisit);
    const totalPrice = pack.price + addons.reduce((sum, item) => sum + item.packagePrice, 0) + (visit?.price ?? 0);
    const totalDuration = (pack.durationMinutes ?? 0) + addons.reduce((sum, item) => sum + item.duration, 0) + (visit?.duration ?? 0);
    window.dispatchEvent(new CustomEvent("cut:book-groom", {
      detail: {
        serviceIds: pack.includes.map((item) => item.serviceId),
        serviceMatches: addons.flatMap((item) => item.match),
        note: JSON.stringify({
          source: "groom-experience",
          package: { id: pack.packageId, label: { ar: pack.nameAr, en: pack.nameEn }, price: pack.price, duration: pack.durationMinutes },
          addons: addons.map((item) => ({ id: item.id, label: item.name, price: item.packagePrice, duration: item.duration })),
          locationVisit: visit ? { id: visit.id, label: visit.name, price: visit.price, duration: visit.duration } : null,
          totals: { totalPrice, totalDuration },
        }),
      },
    }));
    document.getElementById("barbers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="groom" className="relative isolate scroll-mt-32 overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(74,0,15,0.48),transparent_34%),#170406] py-20 text-cut-ivory md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-cut-bronze/35" />
      <p aria-hidden className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-[clamp(5rem,18vw,14rem)] font-black text-cut-ivory/[0.03]">{ar ? "العريس" : "GROOM"}</p>
      <div className="container relative z-10 px-5 md:px-8">
        <GroomHeader language={language} />
        {isPending && <p className="mt-10 text-sm text-cut-ivory/60">{ar ? "جارٍ تحميل الباكدجات..." : "Loading packages..."}</p>}
        {isError && <p className="mt-10 text-sm text-cut-ivory/60">{ar ? "تعذّر تحميل الباكدجات حاليًا." : "Unable to load packages right now."}</p>}
        {!isPending && !isError && groomPackages.length === 0 && (
          <SoonNotice language={language} label={ar ? "باكدجات العريس هتتوفر قريبًا." : "Groom packages will be available soon."} />
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
            selectedAddonIds={selection.selectedAddonIds}
            selectedLocationVisit={selection.selectedLocationVisit}
            onToggleAddon={toggleAddon}
            onSelectVisit={selectVisit}
          />
        )}
      </div>
      <GroomOrderBar language={language} selection={selection} packages={groomPackages} onBook={book} />
    </section>
  );
}