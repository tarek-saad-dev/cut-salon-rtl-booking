"use client";
import {useEffect,useState} from "react";
import {Coins,Gift,LockKeyhole,RefreshCw,ShieldCheck,Scissors} from "lucide-react";
type Reward={
  id:number;nameAr:string;nameEn:string;description:string;priceCoins:number;
  serviceId:number|null;stockState:"available"|"out_of_stock";
  expiresAfterDays:number|null;canAfford:boolean|null;
  serviceMappingReady:boolean;purchaseAvailable:false;
};
type Catalog={ok:true;balance:number|null;purchaseEnabled:false;items:Reward[]};
const coins=(n:number)=>new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(n);
export default function RewardsMarketplace(){
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [status,setStatus]=useState<"loading"|"ready"|"sign-in"|"error">("loading");
  const [selected,setSelected]=useState<number|null>(null);
  const [reload,setReload]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setStatus("loading");
    fetch("/api/club/rewards",{credentials:"same-origin",cache:"no-store",signal:controller.signal})
      .then(async r=>{
        if(r.status===401||r.status===403){setStatus("sign-in");return;}
        if(!r.ok)throw Error("CATALOG_UNAVAILABLE");
        const data=await r.json() as Catalog;
        if(!data.ok||!Array.isArray(data.items))throw Error("CATALOG_INVALID");
        setCatalog(data);setStatus("ready");
      }).catch(e=>{if(!controller.signal.aborted)setStatus("error");});
    return ()=>controller.abort();
  },[reload]);
  return <section dir="rtl" lang="ar" aria-label="كتالوج المكافآت" className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p dir="ltr" lang="en" className="text-xs font-black tracking-[.22em] text-[#dec1a8]">CUT CLUB / REWARDS</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">مكافآتك تستنى زيارتك</h1>
        <p className="mt-3 text-sm leading-7 text-[#c4b1a2]">مكافآت CUT CLUB وأسعارها الحقيقية من الكاشير. شراء النقاط والاستبدال هيتاحوا بعد اكتمال الربط المالي.</p>
      </div>
      <button type="button" onClick={()=>setReload(n=>n+1)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d5bba3]/25 px-4 text-sm font-bold text-[#ebd0b5] hover:bg-white/5">
        <RefreshCw size={16} className={status==="loading"?"animate-spin":""}/> تحديث
      </button>
    </header>
    {catalog&&status==="ready"&&<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dec1a8]/20 bg-[#24141d] p-5">
      <div className="flex items-center gap-3"><Coins className="text-[#efcb9f]"/>
        <div><p className="text-xs text-[#c9b5a4]">رصيد CUT Coins</p>
          <p className="mt-1 text-2xl font-black tabular-nums">{catalog.balance===null?"غير متاح":coins(catalog.balance)+" CC"}</p></div>
      </div>
      <span className="rounded-full border border-[#f0ca9a]/25 px-3 py-1.5 text-xs font-semibold text-[#eacaaa]">متجر للعرض — الشراء قيد التجهيز</span>
    </div>}
    {status==="loading"&&<div role="status" className="rounded-2xl border border-[#dac1aa]/20 p-10 text-center text-sm text-[#dec1aa]">جاري تحميل المكافآت من CUT Salon…</div>}
    {status==="sign-in"&&<div role="status" className="rounded-2xl border border-[#dac1aa]/20 p-8 text-center">
      <LockKeyhole className="mx-auto text-[#debd9e]" size={30}/>
      <p className="mt-4 font-bold">سجّل دخولك بحساب CUT CLUB علشان تشوف المكافآت.</p>
      <a href="/club" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#ead1b7] px-5 text-sm font-bold text-[#27131b]">تسجيل الدخول</a>
    </div>}
    {status==="error"&&<div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-950/20 p-7 text-sm text-[#f2c8c3]">تعذر تحميل المكافآت حاليًا. جرّب التحديث.</div>}
    {status==="ready"&&catalog?.items.length===0&&<div className="rounded-2xl border border-dashed border-[#dac1aa]/25 p-10 text-center">
      <Gift className="mx-auto text-[#dab99b]" size={30}/>
      <p className="mt-4 text-sm font-semibold">مفيش مكافآت منشورة ومتاحة للعرض حاليًا.</p>
      <p className="mt-2 text-xs text-[#c1aa9a]">المكافآت بتظهر هنا فور اعتمادها من الإدارة.</p>
    </div>}
    {status==="ready"&&!!catalog?.items.length&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {catalog.items.map((item,index)=><article key={item.id}
        className="overflow-hidden rounded-[1.6rem] border border-[#d2b49d]/20 bg-[#1b1217]">
        <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-[#5e1e2b] via-[#351623] to-[#1b1116]">
          <Scissors size={40} className="text-[#e9c9ac]"/>
          <span className="absolute bottom-3 left-4 text-3xl font-black text-white/10">0{index+1}</span>
        </div>
        <div className="space-y-3 p-5">
          <p dir="ltr" lang="en" className="text-[11px] font-black tracking-[.14em] text-[#d5baa7]">{item.nameEn}</p>
          <h2 className="text-lg font-bold text-[#fff2e5]">{item.nameAr}</h2>
          <p className="text-xl font-black text-[#f1d0a6]">{coins(item.priceCoins)} <span className="text-sm">CC</span></p>
          <p className="text-xs text-[#c3b0a2]">{item.stockState==="out_of_stock"?"غير متوفر حاليًا":item.canAfford===false?"رصيدك أقل من سعر المكافأة":"عرض المكافأة متاح"}</p>
          <button type="button" onClick={()=>setSelected(selected===item.id?null:item.id)}
            aria-expanded={selected===item.id}
            className="min-h-11 w-full rounded-xl border border-[#d5bca6]/40 text-sm font-bold text-[#f1d8c3] hover:bg-white/5">
            {selected===item.id?"إخفاء التفاصيل":"تفاصيل المكافأة"}
          </button>
          {selected===item.id&&<p role="region" className="rounded-xl bg-[#241820] p-3 text-xs leading-6 text-[#cdb8a8]">
            {item.description||"خدمة من CUT Salon."}
            {item.expiresAfterDays!==null&&<span className="block">صلاحية القسيمة بعد الشراء: {item.expiresAfterDays} يوم.</span>}
            {!item.serviceMappingReady&&<span className="block text-amber-200">ربط الخدمة بالكاشير تحت المراجعة.</span>}
          </p>}
          <button type="button" disabled aria-label={"شراء "+item.nameAr+" غير متاح حاليًا"}
            className="flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#614a48]/50 px-4 text-sm font-bold text-[#d8c4b6]/70">
            <LockKeyhole size={15}/> الشراء قريبًا
          </button>
        </div>
      </article>)}
    </div>}
    <div className="flex items-start gap-2 rounded-xl border border-[#d9bca4]/15 bg-[#d9bca4]/5 p-4 text-xs leading-6 text-[#c9b7a8]">
      <ShieldCheck size={18} className="mt-1 shrink-0"/>
      لن يتم خصم أي Coins أو إنشاء قسيمة من الصفحة دي قبل اعتماد نظام الشراء الآمن وربطه بالفواتير.
    </div>
  </section>;
}
