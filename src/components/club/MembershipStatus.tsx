"use client";
import {useEffect,useState} from 'react';
import {Crown,GraduationCap,Stethoscope,BriefcaseBusiness,RefreshCw,ShieldCheck,LockKeyhole} from 'lucide-react';
import {membershipTrialResponse,type MembershipTrialResponse} from '@/lib/club/membershipTrialContract';
const types={GENERAL:{label:'عضوية عامة',icon:Crown},STUDENT:{label:'عضوية الطلاب',icon:GraduationCap},DOCTOR:{label:'عضوية الأطباء',icon:Stethoscope},COMPANY:{label:'عضوية الشركات',icon:BriefcaseBusiness}};
const states={CURRENT:'سارية تجريبيًا',EXPIRED:'منتهية',INVALIDATED:'تحتاج إعادة مراجعة'};
const scope={ACTIVE:'',UNLINKED:'حسابك لم يرتبط بسجل العميل بعد.',REVIEW_REQUIRED:'مطلوب مراجعة ربط حسابك.',SUSPENDED:'حسابك موقوف. تواصل مع إدارة CUT Salon.'};
const panel='rounded-[1.6rem] border border-[#d2b49d]/20 bg-[#1b1217] p-5 sm:p-6';
export default function MembershipStatus(){
 const [data,setData]=useState<MembershipTrialResponse|null>(null),[status,setStatus]=useState<'loading'|'ready'|'closed'|'login'|'error'>('loading'),[reload,setReload]=useState(0);
 useEffect(()=>{
 const controller=new AbortController();setData(null);setStatus('loading');
 fetch('/api/club/memberships',{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{
 if(controller.signal.aborted)return;
 if(r.status===403){setStatus('closed');return;}if(r.status===401){setStatus('login');return;}if(!r.ok)throw Error('UNAVAILABLE');
 const d=membershipTrialResponse.safeParse(await r.json());if(controller.signal.aborted)return;if(!d.success)throw Error('INVALID');
 setData(d.data);setStatus('ready');
 }).catch(()=>{if(!controller.signal.aborted)setStatus('error');});
 return ()=>controller.abort();
 },[reload]);
 return <section dir="rtl" lang="ar" aria-label="عضوياتي" className="space-y-5">
 <header className="flex flex-wrap items-start justify-between gap-3"><div><p dir="ltr" className="text-xs font-black tracking-[.2em] text-[#dec1a8]">CUT CLUB / MEMBERSHIPS</p><h1 className="mt-3 text-3xl font-black">عضوياتي</h1><p className="mt-2 text-sm leading-7 text-[#c4b1a2]">تابع حالة العضوية من نظام CUT Salon.</p></div>
 <button type="button" onClick={()=>{setData(null);setStatus('loading');setReload(x=>x+1);}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d5bba3]/25 px-4 text-sm"><RefreshCw size={16} className={status==='loading'?'animate-spin':''}/> تحديث</button></header>
 {status==='loading'&&<div role="status" className={panel}>جاري تحميل العضويات…</div>}
 {status==='closed'&&<div role="status" className={panel}><Crown className="mb-3 text-[#dec1a8]"/><h2 className="font-bold">برامج العضويات قيد التجهيز</h2><p className="mt-2 text-sm text-[#c4b1a2]">هنعرض العضويات المتاحة بعد اعتمادها. التسجيل والمزايا غير متاحين حاليًا.</p></div>}
 {status==='login'&&<div role="status" className={panel}><LockKeyhole className="mb-3"/><p>سجّل الدخول علشان تشوف عضوياتك.</p><a href="/club" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#ead1b7] px-5 font-bold text-[#27131b]">تسجيل الدخول</a></div>}
 {status==='error'&&<div role="alert" className={panel}>تعذر تحميل العضويات. جرّب التحديث.</div>}
 {status==='ready'&&data&&<><div className="rounded-xl border border-[#dec1a8]/20 p-4 text-sm text-[#dec1a8]">عرض تجريبي فقط. لا تمنح هذه السجلات خصومات أو مزايا مالية، والتسجيل الجديد غير متاح.</div>
 {data.accountStatus!=='ACTIVE'?<div role="status" className={panel}>{scope[data.accountStatus]}</div>:data.items.length===0?<div className={panel}><Crown className="mb-3"/><p>لا توجد عضويات تجريبية مسجلة لحسابك.</p></div>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.items.map(item=>{const Icon=types[item.kind].icon;return <article key={item.code} className={panel}><Icon className="mb-4 text-[#dec1a8]" size={28}/><p className="text-xs text-[#c4b1a2]">{types[item.kind].label}</p><h2 className="mt-2 text-lg font-bold">{item.title}</h2><p className="mt-3 text-sm font-semibold">{states[item.status]}</p><p className="mt-2 text-xs text-[#c4b1a2]">الفرع: {item.branchId===1?'جليم':'كامب شيزار'}</p><p className="mt-1 text-xs text-[#c4b1a2]">الصلاحية: {new Date(item.expiresAt).toLocaleDateString('ar-EG',{timeZone:'Africa/Cairo'})}</p></article>})}</div>}</>}
 <div className="flex items-start gap-2 rounded-xl border border-[#d9bca4]/15 p-4 text-xs leading-6 text-[#c9b7a8]"><ShieldCheck size={18} className="shrink-0"/>بيانات العضوية لا تظهر إلا لصاحب الحساب الموثق.</div>
 </section>;
}
