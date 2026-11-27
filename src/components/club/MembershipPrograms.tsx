"use client";
import {useEffect,useState} from 'react';
import MembershipApplications from './MembershipApplications';
import {Crown,GraduationCap,Stethoscope,BriefcaseBusiness,LockKeyhole} from 'lucide-react';
import {membershipProgramsResponse,type MembershipProgramsResponse} from '@/lib/club/membershipProgramsContract';
const types={GENERAL:{label:'عضوية عامة',icon:Crown},STUDENT:{label:'طلاب ومدارس وجامعات',icon:GraduationCap},DOCTOR:{label:'الأطباء',icon:Stethoscope},COMPANY:{label:'الشركات والشركاء',icon:BriefcaseBusiness}};
export default function MembershipPrograms(){
 const [data,setData]=useState<MembershipProgramsResponse|null>(null),[state,setState]=useState<'loading'|'ready'|'closed'|'error'>('loading'),[reload,setReload]=useState(0);
 useEffect(()=>{
 const controller=new AbortController();setData(null);setState('loading');
 fetch('/api/club/membership-programs',{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{
 if(controller.signal.aborted)return;if(r.status===403||r.status===401){setState('closed');return;}if(!r.ok)throw Error('UNAVAILABLE');
 const v=membershipProgramsResponse.safeParse(await r.json());if(controller.signal.aborted)return;if(!v.success)throw Error('INVALID');setData(v.data);setState('ready');
 }).catch(()=>{if(!controller.signal.aborted)setState('error');});return()=>controller.abort();
 },[reload]);
 return <section aria-label="برامج العضويات" className="space-y-4">
 <header className="flex items-center justify-between"><h2 className="text-xl font-black">اكتشف برامج العضويات</h2><button type="button" onClick={()=>{setData(null);setState('loading');setReload(n=>n+1);}} className="min-h-11 text-xs underline text-[#dec1a8]">تحديث البرامج</button></header>
 {state==='loading'&&<p role="status" className="text-sm text-[#c4b1a2]">جاري تحميل البرامج…</p>}
 {state==='closed'&&<p role="status" className="text-sm text-[#c4b1a2]">البرامج قيد التجهيز؛ لا يوجد تسجيل متاح حاليًا.</p>}
 {state==='error'&&<p role="alert" className="text-sm text-rose-300">تعذر تحميل البرامج. جرّب التحديث.</p>}
 {state==='ready'&&data&&<><p className="text-sm text-[#dec1a8]">البرامج المنشورة للاختبار فقط. لا تسجيل أو مزايا مالية.</p>{data.items.length===0?<p className="text-sm text-[#c4b1a2]">لا توجد برامج منشورة للاختبار حاليًا.</p>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.items.map(x=>{const Icon=types[x.kind].icon;return <article key={x.code} className="space-y-3 rounded-[1.6rem] border border-[#d2b49d]/20 bg-[#1b1217] p-5"><Icon size={30} className="text-[#dec1a8]"/><p className="text-xs text-[#c4b1a2]">{types[x.kind].label}</p><h3 className="text-lg font-bold">{x.title}</h3><p className="text-sm text-[#c4b1a2]">الفروع: {x.allowedBranchIds.map(b=>b===1?'جليم':'كامب شيزار').join('، ')}</p><p className="text-sm text-[#c4b1a2]">الحد الأدنى للزيارات: {x.minimumVisits}</p>{x.kind!=='GENERAL'&&<p className="text-sm text-[#c4b1a2]">يتطلب اعتماد إثبات الفئة{ x.requiresPartner?' والجهة الشريكة':''}.</p>}<button type="button" disabled className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d2b49d]/20 text-sm text-[#c4b1a2] opacity-70"><LockKeyhole size={16}/> الانضمام غير متاح</button></article>;})}</div>}</>}
 <MembershipApplications programs={state==='ready'&&data?data.items:[]}/>
 </section>;
}
