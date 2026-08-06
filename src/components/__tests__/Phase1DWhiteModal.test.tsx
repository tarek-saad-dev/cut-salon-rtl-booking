import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BookingStepHeader from "@/components/BookingStepHeader";
import BookingTimeSlots from "@/components/BookingTimeSlots";
import BookingReviewStep from "@/components/BookingReviewStep";
import BookingSuccessStep from "@/components/BookingSuccessStep";
import BookingInfoPanel from "@/components/BookingInfoPanel";

vi.mock("@/hooks/useBookingTranslations", () => ({
  useBookingTranslations: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "header.bookWith": "Book with Kareem",
        "header.bookNearest": "Nearest",
        "header.closeAria": "Close",
        "header.professionalBarber": "Professional",
        "header.nearestBarber": "Nearest barber",
        "a11y.stepCompleted": "completed",
        "a11y.stepCurrent": "current",
        "a11y.stepProgress": "Step",
        "time.title": "Choose a time",
        "time.subtitle": "Pick a slot",
        "time.nearestFeatured": "Earliest",
        "time.nearestFeaturedHint": "Soonest available",
        "time.periodMorning": "Morning",
        "time.periodAfternoon": "Afternoon",
        "time.periodEvening": "Evening",
        "time.slotCountOne": "slot",
        "time.slotCountMany": "slots",
        "time.legendSelected": "Selected",
        "time.legendAvailable": "Available",
        "time.empty": "No slots",
        "overnight.afterMidnight": "After midnight",
        "overnight.explanation": "These times are after midnight",
        "review.title": "Review your booking",
        "review.subtitle": "Not confirmed yet",
        "review.barber": "Barber",
        "review.service": "Service",
        "review.appointment": "Appointment",
        "review.customerDetails": "Customer details",
        "review.durationFinal": "Total duration",
        "review.totalFinal": "Final total",
        "branch.label": "Branch",
        "actions.edit": "Edit",
        "actions.editSelections": "Edit selections",
        "actions.confirmBooking": "Confirm booking",
        "actions.continue": "Continue",
        "actions.back": "Back",
        "actions.copy": "Copy",
        "actions.copied": "Copied",
        "actions.doneThanks": "Done",
        "success.title": "Booking confirmed successfully",
        "success.subtitle": "Keep this reference for your appointment.",
        "success.bookingCode": "Booking code",
        "success.summary": "Appointment",
        "success.craftsman": "With",
        "success.viewDetails": "View booking details",
        "success.copiedToast": "Booking code copied",
        "success.confirmationDetailsAria": "Booking confirmation details",
        "infoPanel.detailsHeading": "Details",
        "infoPanel.notSetYet": "Not set",
        "infoPanel.brandFooter": "Cut Salon",
        "infoPanel.service": "Service",
        "infoPanel.date": "Date",
        "infoPanel.time": "Time",
        "infoPanel.duration": "Duration",
        "infoPanel.price": "Price",
        "infoPanel.location": "Location",
        "mode.methodLabel": "Method",
        "mode.chooseBarberShort": "Choose barber",
        "loading.creating": "Creating…",
      };
      return map[key] ?? key;
    },
    dir: "ltr" as const,
    lang: "en" as const,
    format: {
      time: (t: string) => t,
      date: () => "Thursday, August 6, 2026",
      duration: (m: number) => `${m} minutes`,
      price: (n: number) => `EGP ${n}`,
      number: (n: number) => String(n),
    },
  }),
}));

const STEPS = [
  { id: "service", label: "Service", number: 1 },
  { id: "date", label: "Date", number: 2 },
  { id: "time", label: "Time", number: 3 },
  { id: "review", label: "Review", number: 4 },
];

