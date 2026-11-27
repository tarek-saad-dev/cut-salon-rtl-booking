'use client';
import {useCallback,useEffect,useState} from 'react';
type Session={referralCode:string;campaignStatus:'ACTIVE'|'UNAVAILABLE';counts:{pending:number;confirmed:number;rejected:number}};
export default function DecemberMyExam(){
 const [session,setSession]=useState<Session|null>(null),[state,setState]=useState<'loading'|'none'|'error'|'ready'>('loading'),[copied,setCopied]=useState(false);
 const load=useCallback(async()=>{
  setState('loading');setCopied(false);
  try{
   const r=await fetch('/api/offers/december/session',{cache:'no-store'});
   if(r.status===401){setSession(null);setState('none');return;}
   const d=await r.json();if(!r.ok||d.ok!==true)throw Error('UNAVAILABLE');
   setSession(d);setState('ready');
  }catch{setSession(null);setState('error');}
 },[]);
 useEffect(()=>{const refresh=()=>{void load();};refresh();window.addEventListener('december-registration-complete',refresh);return()=>window.removeEventListener('december-registration-complete',refresh);},[load]);
 async function copy(){
  if(!session)return;
  const link=new URL('/offers/december',window.location.origin);link.searchParams.set('ref',session.referralCode);
  try{await navigator.clipboard.writeText(link.toString());setCopied(true);}catch{setCopied(false);}
 }
 return <section dir="rtl" className="bg-[#F2F0E9] text-[#0C0C0C] p-6 rounded-md space-y-4">
  <h2 className="text-2xl font-black">الشلة بتاعتك</h2>
  {state==='loading'&&<p role="status">جاري تحميل نتيجة الدعوات…</p>}
  {state==='none'&&<p>سجّل في امتحان ديسمبر علشان يظهر كودك ودعواتك هنا.</p>}
  {state==='error'&&<p role="alert">متابعة الدعوات غير متاحة حاليًا.</p>}
  {session&&state==='ready'&&<>
   <p>{session.campaignStatus==='ACTIVE'?'تابع دعواتك. الخصم النهائي بيتحسب في الفرع.':'الحملة غير متاحة حاليًا.'}</p>
   <div className="grid grid-cols-3 gap-2">{[['معلقة',session.counts.pending],['مؤكدة',session.counts.confirmed],['غير مؤهلة',session.counts.rejected]].map(([name,count])=><div key={name} className="border border-neutral-400 rounded p-2 text-center"><p className="text-xl font-black">{count}</p><p className="text-xs">{name}</p></div>)}</div>
   <p dir="ltr" className="font-mono text-lg break-all">{session.referralCode}</p>
   {session.campaignStatus==='ACTIVE'&&<button type="button" onClick={()=>void copy()} className="bg-[#CF252B] text-white rounded px-4 py-3">{copied?'تم نسخ اللينك':'انسخ لينك دعوة صحابك'}</button>}
   <p className="text-sm">الدعوات لا تُؤكد إلا بعد التحقق من أول زيارة وإتمامها. بيانات الحساب والمحفظة غير متاحة من جلسة الحملة.</p>
  </>}
  <button type="button" onClick={()=>void load()} disabled={state==='loading'} className="underline text-sm">تحديث حالة الدعوات</button>
 </section>;
}
