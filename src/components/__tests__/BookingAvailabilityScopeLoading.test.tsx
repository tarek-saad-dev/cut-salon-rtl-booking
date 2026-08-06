import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BookingAvailabilityScopeLoading from "@/components/BookingAvailabilityScopeLoading";

const tMock = vi.fn((key: string, params?: Record<string, string>) => {
  const map: Record<string, string> = {
    "scope.title": "Appointment options",
    "branch.loadingShort": "Loading branches…",
    "branch.loadingSlow": `Preparing ${params?.name ?? ""}’s branches. This may take a moment.`,
    "branch.scopeLoadingAria": "Preparing appointment options",
    "branch.loadFailedTitle": `Couldn’t load ${params?.name ?? ""}’s branches`,
    "branch.loadFailedBody": "Try again, or go back and choose another barber.",
    "branch.chooseAnotherBarber": "Choose another barber",
    "actions.retry": "Retry",
  };
  return map[key] ?? key;
});

vi.mock("@/hooks/useBookingTranslations", () => ({
  useBookingTranslations: () => ({
    t: tMock,
    dir: "ltr",
    lang: "en",
    format: {},
  }),
}));

describe("BookingAvailabilityScopeLoading", () => {
  beforeEach(() => {
    tMock.mockClear();
  });

  it("renders two skeleton option cards during profile loading", () => {
    render(<BookingAvailabilityScopeLoading barberName="Kareem" />);
    expect(screen.getByText("Appointment options")).toBeInTheDocument();
    expect(screen.getByText("Loading branches…")).toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(2);
  });

  it("shows slow loading copy", () => {
    render(<BookingAvailabilityScopeLoading barberName="Kareem" slow />);
    expect(
      screen.getByText(/Preparing Kareem’s branches. This may take a moment./),
    ).toBeInTheDocument();
  });

  it("network error is not empty-branches copy", () => {
    render(
      <BookingAvailabilityScopeLoading
        barberName="Kareem"
        error
        onRetry={() => undefined}
        onChooseAnotherBarber={() => undefined}
      />,
    );
    expect(screen.getByText(/Couldn’t load Kareem’s branches/)).toBeInTheDocument();
    expect(screen.queryByText(/no public bookable branches/i)).not.toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
    expect(screen.getByText("Choose another barber")).toBeInTheDocument();
  });

  it("shows retry when requested during loading", () => {
    render(
      <BookingAvailabilityScopeLoading
        barberName="Kareem"
        showRetry
        onRetry={() => undefined}
      />,
    );
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("uses Arabic catalog keys when t is called for slow state", () => {
    render(<BookingAvailabilityScopeLoading barberName="كريم" slow />);
    expect(tMock).toHaveBeenCalledWith("branch.loadingSlow", { name: "كريم" });
  });
});
