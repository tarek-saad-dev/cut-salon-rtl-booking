"use client";

import { useRef, useState } from "react";

export type ClubVoucherStatus = "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
export type ClubVoucherSummary = Readonly<{
  inventoryId: number;
  title: string;
  status: ClubVoucherStatus;
  expiresAt: string | null;
}>;
export type VerifiedVoucherCode = Readonly<{
  inventoryId: number;
  voucherCode: string;
  expiresAt: string | null;
}>;
export type ClientVoucherHandoffProps = Readonly<{
  vouchers: readonly ClubVoucherSummary[] | null;
  /**
   * Trusted BFF must verify durable customer session and voucher ownership.
   * This component NEVER fetches or selects a clientId. No code in initial HTML.
   */
  revealCode: (inventoryId: number) => Promise<VerifiedVoucherCode | null>;
  /** OFF until real verified WhatsApp identity + approved BFF. */
  memberSessionReady: boolean;
}>;

const labels: Record<ClubVoucherStatus, string> = {
  ACTIVE: "صالحة", USED: "مستخدمة", EXPIRED: "منتهية", CANCELLED: "ملغاة",
};
const validId = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x > 0;
const validCode = (x: unknown): x is string => typeof x === "string" && /^[A-Z0-9-]{6,100}$/.test(x);

function expiryLabel(x: string | null): string {
  if (!x) return "بدون تاريخ انتهاء مسجل";
  const time = Date.parse(x);
  if (!Number.isFinite(time)) return "تاريخ الصلاحية غير متاح";
  return new Date(time).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
}

export function ClientVoucherHandoff({ vouchers, revealCode, memberSessionReady }: ClientVoucherHandoffProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const requestSerial = useRef(0);

  async function showCode(item: ClubVoucherSummary) {
    if (!memberSessionReady || item.status !== "ACTIVE" || !validId(item.inventoryId)) return;
    const serial = ++requestSerial.current;
    setSelectedId(item.inventoryId); setCode(null);
    setMessage(""); setPending(true);
    try {
      const proof = await revealCode(item.inventoryId);
      if (requestSerial.current !== serial) return;
      if (!proof || proof.inventoryId !== item.inventoryId ||
          !validCode(proof.voucherCode) ||
          (proof.expiresAt !== null &&
            (!Number.isFinite(Date.parse(proof.expiresAt)) || Date.parse(proof.expiresAt) <= Date.now()))) {
        setMessage("تعذر عرض الكود الآن. حدّث الصفحة أو راجع الاستقبال.");
        return;
      }
      setCode(proof.voucherCode);
      setMessage("اعرض الكود للكاشير بعد حفظ الفاتورة؛ الفحص وحده لا يستهلك القسيمة.");
    } catch {
      if (requestSerial.current === serial)
        setMessage("تعذر الاتصال بخدمة القسائم. لم يتم استخدام أي قسيمة.");
    } finally {
      if (requestSerial.current === serial) setPending(false);
    }
  }
  function hideCode() {
    requestSerial.current++;
    setCode(null); setSelectedId(null); setPending(false); setMessage("");
  }
  async function copyCode() {
    if (!code || !validCode(code)) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage("تم نسخ الكود. اعرضه للكاشير عند زيارتك.");
    } catch {
      setMessage("مش قادرين ننسخ الكود تلقائيًا. تقدر تعرضه للكاشير من الشاشة.");
    }
  }

  return (
    <section dir="rtl" aria-labelledby="club-vouchers-title" className="space-y-4 rounded-2xl border border-[#a48879]/30 bg-[#170d10] p-5 text-[#fcf9ed] sm:p-7">
      <div>
        <p className="text-xs font-semibold tracking-widest text-[#d2b7a3]">CUT CLUB / WALLET</p>
        <h2 id="club-vouchers-title" className="mt-2 text-xl font-bold">قسائمي</h2>
        <p className="mt-2 text-sm leading-6 text-[#c3b4aa]">قسائمك بتظهر هنا بعد التحقق من حسابك. الكاشير بيتأكد من الكود والفاتورة قبل الاستخدام.</p>
      </div>
      {!memberSessionReady ? (
        <p role="status" className="rounded-xl border border-[#d2b7a3]/30 bg-[#a48879]/10 p-4 text-sm leading-6">
          عرض الأكواد متوقف لحد تفعيل تسجيل الدخول الآمن برسالة واتساب. تقدر تحجز عادي من غير تسجيل دخول.
        </p>
      ) : vouchers === null ? (
        <p role="status" className="rounded-lg border border-white/10 p-4 text-sm text-[#c3b4aa]">مش قادرين نحمل قسائمك حاليًا.</p>
      ) : vouchers.length === 0 ? (
        <p role="status" className="rounded-lg border border-white/10 p-4 text-sm text-[#c3b4aa]">مافيش قسائم مسجلة في محفظتك دلوقتي.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vouchers.map(v => (
            <li key={v.inventoryId} className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#a48879]/25 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{v.title}</h3>
                <span className="shrink-0 rounded-full border border-white/20 px-2 py-1 text-xs text-[#d2b7a3]">{labels[v.status]}</span>
              </div>
              <p className="text-xs text-[#c3b4aa]">الصلاحية: {expiryLabel(v.expiresAt)}</p>
              {selectedId === v.inventoryId && code ? (
                <div className="space-y-3 rounded-lg border border-[#a48879]/40 bg-[#d2b7a3]/10 p-3">
                  <p className="text-xs text-[#c3b4aa]">كودك الخاص — للكاشير فقط</p>
                  <code dir="ltr" className="block select-all break-all rounded-md border border-white/10 p-2 text-center text-sm font-bold tracking-wide">{code}</code>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={copyCode} className="rounded-lg border border-white/25 px-4 py-2 text-xs font-bold hover:bg-white/10">نسخ الكود</button>
                    <button type="button" onClick={hideCode} className="rounded-lg border border-white/25 px-4 py-2 text-xs hover:bg-white/10">إخفاء</button>
                  </div>
                </div>
              ) : (
                <button type="button" disabled={!memberSessionReady || v.status !== "ACTIVE" || pending}
                  onClick={() => showCode(v)}
                  className="mt-auto rounded-lg border border-[#d2b7a3] px-4 py-3 text-sm font-semibold text-[#fcf9ed] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
                  {pending && selectedId === v.inventoryId ? "جاري التأكد…" : "عرض كود القسيمة"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {message ? <p role="status" aria-live="polite" className="rounded-lg border border-white/20 p-3 text-sm leading-6 text-[#d2b7a3]">{message}</p> : null}
      <p className="text-xs text-[#c3b4aa]">الكود مش بيتخزن على الجهاز، والفحص مش بيخصم Coins. الاستخدام الفعلي يتأكد منه الكاشير بعد حفظ الفاتورة.</p>
    </section>
  );
}