describe("Phase 1D white booking surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("header and stepper use white surfaces", () => {
    const { container } = render(
      <BookingStepHeader
        steps={STEPS}
        currentStep="time"
        barberName="Kareem"
        onClose={() => undefined}
      />,
    );
    const header = container.querySelector('[data-booking-surface="header"]');
    expect(header?.className).toContain("bg-[var(--booking-bg)]");
    expect(header?.className).not.toMatch(/bg-\[#0a0a0a\]|bg-cut-black|bg-black/);
    expect(container.querySelector('[data-booking-surface="stepper"]')).toBeTruthy();
  });

  it("success marks stepper completed rather than leaving Review active", () => {
    render(
      <BookingStepHeader
        steps={STEPS}
        currentStep="review"
        barberName="Kareem"
        onClose={() => undefined}
        allCompleted
      />,
    );
    const review = screen.getByLabelText(/Review, completed/i);
    expect(review).toBeInTheDocument();
  });

  it("time step uses white background and outlined default slots", () => {
    const { container } = render(
      <BookingTimeSlots
        slots={[
          { time: "10:00", available: true },
          { time: "10:30", available: true },
        ]}
        onTimeSelect={() => undefined}
      />,
    );
    const root = container.querySelector('[data-booking-surface="time"]');
    expect(root?.className).toContain("bg-[var(--booking-bg)]");
    expect(root?.className).not.toMatch(/bg-\[#0a0a0a\]|bg-black/);
    const slots = screen.getAllByRole("button");
    const timeSlot = slots.find((b) => b.textContent?.includes("10:30"));
    expect(timeSlot?.className).toContain("booking-slot-default");
    expect(timeSlot?.className).not.toMatch(/bg-\[#171717\]|bg-cut-black/);
  });

  it("selected slot uses outline/check rather than dark fill", () => {
    render(
      <BookingTimeSlots
        slots={[{ time: "12:00", available: true }]}
        selectedTime="12:00"
        selectedSlot={{ time: "12:00", available: true }}
        onTimeSelect={() => undefined}
      />,
    );
    const selected = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("aria-pressed") === "true");
    expect(selected?.className).toContain("booking-slot-selected");
    expect(selected?.className).not.toMatch(/from-cut-gold|bg-\[#171717\]/);
    expect(selected?.querySelector("svg")).toBeTruthy();
  });

  it("review uses one white summary card with dark readable values", () => {
    const { container } = render(
      <BookingReviewStep
        branchName="Gleem – Saba Pasha"
        barberName="Mahmoud"
        serviceLines={[{ name: "Hair Cut", durationLabel: "30 minutes" }]}
        appointmentDateLabel="Thursday, August 6, 2026"
        appointmentTimeLabel="12:00"
        customerName="Ali"
        customerPhone="01000000000"
        totalDurationLabel="30 minutes"
        totalPriceLabel="EGP 200"
        onConfirm={() => undefined}
      />,
    );
    const review = container.querySelector('[data-booking-surface="review"]');
    expect(review?.className).toContain("bg-[var(--booking-bg)]");
    expect(screen.getByText("Mahmoud").className).toMatch(/booking-text|text-\[var\(--booking-text\)\]/);
    expect(container.querySelectorAll('[data-review-row]').length).toBe(5);
    expect(container.innerHTML).not.toMatch(/bg-\[#0a0a0a\]/);
  });

  it("success screen has no black card and shows confirmation status", () => {
    const { container } = render(
      <BookingSuccessStep
        bookingCode="BK-Q3VDVF"
        dateLine="Thursday, August 6"
        timeLabel="12:00 PM"
        branchName="Gleem – Saba Pasha"
        barberName="Mahmoud"
        onCopyCode={() => undefined}
        onDone={() => undefined}
      />,
    );
    const success = container.querySelector('[data-booking-surface="success"]');
    expect(success?.className).toContain("bg-[var(--booking-bg)]");
    expect(container.innerHTML).not.toMatch(/bg-\[#0a0a0a\]|bg-cut-black|text-cut-ivory/);
    expect(screen.getByRole("status")).toHaveTextContent(/Booking confirmed successfully/);
    expect(screen.getByText("BK-Q3VDVF")).toBeInTheDocument();
  });

  it("success code copy feedback works", () => {
    const onCopy = vi.fn();
    const { rerender } = render(
      <BookingSuccessStep
        bookingCode="BK-Q3VDVF"
        dateLine="Thursday"
        timeLabel="12:00"
        branchName="Gleem"
        barberName="Mahmoud"
        onCopyCode={onCopy}
        onDone={() => undefined}
        copied={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Copy/i }));
    expect(onCopy).toHaveBeenCalledWith("BK-Q3VDVF");
    rerender(
      <BookingSuccessStep
        bookingCode="BK-Q3VDVF"
        dateLine="Thursday"
        timeLabel="12:00"
        branchName="Gleem"
        barberName="Mahmoud"
        onCopyCode={onCopy}
        onDone={() => undefined}
        copied
      />,
    );
    expect(screen.getByText("Booking code copied")).toBeInTheDocument();
  });

  it("sidebar identity density omits full booking details", () => {
    const { container } = render(
      <BookingInfoPanel
        barber={{ name: "Kareem", image: null }}
        branchName="Gleem"
        branchCode="GLEEM"
        selectedDate={new Date("2026-08-06")}
        selectedTime="12:00"
        service="Hair Cut"
        density="identity"
      />,
    );
    expect(container.querySelector('[data-density="identity"]')).toBeTruthy();
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
    expect(screen.getByText("Kareem")).toBeInTheDocument();
  });

  it("success main content does not require nested independent scroll containers", () => {
    const { container } = render(
      <BookingSuccessStep
        bookingCode="BK-1"
        dateLine="Thursday"
        timeLabel="12:00"
        branchName="Gleem"
        barberName="Mahmoud"
        onCopyCode={() => undefined}
        onDone={() => undefined}
      />,
    );
    const success = container.querySelector('[data-booking-surface="success"]');
    expect(success?.className).not.toMatch(/overflow-y-auto|overflow-scroll/);
  });
});
