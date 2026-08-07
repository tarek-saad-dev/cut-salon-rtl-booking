import type { OpenBookingIntent } from "@/context/BookingController";
import type { BookFlowDraft } from "@/lib/book-flow-draft";

export function buildOpenBookingIntentFromDraft(
  draft: BookFlowDraft,
  branchLabel: string,
  ar: boolean,
): OpenBookingIntent {
  const noteParts: string[] = [];
  if (draft.visit === "group") {
    noteParts.push(
      ar
        ? "حجز جماعي — يُرجى إضافة عدد الحضور في الملاحظات إن لزم"
        : "Group appointment — add party size in notes if needed",
    );
  }
  if (draft.promoCode) {
    noteParts.push(
      ar ? `كود خصم/إحالة: ${draft.promoCode}` : `Promo/referral: ${draft.promoCode}`,
    );
  }
  const bookingNote = noteParts.length ? noteParts.join("\n") : undefined;

  const customerPhone = draft.customer?.phone ?? "";
  const customerName = draft.customer?.name ?? "";
  const appointment = draft.appointment
    ? {
        date: draft.appointment.date,
        time: draft.appointment.time,
        empId: draft.appointment.empId ?? null,
        dayOffset: draft.appointment.dayOffset ?? null,
        branchCode: draft.appointment.branchCode ?? null,
        branchName: draft.appointment.branchName ?? null,
        barberName: draft.appointment.barberName ?? null,
      }
    : undefined;

  if (!draft.professional || draft.professional.kind === "nearest") {
    return {
      barber: {
        name: ar ? "أول حلاق متاح" : "First Available",
        image: null,
        role: ar ? "أقرب ميعاد مناسب" : "Earliest suitable appointment",
        location: `CUT Salon · ${branchLabel}`,
      },
      entryMode: "branch_first",
      initialMode: "nearest",
      explicitEntryBranchCode: draft.branchCode,
      initialServiceIds: draft.serviceIds,
      bookingNote,
      initialCustomerPhone: customerPhone,
      initialCustomerName: customerName || undefined,
      initialAppointment: appointment,
      fromBookFlow: true,
    };
  }

  const pro = draft.professional;
  return {
    barber: {
      id: pro.id,
      name: pro.name,
      image: pro.image,
      role: pro.role || (ar ? "حلاق Cut Salon" : "CUT Salon Barber"),
      location: `CUT Salon · ${branchLabel}`,
      serviceIds: pro.serviceIds,
    },
    // Branch already locked in /book — stay branch_first to skip multi-branch scope UI.
    entryMode: "branch_first",
    initialMode: "specific",
    explicitEntryBranchCode: draft.branchCode,
    initialServiceIds: draft.serviceIds,
    profileSeed: {
      empId: pro.id,
      displayName: pro.name,
      image: pro.image,
      serviceIds: pro.serviceIds,
    },
    bookingNote,
    initialCustomerPhone: customerPhone,
    initialCustomerName: customerName || undefined,
    initialAppointment: appointment,
    fromBookFlow: true,
  };
}
