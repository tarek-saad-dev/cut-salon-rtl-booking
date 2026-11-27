"use client";
import {useEffect,useState} from 'react';
import {applicationsResponse,applicationCreated,type MemberApplication} from '@/lib/club/membershipApplicationContract';
import type {MembershipProgramsResponse} from '@/lib/club/membershipProgramsContract';
const api='/api/club/membership-applications';
const labels={PENDING:'بانتظار المراجعة',ACCEPTED_FOR_REVIEW:'مقبول لمراجعة الإثبات — لم يتم تفعيل العضوية',REJECTED:'مرفوض',PROGRAM_CHANGED:'البرنامج اتغير أو توقف',TRIAL_ISSUED:'تم إصدار سجل تجريبي — راجع عضوياتي لمعرفة صلاحيته'};
const branches={1:'جليم',3:'كامب شيزار'};
export default function MembershipApplications({programs}:{programs:MembershipProgramsResponse['items']}){
 const [rows,setRows]=useState<MemberApplication[]>([]),[state,setState]=useState<'loading'|'ready'|'closed'|'error'>('loading'),[reload,setReload]=useState(0),[busy,setBusy]=useState(false),[code,setCode]=useState(''),[branch,setBranch]=useState<1|3|0>(0),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const selected=programs.find(p=>p.code===code);
 useEffect(()=>{const controller=new AbortController();setRows([]);setState('loading');
 fetch(api,{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{if(controller.signal.aborted)return;if(r.status===401||r.status===403){setState('closed');return;}if(!r.ok)throw Error('UNAVAILABLE');const x=applicationsResponse.safeParse(await r.json());if(controller.signal.aborted)return;if(!x.success)throw Error('INVALID');setRows(x.data.items);setState('ready');}).catch(()=>{if(!controller.signal.aborted)setState('error');});return()=>controller.abort();},[reload]);
 const existing=selected&&rows.some(x=>x.code===selected.code&&x.publicationRevision===selected.publicationRevision);
 async function submit(e:React.FormEvent){e.preventDefault();if(!selected||branch===0||!selected.allowedBranchIds.includes(branch)||existing||busy||state!=='ready')return;
 setBusy(true);setError('');setNotice('');
 try{const r=await fetch(api,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:selected.code,publicationRevision:selected.publicationRevision,branchId:branch})});if(!r.ok)throw Error('UNAVAILABLE');const x=applicationCreated.safeParse(await r.json());if(!x.success)throw Error('INVALID');setNotice(x.data.replayed?'طلبك مسجل بالفعل.':'تم تسجيل طلبك التجريبي، وتقدر تتابع حالته هنا.');setCode('');setBranch(0);}
 catch{setError('تعذر تأكيد الطلب. حدّث البرامج والطلبات قبل إعادة المحاولة.');}finally{setRows([]);setState('loading');setReload(n=>n+1);setBusy(false);}}
 if(state==='closed')return null;
 return <section aria-label="طلبات العضوية" className="space-y-4 rounded-[1.6rem] border border-[#d2b49d]/20 bg-[#1b1217] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">طلبات الانضمام التجريبية</h2><button type="button" disabled={busy} onClick={()=>{setRows([]);setState('loading');setReload(n=>n+1);}} className="text-xs underline text-[#dec1a8]">تحديث الطلبات</button></div>
 <p className="text-sm text-[#c4b1a2]">الطلب للمراجعة فقط، ولا يمنح عضوية أو مزايا مالية.</p>
 {notice&&<p role="status" className="text-sm text-[#dec1a8]">{notice}</p>}{error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}
 {state==='loading'&&<p role="status">جاري تحميل الطلبات…</p>}{state==='error'&&<p role="alert">تعذر تحميل الطلبات.</p>}
 {state==='ready'&&<><div className="space-y-2">{rows.map(x=><article key={x.id} className="rounded-xl border border-[#d2b49d]/20 p-3"><h3 className="font-bold">{x.title}</h3><p className="text-sm text-[#dec1a8]">{labels[x.status]}</p><p className="text-xs text-[#c4b1a2]">{branches[x.branchId]} · {new Date(x.createdAt).toLocaleDateString('ar-EG',{timeZone:'Africa/Cairo'})}</p></article>)}{rows.length===0&&<p className="text-sm text-[#c4b1a2]">لا توجد طلبات مسجلة.</p>}</div>
 {!!programs.length&&<form onSubmit={submit} className="space-y-3"><label className="block text-sm">البرنامج<select disabled={busy} className="mt-2 w-full rounded-xl border border-[#d2b49d]/30 bg-[#261820] p-3" value={code} onChange={e=>{setCode(e.target.value);setBranch(0);setError('');}}><option value="">اختر البرنامج</option>{programs.map(p=><option key={p.code} value={p.code}>{p.title}</option>)}</select></label>
 {selected&&<label className="block text-sm">الفرع<select disabled={busy} className="mt-2 w-full rounded-xl border border-[#d2b49d]/30 bg-[#261820] p-3" value={branch} onChange={e=>setBranch(Number(e.target.value) as 1|3|0)}><option value={0}>اختر الفرع</option>{selected.allowedBranchIds.map(b=><option key={b} value={b}>{branches[b]}</option>)}</select></label>}
 {existing&&<p className="text-sm">يوجد طلب سابق لهذه النسخة.</p>}<button disabled={busy||!selected||!branch||!!existing} className="min-h-11 rounded-xl bg-[#ead1b7] px-5 font-bold text-[#27131b] disabled:opacity-50">إرسال طلب تجريبي</button></form>}</>}
 </section>;
}
