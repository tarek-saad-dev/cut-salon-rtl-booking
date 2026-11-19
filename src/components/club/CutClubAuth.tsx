"use client";

import { useEffect,useRef,useState,type FormEvent,type ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, LoaderCircle, LockKeyhole, MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";

type Mode="LOGIN"|"CUT_CLUB_SIGNUP";
type Step="phone"|"otp";
const errors:Record<string,string>={
  INVALID_PHONE:"راجع رقم الموبايل المصري واكتبه بالشكل الصحيح.",
  INVALID_REQUEST:"من فضلك راجع البيانات وحاول مرة تانية.",
  INVALID_OTP:"الكود غير صحيح. جرّب تاني.",
  OTP_EXPIRED:"صلاحية الكود انتهت؛ اطلب كود جديد.",
  OTP_EXPIRED_OR_USED:"الكود انتهى أو استخدم قبل كده. اطلب كود جديد.",
  RATE_LIMITED:"وصلت للحد المسموح من المحاولات. حاول بعد شوية.",
  WHATSAPP_NOT_READY:"واتساب CUT Salon غير متاح حاليًا. جرّب بعد شوية.",
  OTP_DELIVERY_FAILED:"تعذر إرسال الكود حاليًا. حاول تاني.",
  CUT_CLUB_NOT_CONFIGURED:"تسجيل الدخول غير مفعّل حاليًا.",
  CUT_CLUB_UNAVAILABLE:"الخدمة غير متاحة مؤقتًا. جرّب تاني.",
};
async function jsonPost(path:string,body:unknown) {
  const res=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),credentials:"same-origin",cache:"no-store"});
  const data=await res.json().catch(()=>({ok:false,code:"CUT_CLUB_UNAVAILABLE"})) as {ok:boolean;code?:string;status?:string;resendAfterSec?:number};
  if(!res.ok||!data.ok)throw new Error(data.code||"CUT_CLUB_UNAVAILABLE");
  return data;
}
function MaskedPhone({phone}:{phone:string}) {
  return <span dir="ltr" className="font-bold tabular-nums">{phone}</span>;
}
export default function CutClubAuth(){
  const router=useRouter();
  const [mode,setMode]=useState<Mode>("LOGIN");
  const [phone,setPhone]=useState("");
  const [step,setStep]=useState<Step>("phone");
  const [code,setCode]=useState("");
  const [seconds,setSeconds]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const codeInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(step!=="otp")return;
    const id=window.setInterval(()=>setSeconds(n=>Math.max(0,n-1)),1000);
    return ()=>window.clearInterval(id);
  },[step]);
  useEffect(()=>{if(step==="otp")codeInput.current?.focus();},[step]);

  const start=async(e?:FormEvent)=>{
    e?.preventDefault();
    if(busy)return;
    setBusy(true);setError("");
    try{
      const result=await jsonPost("/api/club/auth/start",{phone,purpose:mode});
      setStep("otp");setCode("");setSeconds(result.resendAfterSec??60);
    }catch(e){setError(errors[e instanceof Error?e.message:""]||errors.CUT_CLUB_UNAVAILABLE);}
    finally{setBusy(false);}
  };
  const verify=async(e:FormEvent)=>{
    e.preventDefault();
    if(code.length!==6||busy)return;
    setBusy(true);setError("");
    try {
      await jsonPost("/api/club/auth/verify",{code});
      router.replace("/club");
      router.refresh();
    }catch(e){
      setCode("");
      setError(errors[e instanceof Error?e.message:""]||errors.CUT_CLUB_UNAVAILABLE);
      codeInput.current?.focus();
    }finally{setBusy(false);}
  };
  const edit=()=>{setStep("phone");setCode("");setSeconds(0);setError("");};
  return <div dir="rtl" lang="ar" className="min-h-dvh bg-[#0d0a0e] px-4 py-9 text-[#fff9ef] sm:py-16">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-[#d8b89c]/20 bg-[#1a1118] shadow-[0_30px_100px_rgba(0,0,0,.35)] md:grid-cols-2">
      <section className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#662438] via-[#3b1727] to-[#130d13] p-7 sm:p-10">
        <div aria-hidden="true" className="absolute -left-20 -top-40 h-[400px] w-[400px] rounded-full border-[70px] border-white/[.045]"/>
        <div className="relative">
          <a href="/" className="text-xs font-semibold text-[#e9c9b3] underline underline-offset-4">العودة إلى CUT Salon</a>
          <p lang="en" dir="ltr" className="mt-12 text-left text-xs font-black tracking-[.25em] text-[#e6c4aa]">THE CUT CLUB</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.4] sm:text-5xl">مكافآتك
            <span className="block text-[#ead1b9]">في محفظتك.</span></h1>
          <p className="mt-5 max-w-sm text-sm leading-8 text-[#dec2b1]">CUT Coins، القسائم، سجل الزيارات والمكافآت، كلهم في حسابك الشخصي.</p>
        </div>
        <p className="relative mt-8 flex items-center gap-2 text-xs text-[#dcc2b2]"><ShieldCheck className="h-4 w-4"/> بياناتك ما بتظهرش إلا بعد التحقق من هويتك.</p>
      </section>
      <section className="flex flex-col justify-center p-7 sm:p-10">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ddbb9e]/20 bg-[#e9cbb5]/10"><MessageCircle className="h-6 w-6 text-[#e9cbb5]"/></div>
        {step==="phone"?<>
          <p className="text-[10px] font-bold tracking-[.2em] text-[#c4a58e]" lang="en" dir="ltr">WHATSAPP VERIFICATION</p>
          <h2 className="mt-3 text-2xl font-black">أهلاً بيك في CUT CLUB</h2>
          <p className="mt-3 text-sm leading-7 text-[#bda99b]">استقبل رمز الدخول من رقم CUT Salon الرسمي على واتساب.</p>
          <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-[#2b1b23] p-1" role="group" aria-label="نوع العملية">
            <button type="button" aria-pressed={mode==="LOGIN"} onClick={()=>setMode("LOGIN")} className={"min-h-11 rounded-lg text-sm font-bold "+(mode==="LOGIN"?"bg-[#ead3bc] text-[#31141f]":"text-[#cdb7a7]")}>تسجيل الدخول</button>
            <button type="button" aria-pressed={mode==="CUT_CLUB_SIGNUP"} onClick={()=>setMode("CUT_CLUB_SIGNUP")} className={"min-h-11 rounded-lg text-sm font-bold "+(mode==="CUT_CLUB_SIGNUP"?"bg-[#ead3bc] text-[#31141f]":"text-[#cdb7a7]")}>حساب جديد</button>
          </div>
          <form onSubmit={start} className="mt-6">
            <label htmlFor="cutclub-phone" className="block text-sm font-bold">رقم الموبايل</label>
            <div className="relative mt-2">
              <Phone aria-hidden className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c2a791]"/>
              <input id="cutclub-phone" type="tel" inputMode="tel" autoComplete="tel-national"
                placeholder="01XXXXXXXXX" required maxLength={32} dir="ltr" value={phone}
                onChange={e=>setPhone(e.target.value)}
                className="h-14 w-full rounded-xl border border-[#b99680]/30 bg-[#0f0b0f] py-3 pl-5 pr-12 text-left text-lg text-white outline-none focus:border-[#ead1b9]"/>
            </div>
            <button type="submit" disabled={busy||phone.trim().length<8}
              className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#ead3bc] px-5 py-3 font-black text-[#341520] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
              {busy?<LoaderCircle aria-hidden className="h-5 w-5 animate-spin"/>:<MessageCircle aria-hidden className="h-5 w-5"/>} استمرار عبر واتساب
            </button>
          </form>
        </>:<>
          <p lang="en" dir="ltr" className="text-[10px] font-bold tracking-[.2em] text-[#c4a58e]">6-DIGIT VERIFICATION</p>
          <h2 className="mt-3 text-2xl font-black">تحقق من واتساب</h2>
          <p className="mt-3 text-sm leading-7 text-[#bda99b]">بعتنالك كود مكوّن من 6 أرقام على <MaskedPhone phone={phone}/>.</p>
          <button type="button" onClick={edit} className="mt-2 flex min-h-11 items-center gap-1 self-start text-xs font-bold text-[#e9cdb3] underline underline-offset-4">
            <ChevronRight className="h-4 w-4"/> تعديل رقم الموبايل
          </button>
          <form className="mt-8" onSubmit={verify}>
            <label htmlFor="cutclub-otp" className="block text-sm font-bold">كود التحقق</label>
            <div className="relative mt-3 cursor-text" onClick={()=>codeInput.current?.focus()}>
              <input id="cutclub-otp" ref={codeInput} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}"
                aria-label="كود التحقق المكوّن من 6 أرقام" value={code}
                onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                className="absolute inset-0 h-full w-full opacity-0"
              />
              <div className="grid grid-cols-6 gap-2" dir="ltr" aria-hidden>
                {Array.from({length:6},(_,i)=><span key={i} className={"flex h-14 items-center justify-center rounded-xl border bg-[#0f0b0f] text-2xl font-black tabular-nums "+(code.length===i?"border-[#e6c3a4]":"border-[#bb9e8b]/25")}>{code[i]||"·"}</span>)}
              </div>
            </div>
            <button type="submit" disabled={busy||code.length!==6}
              className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#ead3bc] px-5 py-3 font-black text-[#341520] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
              {busy?<LoaderCircle aria-hidden className="h-5 w-5 animate-spin"/>:<LockKeyhole aria-hidden className="h-5 w-5"/>} تأكيد ودخول
            </button>
          </form>
          <div className="mt-5 flex min-h-11 items-center justify-between gap-3 text-xs">
            <span className="text-[#bda99b]">{seconds>0?<>إعادة الإرسال خلال <strong>{seconds}</strong> ثانية</>:"ماوصلكش الكود؟"}</span>
            <button type="button" disabled={busy||seconds>0} onClick={()=>void start()}
              className="font-bold text-[#e5c7ad] underline underline-offset-4 disabled:opacity-40">إرسال كود جديد</button>
          </div>
        </>}
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-400/30 bg-rose-950/30 p-3 text-sm leading-7 text-rose-200">{error}</p>}
        <div className="mt-7 flex gap-2 border-t border-white/10 pt-5 text-xs leading-6 text-[#a99a90]"><ShieldCheck className="h-4 w-4 shrink-0"/> لا تشارك رمز التحقق. المحفظة الفعلية تظهر فقط للحساب صاحب الحق فيها.</div>
      </section>
    </div>
  </div>;
}
