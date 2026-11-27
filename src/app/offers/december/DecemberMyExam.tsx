'use client';
import {useCallback,useEffect,useState} from 'react';
import type {DecemberRates} from '@/lib/december/rates';
type Session={referralCode:string;campaignStatus:'ACTIVE'|'UNAVAILABLE';counts:{pending:number;confirmed:number;rejected:number}};
export default function DecemberMyExam({rates}:{rates:DecemberRates}){
 const [session,setSession]=useState<Session|null>(null),[state,setState]=useState<'loading'|'none'|'error'|'ready'>('loading'),[copied,setCopied]=useState(false);
 const [recovery,setRecovery]=useState(''),[recovering,setRecovering]=useState(false),[recoveryError,setRecoveryError]=useState('');
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
 async function restore(e:React.FormEvent){e.preventDefault();if(recovering)return;setRecovering(true);setRecoveryError('');
 try{const r=await fetch('/api/offers/december/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:recovery.trim()})});const d=await r.json();if(!r.ok||d.ok!==true)throw Error();setRecovery('');await load();}catch{setRecoveryError('الرمز غير صالح أو انتهت الجلسة. راجع الاستقبال.');}finally{setRecovering(false);}}
 const referralRate=(n:number)=>n>0?rates.friends[Math.min(n,3)-1]:0;
 const inviteLink=session?'/offers/december?ref='+encodeURIComponent(session.referralCode):'';
 const [copyError,setCopyError]=useState(false);
 function absoluteInvite(){return new URL(inviteLink,window.location.origin).toString();}
 async function copy(){
  if(!session||session.campaignStatus!=='ACTIVE')return;
  setCopyError(false);
  try{await navigator.clipboard.writeText(absoluteInvite());setCopied(true);}catch{setCopied(false);setCopyError(true);}
 }
 function shareWhatsApp(){
  if(!session||session.campaignStatus!=='ACTIVE')return;
  const message='امتحان ديسمبر في CUT SALON 🔥 سجّل بكود دعوتي لو أول زيارة ليك: '+absoluteInvite();
  window.open('https://wa.me/?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
 }
 return <section dir="rtl" className="bg-[#F2F0E9] text-[#0C0C0C] p-6 rounded-md space-y-4">
  <h2 className="text-2xl font-black">الشلة بتاعتك</h2>
  {state==='loading'&&<p role="status">جاري تحميل نتيجة الدعوات…</p>}
  {state==='none'&&<><p>سجّل في امتحان ديسمبر علشان يظهر كودك ودعواتك هنا.</p><details className="border rounded p-3"><summary>سجلت قبل كده؟</summary><form onSubmit={restore} className="space-y-2 mt-3"><p className="text-sm">اطلب رمز استرجاع خاص من الاستقبال بعد التحقق من هويتك.</p><input type="password" dir="ltr" required minLength={43} maxLength={43} autoComplete="off" value={recovery} onChange={e=>setRecovery(e.target.value)} aria-label="رمز استرجاع الجلسة" className="w-full border rounded p-2"/><button disabled={recovering} className="bg-[#0C0C0C] text-white rounded px-3 py-2">استرجاع الجلسة</button>{recoveryError&&<p role="alert">{recoveryError}</p>}</form></details></>}
  {state==='error'&&<p role="alert">متابعة الدعوات غير متاحة حاليًا.</p>}
  {session&&state==='ready'&&<>
   <p>{session.campaignStatus==='ACTIVE'?'تابع دعواتك. الخصم النهائي بيتحسب في الفرع.':'الحملة غير متاحة حاليًا.'}</p>
   <div className="grid grid-cols-3 gap-2">{[['معلقة',session.counts.pending],['مؤكدة',session.counts.confirmed],['غير مؤهلة',session.counts.rejected]].map(([name,count])=><div key={name} className="border border-neutral-400 rounded p-2 text-center"><p className="text-xl font-black">{count}</p><p className="text-xs">{name}</p></div>)}</div>
   <div className="grid grid-cols-2 gap-2"><div className="border rounded p-3"><p className="text-xs">نسبة الدعوات المؤكدة مبدئيًا</p><p className="text-2xl font-black">{referralRate(session.counts.confirmed)}%</p></div><div className="border rounded p-3"><p className="text-xs">لو كل الدعوات المعلقة تأكدت</p><p className="text-2xl font-black text-[#CF252B]">{referralRate(session.counts.confirmed+session.counts.pending)}%</p></div></div>
   <p className="text-xs">الأرقام تخص الدعوات فقط، وليست ضمانًا لخصم الفاتورة؛ الاستحقاق الكامل واستهلاك العرض يُراجعان في الفرع.</p>
   <p dir="ltr" className="font-mono text-lg break-all">{session.referralCode}</p>
   {session.campaignStatus==='ACTIVE'&&<div className="space-y-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={shareWhatsApp} className="bg-[#0C0C0C] text-white rounded px-4 py-3">شارك على واتساب</button><button type="button" onClick={()=>void copy()} className="bg-[#CF252B] text-white rounded px-4 py-3">{copied?'تم نسخ اللينك':'انسخ لينك دعوة صحابك'}</button></div>{copyError&&<p role="status" className="text-xs">تعذر النسخ التلقائي. اضغط على الكود أعلاه وانسخه يدويًا.</p>}</div>
   <p className="text-sm">الدعوات لا تُؤكد إلا بعد التحقق من أول زيارة وإتمامها. بيانات الحساب والمحفظة غير متاحة من جلسة الحملة.</p>
  </>}
  <button type="button" onClick={()=>void load()} disabled={state==='loading'} className="underline text-sm">تحديث حالة الدعوات</button>
 </section>;
}
