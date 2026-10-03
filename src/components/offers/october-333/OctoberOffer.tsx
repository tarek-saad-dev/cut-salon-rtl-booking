"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { octoberOffer as offer } from "@/config/octoberOffer";
import { octoberOfferApi, getAttribution, normalizeEgyptianMobile, isReceipt, type Campaign, type ClaimReceipt } from "@/lib/offers/octoberOfferApi";
import styles from "./offer.module.css";

function Details() {
  return <><div className={styles.price}><strong>{offer.price}</strong> جنيه <del>{offer.originalPrice} جنيه</del></div><ul className={styles.services}>{offer.services.map(service => <li key={service} lang="en" dir="ltr">{service}</li>)}</ul></>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <main className={styles.shell} dir="rtl"><header className={styles.brand}><Link href="/" aria-label="CUT Salon — الرئيسية">CUT<span>SALON</span></Link><span>OCTOBER EDITION / 333</span></header>{children}<footer>نفس اهتمام CUT بالتفاصيل. تجربة كاملة بسعر مميز.</footer></main>;
}
export function OctoberOffer() {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ended, setEnded] = useState(false);
  const locked = useRef(false);
  const requestId = useRef<string>();
  const submittedDetails = useRef<string>();
  const attribution = useRef<Record<string, string>>({});
  async function load() {
    setLoading(true);
    try {
      const data = await octoberOfferApi.campaign();
      setCampaign(data);
      setEnded(data.status === "ended" || data.remainingClaims === 0 || Date.parse(data.claimDeadline) <= Date.now());
    } catch (error) {
      setCampaign(null);
      if (error instanceof Error && error.message === "ended") setEnded(true);
    } finally { setLoading(false); }
  }
  useEffect(() => { attribution.current = getAttribution(window.location.search); void load(); }, []);
  const available = !!campaign && !ended && !loading;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || locked.current) return;
    if (Date.parse(campaign!.claimDeadline) <= Date.now()) { setEnded(true); return; }
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const mobile = normalizeEgyptianMobile(String(data.get("mobile") || ""));
    if (!name || !mobile) { setMessage("اكتب اسمك ورقم موبايل مصري صحيح."); return; }
    const details = JSON.stringify({ name, mobile });
    if (submittedDetails.current && submittedDetails.current !== details) {
      setMessage("لإعادة المحاولة بعد إرسال الطلب، استخدم نفس الاسم ورقم الموبايل حتى لا يتكرر الطلب.");
      return;
    }
    submittedDetails.current = details;
    locked.current = true; setBusy(true); setMessage("");
    requestId.current ??= crypto.randomUUID();
    try {
      const receipt = await octoberOfferApi.claim(name, mobile, attribution.current, requestId.current);
      // The current tab keeps only the receipt, never the customer's name or phone.
      try { sessionStorage.setItem(offer.receiptKey, JSON.stringify(receipt)); }
      catch { setConfirmed(receipt); return; }
      router.push("/offers/october-333/success");
    } catch (error) {
      if (error instanceof Error && error.message === "ended") { setEnded(true); setMessage("انتهى العرض أو اكتملت المطالبات المتاحة."); }
      else setMessage("تعذر تأكيد الطلب. قد يكون وصل بالفعل؛ أعد المحاولة بنفس البيانات لتجنب تكراره. لا يوجد دفع أونلاين.");
    } finally { locked.current = false; setBusy(false); }
  }
  const [confirmed, setConfirmed] = useState<ClaimReceipt | null>(null);
  if (confirmed) return <Shell><Confirmation receipt={confirmed} /></Shell>;
  return <Shell>
    <section className={styles.hero}><p className={styles.eyebrow}>عرض أكتوبر • لأول 100 طلب مؤكد</p><h1>لوك كامل.<br /><em>بسعر استثنائي.</em></h1><p>أربع خدمات في تجربة واحدة مع CUT Salon.</p><Details /><p>بدون دفع أونلاين — ادفع 333 جنيه في الفرع عند استخدام العرض.</p><a className={styles.button} href={ended ? "#availability" : "#claim"}>{ended ? "انتهى العرض" : "احجز عرضك"}</a></section>
    <section className={styles.panel}><p className={styles.eyebrow}>THE FULL EXPERIENCE</p><h2>اهتمام بكل تفاصيلك</h2><p>قص شعر، تهذيب ذقن، حمام زيت وعناية كلاسيكية بالبشرة — الخدمات الأربع مشمولة في سعر العرض.</p><div className={styles.video} aria-label="مساحة فيديو توضيحي قريبًا"><span aria-hidden="true">▷</span><p>فيديو تجربة CUT قريبًا</p></div></section>
    <section id="availability" className={styles.panel} aria-live="polite"><h2>{ended ? "انتهى عرض أكتوبر" : "عرض محدود"}</h2>{ended ? <><p>انتهت فترة المطالبة أو اكتمل العدد المتاح. الرابط سيظل متاحًا؛ لو أكدت عرضك بالفعل احتفظ بتأكيدك وراجع صلاحيته.</p><Link href="/book" className={styles.secondary}>احجز زيارة في CUT</Link></> : loading ? <p>جارٍ التحقق من توفر العرض…</p> : campaign ? <p>المتبقي حاليًا: {campaign.remainingClaims} من أصل 100 طلب مؤكد.</p> : <><p>تأكيد العرض غير متاح حاليًا. لم يتم إرسال أي طلب. حاول مرة أخرى لاحقًا.</p><button className={styles.secondary} onClick={() => void load()}>تحقق مرة أخرى</button></>}</section>
    <section className={styles.panel}><h2>ثلاث خطوات وبس</h2><ol className={styles.steps}><li>أكد طلب العرض باسمك ورقمك</li><li>احجز موعدك الآن أو لاحقًا</li><li>ادفع 333 جنيه في الفرع عند الاستخدام</li></ol></section>
    {!ended && <section id="claim" className={styles.panel}><h2>خلي العرض باسمك</h2><p>الطلب لا يحجز موعدًا تلقائيًا. اختر موعدك بعد التأكيد.</p><form onSubmit={submit}><label htmlFor="offer-name">الاسم</label><input id="offer-name" name="name" autoComplete="name" required maxLength={100} disabled={busy} /><label htmlFor="offer-mobile">رقم الموبايل المصري</label><input id="offer-mobile" name="mobile" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01012345678" required maxLength={25} disabled={busy} /><button className={styles.button} disabled={!available || busy}>{busy ? "جارٍ تأكيد الطلب…" : "أكد عرض الـ333 جنيه"}</button><p role="status">{message}</p></form></section>}
    <section className={styles.panel}><h2>الشروط والصلاحية</h2><p>العرض لأول 100 طلب صالح ومؤكد. يشمل الخدمات الأربع الموضحة، والدفع في الفرع عند الاستخدام. تأكيد العرض منفصل عن حجز الموعد.</p>{campaign ? <><p>آخر موعد لتأكيد الطلب: <time dateTime={campaign.claimDeadline}>{new Date(campaign.claimDeadline).toLocaleDateString("ar-EG")}</time></p><p>صالح للاستخدام حتى: <time dateTime={campaign.redeemUntil}>{new Date(campaign.redeemUntil).toLocaleDateString("ar-EG")}</time></p><p>{campaign.terms}</p></> : <p>تفاصيل فترة الصلاحية والشروط ستظهر عند توفر بيانات الحملة، قبل تأكيد الطلب.</p>}</section>
    {!ended && <div className={styles.sticky}><span>333 جنيه <small>الدفع في الفرع</small></span><a className={styles.button} href="#claim">احجز عرضك</a></div>}
  </Shell>;
}
function Confirmation({ receipt }: { receipt: ClaimReceipt }) {
  const expired = Date.parse(receipt.redeemUntil) <= Date.now();
  return <section className={styles.hero}><p className={styles.eyebrow}>تم تأكيد طلب العرض</p><h1>{expired ? "انتهت صلاحية عرضك" : "عرضك جاهز."}</h1><Details /><p>رقم التأكيد: <b dir="ltr">{receipt.claimId}</b></p><p>صالح حتى {new Date(receipt.redeemUntil).toLocaleDateString("ar-EG")}. احتفظ برقم التأكيد وقدمه في الفرع.</p>{expired ? <p>انتهت الصلاحية الموضحة في التأكيد. يمكنك حجز زيارة عادية في CUT.</p> : <p>لم يتم حجز موعد بعد. لا يوجد دفع أونلاين؛ ادفع 333 جنيه في الفرع عند استخدام العرض.</p>}<Link href="/book" className={styles.button}>احجز موعدك الآن</Link><Link href="/offers/october-333" className={styles.secondary}>احجز لاحقًا</Link><p>يمكنك الرجوع إلى /book عندما تكون جاهزًا للحجز.</p></section>;
}
export function OctoberOfferSuccess() {
  const [receipt, setReceipt] = useState<ClaimReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try { const stored: unknown = JSON.parse(sessionStorage.getItem(offer.receiptKey) || "null"); if (isReceipt(stored)) setReceipt(stored); } catch { /* Missing storage is not a confirmation. */ }
    setLoading(false);
  }, []);
  return <Shell>{loading ? <p role="status">جارٍ تحميل التأكيد…</p> : receipt ? <Confirmation receipt={receipt} /> : <section className={styles.hero}><h1>لا يوجد تأكيد محفوظ</h1><p>هذه الصفحة وحدها لا تؤكد طلب العرض. ارجع إلى العرض لتأكيد طلبك أو احتفظ برقم التأكيد الذي حصلت عليه.</p><Link href="/offers/october-333" className={styles.button}>العودة إلى العرض</Link></section>}</Shell>;
}
