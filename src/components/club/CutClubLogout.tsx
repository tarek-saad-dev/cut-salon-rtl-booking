"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
export default function CutClubLogout(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  return <div className="inline-flex flex-col items-start gap-1">
    <button type="button" disabled={busy} onClick={async()=>{
      if(busy)return;
      setBusy(true);setError("");
      try{
        const res=await fetch("/api/club/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",credentials:"same-origin",cache:"no-store"});
        if(!res.ok)throw Error("LOGOUT_RETRY_REQUIRED");
        router.replace("/club");router.refresh();
      }catch{setError("تعذر إنهاء الجلسة. حاول تاني.");}
      finally{setBusy(false);}
    }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e2c5ae]/25 px-3 text-xs font-bold text-[#e8c9b2] hover:bg-white/5 disabled:opacity-50">
      <LogOut className="h-4 w-4" aria-hidden/> خروج
    </button>
    {error&&<p role="alert" className="text-xs text-red-300">{error}</p>}
  </div>;
}
