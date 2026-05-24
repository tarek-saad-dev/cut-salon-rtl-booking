"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User, X, Calendar, Phone, LogOut, ChevronLeft } from "lucide-react";
import { getClientProfile, type ClientProfile } from "@/lib/publicBookingApi";
import { clearClient } from "@/lib/clientStorage";
import CustomerUpcomingBookings from "./CustomerUpcomingBookings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cut_customer_phone")?.trim() || null;
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

// ─── Profile Drawer ───────────────────────────────────────────────────────────

function ProfileDrawer({
  phone,
  client,
  bookingsCount,
  onClose,
  onClear,
  onBookingCancelled,
}: {
  phone: string;
  client: ClientProfile | null;
  bookingsCount: number;
  onClose: () => void;
  onClear: () => void;
  onBookingCancelled: () => void;
}) {
  const [showBookings, setShowBookings] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-white font-bold text-base">حسابي</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client info */}
        <div className="px-5 py-4 space-y-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">
                {client?.name ?? "ضيف"}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {client ? "عميل مسجل" : "غير مسجل على هذا الجهاز"}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <Phone className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <span className="text-white/60 text-sm font-mono tracking-wide">{phone}</span>
          </div>

          {/* Bookings count */}
          {bookingsCount > 0 && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span className="text-[#D4AF37] text-sm font-bold">
                {bookingsCount === 1 ? "حجز قادم واحد" : `${bookingsCount} حجوزات قادمة`}
              </span>
            </div>
          )}
        </div>

        {/* Bookings section toggle */}
        {bookingsCount > 0 && (
          <div className="px-5 pb-2">
            <button
              onClick={() => setShowBookings(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 text-white/70 hover:border-[#D4AF37]/30 hover:text-white transition-colors text-sm font-medium"
            >
              <span>عرض حجوزاتي</span>
              <ChevronLeft className={`w-4 h-4 transition-transform ${showBookings ? "rotate-90" : ""}`} />
            </button>
          </div>
        )}

        {/* Inline upcoming bookings */}
        {showBookings && (
          <div className="max-h-72 overflow-y-auto">
            <CustomerUpcomingBookings
              phone={phone}
              onCancelled={onBookingCancelled}
            />
          </div>
        )}

        {/* Clear data */}
        <div className="px-5 py-4 border-t border-white/[0.07] mt-1">
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 text-red-400/70 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            مسح بياناتي من هذا الجهاز
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function ClientProfileWidget() {
  const [phone, setPhone] = useState<string | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fetchedPhoneRef = useRef<string | null>(null);

  // Read phone from localStorage on mount
  useEffect(() => {
    const stored = getStoredPhone();
    if (process.env.NODE_ENV === "development") {
      console.log("[profile] stored phone:", stored);
    }
    setPhone(stored);
    setInitialized(true);
  }, []);

  const fetchProfile = useCallback(async (p: string) => {
    if (fetchedPhoneRef.current === p) return;
    fetchedPhoneRef.current = p;
    const res = await getClientProfile(p);
    if (process.env.NODE_ENV === "development") {
      console.log("[profile] response:", res);
    }
    if (res.ok) {
      setClient(res.client);
      setBookingsCount(res.upcomingBookingsCount);
    }
  }, []);

  useEffect(() => {
    if (!initialized || !phone) return;
    fetchProfile(phone);
  }, [initialized, phone, fetchProfile]);

  const handleClear = () => {
    localStorage.removeItem("cut_customer_phone");
    clearClient();
    setPhone(null);
    setClient(null);
    setBookingsCount(0);
    fetchedPhoneRef.current = null;
    setDrawerOpen(false);
  };

  const handleBookingCancelled = () => {
    if (bookingsCount > 0) setBookingsCount(c => c - 1);
    if (phone) {
      fetchedPhoneRef.current = null;
      fetchProfile(phone);
    }
  };

  // No phone → plain icon link
  if (!initialized || !phone) {
    return (
      <a
        href="/client"
        aria-label="حسابي"
        className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 text-white/60 hover:border-[#D4AF37]/50 hover:text-[#E5C07B] transition-all duration-300"
      >
        <User className="w-4 h-4" />
      </a>
    );
  }

  const firstName = client ? getFirstName(client.name) : null;

  return (
    <>
      {/* Navbar button */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="حسابي"
        className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 transition-all duration-300 group"
      >
        <User className="w-4 h-4 text-[#D4AF37]" />
        {firstName && (
          <span className="text-white/80 text-xs font-medium hidden sm:block">
            أهلًا، {firstName}
          </span>
        )}
        {bookingsCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4AF37] text-[#050505] text-[10px] font-black flex items-center justify-center leading-none">
            {bookingsCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {drawerOpen && (
        <ProfileDrawer
          phone={phone}
          client={client}
          bookingsCount={bookingsCount}
          onClose={() => setDrawerOpen(false)}
          onClear={handleClear}
          onBookingCancelled={handleBookingCancelled}
        />
      )}
    </>
  );
}
