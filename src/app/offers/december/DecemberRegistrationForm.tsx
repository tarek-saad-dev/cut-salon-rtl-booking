'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';

const fieldClass='w-full rounded-md border border-neutral-400 bg-white px-3 py-3 text-[#0C0C0C]';
export default function DecemberRegistrationForm({enabled,initialReferral=""}:{enabled:boolean;initialReferral?:string}){
  const [student,setStudent]=useState(false);
  const [education,setEducation]=useState('UNIVERSITY');
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const [code,setCode]=useState('');
  const [copied,setCopied]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!enabled||pending)return;
    const fields=new FormData(event.currentTarget);
    const get=(name:string)=>String(fields.get(name)??'').trim();
    const data={name:get('name'),phone:get('phone'),student,referralCode:get('referralCode'),
      marketingConsent:fields.get('marketingConsent')==='on',
      ...(student?{education:education==='UNIVERSITY'?{type:education,university:get('institution'),faculty:get('faculty'),year:get('year')}
        :education==='SCHOOL'?{type:education,school:get('institution'),stage:get('year')}
        :{type:education,institute:get('institution'),specialization:get('faculty'),year:get('year')}}:{})};
    setPending(true);setError('');
    try{
      const response=await fetch('/api/offers/december/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const result=await response.json();
      if(!response.ok||result.ok!==true||typeof result.referralCode!=='string'){
        setError(result.code==='REGISTRATION_REVIEW_REQUIRED'?'راجع الاستقبال لاستكمال التسجيل بأمان.'
          :result.code==='INVALID_REFERRAL_CODE'?'راجع كود الدعوة أو احذفه للمتابعة.'
          :result.code==='INVALID_REGISTRATION'?'راجع رقم الموبايل والبيانات المطلوبة.':'التسجيل غير متاح حاليًا. حاول مرة أخرى.');
        return;
      }
      setCode(result.referralCode);window.dispatchEvent(new Event("december-registration-complete"));
    }catch{setError('تعذر الاتصال. حاول مرة أخرى.');}finally{setPending(false);}
  }
  if(code)return <section dir="rtl" className="rounded-md bg-[#F2F0E9] text-[#0C0C0C] p-6 space-y-4">
    <h2 className="font-bold text-2xl">سجلت في الامتحان!</h2>
    <p>كود دعوتك جاهز. بياناتك والخصومات لسه في انتظار التحقق في الفرع.</p>
    <p dir="ltr" className="font-mono text-xl break-all">{code}</p>
    <button type="button" className="bg-[#0C0C0C] text-white rounded-md px-4 py-3" onClick={async()=>{try{await navigator.clipboard.writeText(code);setCopied(true);}catch{setCopied(false);}}}>{copied?'تم النسخ':'انسخ كود الدعوة'}</button>
  </section>;
  return <form dir="rtl" onSubmit={submit} className="rounded-md bg-[#F2F0E9] text-[#0C0C0C] p-6 space-y-4">
    <h2 className="text-2xl font-bold">ابدأ امتحانك</h2>
    <p className="text-sm">التسجيل لا يحتاج كود تأكيد. يتم اعتماد بياناتك في الفرع.</p>
    <fieldset disabled={!enabled||pending} className="space-y-4 disabled:opacity-70">
      <label className="block space-y-1">اسمك<input required name="name" autoComplete="name" maxLength={100} className={fieldClass}/></label>
      <label className="block space-y-1">رقم الموبايل<input required name="phone" type="tel" autoComplete="tel" maxLength={32} dir="ltr" className={fieldClass}/></label>
      <label className="flex gap-2 items-center"><input type="checkbox" checked={student} onChange={e=>setStudent(e.target.checked)}/> أنا طالب</label>
      {student&&<div className="space-y-4">
        <label className="block space-y-1">نوع المؤسسة<select value={education} onChange={e=>setEducation(e.target.value)} className={fieldClass}><option value="UNIVERSITY">جامعة</option><option value="SCHOOL">مدرسة</option><option value="INSTITUTE">معهد</option></select></label>
        <label className="block space-y-1">{education==='UNIVERSITY'?'اسم الجامعة':education==='SCHOOL'?'اسم المدرسة':'اسم المعهد'}<input required key={education} name="institution" maxLength={120} className={fieldClass}/></label>
        {education!=='SCHOOL'&&<label className="block space-y-1">{education==='UNIVERSITY'?'اسم الكلية':'التخصص'}<input required key={education+'-faculty'} name="faculty" maxLength={120} className={fieldClass}/></label>}
        <label className="block space-y-1">الفرقة أو المرحلة (اختياري)<input name="year" maxLength={60} className={fieldClass}/></label>
      </div>}
      <label className="block space-y-1">كود صاحبك (اختياري)<input name="referralCode" defaultValue={initialReferral} maxLength={32} dir="ltr" className={fieldClass}/></label>
      <label className="flex gap-2 items-start text-sm"><input name="marketingConsent" type="checkbox" className="mt-1"/> أوافق على استقبال عروض CUT SALON (اختياري)</label>
      <button type="submit" className="w-full bg-[#CF252B] text-white rounded-md py-3 font-bold">{pending?'جاري التسجيل…':'سجّل في الامتحان'}</button>
    </fieldset>
    {!enabled&&<p className="text-sm">التسجيل مغلق في المعاينة الحالية.</p>}
    {error&&<p role="alert" className="text-[#9B1C20]">{error}</p>}
  </form>;
}
