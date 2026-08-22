"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { saveClient, clearClient } from "@/lib/clientStorage";
import { lookupClientByMobile, updateClientProfile } from "@/lib/clientWebsiteApi";
import { User, Phone, Edit3, Check, X, Loader2, LogOut, Mail, MapPin } from "lucide-react";

interface ClientData {
  id: number;
  name: string;
  mobile: string;
  phone?: string;
  address?: string;
  email?: string;
}

type PageState = "login" | "loading" | "profile" | "edit";

function ClientPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectUrl = searchParams.get("redirect");

  const [pageState, setPageState] = useState<PageState>("login");
  const [phone, setPhone] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);

  const [editForm, setEditForm] = useState<Partial<ClientData>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);
  useEffect(() => { phoneRef.current?.focus(); }, []);

  const handleLogin = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) { setLoginError("أدخل رقم هاتف صحيح"); return; }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const data = await lookupClientByMobile(digits);
      if (data.ok && data.found) {
        setClient(data.client);
        setEditForm(data.client);
        saveClient({
          id: data.client.id,
          name: data.client.name,
          phone: data.client.mobile
        });
        // Redirect if redirect URL is provided, otherwise show profile
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          setPageState("profile");
        }
      } else {
        setLoginError("لم يتم العثور على حساب بهذا الرقم. هل أنت عميل جديد؟");
      }
    } catch {
      setLoginError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const data = await updateClientProfile({ clientId: client.id, ...editForm });
      if (data.ok) {
        setClient({ ...client, ...editForm } as ClientData);
        setSaveSuccess(true);
        setTimeout(() => { setPageState("profile"); setSaveSuccess(false); }, 1200);
      } else {
        setSaveError("فشل الحفظ، حاول مرة أخرى");
      }
    } catch {
      setSaveError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearClient();
    setClient(null);
    setPhone("");
    setEditForm({});
    setPageState("login");
  };

  return (
    <main className="min-h-screen bg-cut-black flex flex-col items-center justify-center px-4 py-16" dir="rtl">
      {/* Logo */}
      <div className="text-center mb-8">
        <span className="text-cut-gold text-2xl font-black tracking-[0.3em]">CUT</span>
        <div className="text-[10px] text-cut-gold/60 tracking-[0.5em] font-semibold mt-0.5">SALON</div>
      </div>

      <div className="w-full max-w-md bg-cut-surface border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">

        {/* ── Login ── */}
        {pageState === "login" && (
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-cut-gold/10 border border-cut-gold/20 flex items-center justify-center mb-4">
                <User className="w-7 h-7 text-cut-gold" />
              </div>
              <h1 className="text-cut-ivory text-xl font-bold">حسابي</h1>
              <p className="text-cut-ivory/40 text-sm mt-1">أدخل رقم هاتفك للدخول</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-cut-ivory/40 mb-1.5">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cut-ivory/30" />
                  <input
                    ref={phoneRef}
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setLoginError(null); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="01xxxxxxxxx"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-cut-surface-elevated border border-white/10 text-cut-ivory text-sm placeholder-white/20 focus:outline-none focus:border-cut-gold/50 focus:ring-1 focus:ring-cut-gold/20 transition-colors"
                    dir="ltr"
                  />
                </div>
                {loginError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <X className="w-3 h-3" />{loginError}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-l from-cut-gold to-cut-gold text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-[0_4px_20px_rgba(164,136,121,0.3)]"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "دخول"}
              </button>
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        {pageState === "profile" && client && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cut-gold/10 border border-cut-gold/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-cut-gold" />
                </div>
                <div>
                  <h2 className="text-cut-ivory font-bold">{client.name}</h2>
                  <p className="text-cut-ivory/40 text-xs">{client.mobile}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="text-cut-ivory/30 hover:text-red-400 transition-colors p-2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-3 mb-6">
              {[
                { icon: User, label: "الاسم", value: client.name },
                { icon: Phone, label: "الموبايل", value: client.mobile },
                { icon: Phone, label: "التليفون", value: client.phone || "—" },
                { icon: Mail, label: "البريد الإلكتروني", value: client.email || "—" },
                { icon: MapPin, label: "العنوان", value: client.address || "—" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <f.icon className="w-4 h-4 text-cut-gold/60 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-cut-ivory/30 text-[10px] mb-0.5">{f.label}</p>
                    <p className="text-cut-ivory text-sm truncate">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setEditForm({ ...client }); setPageState("edit"); }}
              className="w-full py-3 rounded-xl border border-cut-gold/30 text-cut-gold text-sm font-bold flex items-center justify-center gap-2 hover:bg-cut-gold/10 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              تعديل البيانات
            </button>
          </div>
        )}

        {/* ── Edit ── */}
        {pageState === "edit" && client && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-cut-ivory font-bold">تعديل البيانات</h2>
              <button onClick={() => { setPageState("profile"); setSaveError(null); }} className="text-cut-ivory/30 hover:text-cut-ivory transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { key: "name" as const, label: "الاسم", type: "text", dir: "rtl" },
                { key: "mobile" as const, label: "الموبايل", type: "tel", dir: "ltr" },
                { key: "phone" as const, label: "التليفون", type: "tel", dir: "ltr" },
                { key: "email" as const, label: "البريد الإلكتروني", type: "email", dir: "ltr" },
                { key: "address" as const, label: "العنوان", type: "text", dir: "rtl" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-cut-ivory/40 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(editForm[f.key] as string) ?? ""}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-cut-surface-elevated border border-white/10 text-cut-ivory text-sm placeholder-white/20 focus:outline-none focus:border-cut-gold/50 focus:ring-1 focus:ring-cut-gold/20 transition-colors"
                    dir={f.dir}
                  />
                </div>
              ))}
            </div>

            {saveError && <p className="text-red-400 text-xs mb-3 text-center">{saveError}</p>}
            {saveSuccess && (
              <div className="flex items-center justify-center gap-2 text-cut-bronze text-sm mb-3">
                <Check className="w-4 h-4" /> تم الحفظ بنجاح
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-cut-gold to-cut-gold text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-[0_4px_20px_rgba(164,136,121,0.3)]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" />حفظ التغييرات</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-cut-black flex flex-col items-center justify-center px-4 py-16" dir="rtl">
      <div className="text-center mb-8">
        <span className="text-cut-gold text-2xl font-black tracking-[0.3em]">CUT</span>
        <div className="text-[10px] text-cut-gold/60 tracking-[0.5em] font-semibold mt-0.5">SALON</div>
      </div>
      <div className="w-full max-w-md bg-cut-surface border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-cut-gold/10 border border-cut-gold/20 flex items-center justify-center mb-4 animate-pulse">
            <User className="w-7 h-7 text-cut-gold/50" />
          </div>
          <div className="h-6 w-24 bg-white/[0.05] rounded mb-2 animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.03] rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ClientPageInner />
    </Suspense>
  );
}
