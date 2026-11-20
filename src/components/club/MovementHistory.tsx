"use client";
import { useState } from "react";

export type HistoryMovement = Readonly<{ id: string; title: string; occurredAtLabel: string; coinsDelta: number }>;
type Filter = "all" | "earn" | "spend";
const filters: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "الكل" }, { id: "earn", label: "اكتساب" }, { id: "spend", label: "صرف" },
];
type ApiItem = { id: string; title: string; occurredAt: string; coinsDelta: number };

function label(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" }).format(d)
    : "";
}

/**
 * Starts from the wallet's latest movements; "full history" switches to the paginated,
 * filterable /api/club/activity feed (read-only).
 */
export default function MovementHistory({ initial }: { initial: readonly HistoryMovement[] }) {
  const [items, setItems] = useState<readonly HistoryMovement[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async (nextFilter: Filter, nextCursor: string | null) => {
    setLoading(true); setError(false);
    try {
      const q = new URLSearchParams({ type: nextFilter });
      if (nextCursor) q.set("cursor", nextCursor);
      const res = await fetch("/api/club/activity?" + q.toString(), { cache: "no-store", credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || data?.ok !== true || !Array.isArray(data.items)) throw Error("FAILED");
      const page = (data.items as ApiItem[]).map(i => ({ id: i.id, title: i.title, occurredAtLabel: label(i.occurredAt), coinsDelta: i.coinsDelta }));
      setItems(prev => nextCursor ? [...prev, ...page] : page);
      setCursor(typeof data.nextCursor === "string" ? data.nextCursor : null);
      setFilter(nextFilter); setExpanded(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  return <>
    {expanded && <div role="tablist" aria-label="فلترة السجل" className="mt-4 flex gap-2">
      {filters.map(f => <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} disabled={loading}
        onClick={() => void load(f.id, null)}
        className={"min-h-9 rounded-lg px-3 text-xs font-bold " + (filter === f.id ? "bg-[#ead7c4] text-[#31131e]" : "border border-white/15 text-[#e2c0a4]")}>{f.label}</button>)}
    </div>}
    {items.length === 0
      ? <p className="mt-5 text-sm text-[#bca69a]">مفيش حركات في الفلتر ده.</p>
      : <ul className="mt-5 divide-y divide-white/10">{items.map(m => <li key={m.id} className="flex items-center justify-between gap-3 py-4">
        <div><p className="text-sm font-semibold">{m.title}</p><p className="mt-1 text-xs text-[#b9a396]">{m.occurredAtLabel}</p></div>
        <span dir="ltr" className="text-sm font-bold text-[#e9cbb0]">{m.coinsDelta > 0 ? "+" : ""}{m.coinsDelta} CC</span>
      </li>)}</ul>}
    {error && <p role="alert" className="mt-3 text-xs text-red-300">تعذر تحميل السجل. حاول تاني بعد شوية.</p>}
    {!expanded
      ? <button type="button" disabled={loading} onClick={() => void load("all", null)} className="mt-4 text-sm font-bold text-[#e6c5a8] underline disabled:opacity-50">{loading ? "جاري التحميل…" : "عرض السجل الكامل"}</button>
      : cursor && <button type="button" disabled={loading} onClick={() => void load(filter, cursor)} className="mt-4 text-sm font-bold text-[#e6c5a8] underline disabled:opacity-50">{loading ? "جاري التحميل…" : "عرض المزيد"}</button>}
  </>;
}
