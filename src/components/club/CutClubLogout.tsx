"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
export default function CutClubLogout(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  return <button type="button" disabled={busy} onClick={async()=>{
    setBusy(true);
    try{await fetch("/api/club/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",credentials:"same-origin",cache:"no-store"});}
    finally{router.replace("/club");router.refresh();setBusy(false);}
  }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e2c5ae]/25 px-3 text-xs font-bold text-[#e8c9b2] hover:bg-white/5 disabled:opacity-50">
    <LogOut className="h-4 w-4" aria-hidden/> خروج
  </button>;
}
