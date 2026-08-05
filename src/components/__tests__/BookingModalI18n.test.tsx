import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  apiOk,
  installDefaultCatalogMocks,
  mockSlots,
} from "./bookingModalTestUtils";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { bookingCatalog } from "@/lib/i18n/booking";

const { fns, branchMock } = vi.hoisted(() => {
  let selectionVersion = 0;
  const fns = {
    getBookingConfig: vi.fn(),
    getServices: vi.fn(),
    listBranchBarbers: vi.fn(),
    getAvailableDays: vi.fn(),
    getAvailableSlots: vi.fn(),
    createBookingPlan: vi.fn(),
    submitBookingFromPlan: vi.fn(),
    clearPlanSession: vi.fn(),
    abandonMutationId: vi.fn(),
    buildCreateOperationKey: vi.fn(() => "op-key"),
    incrementSelectionVersion: vi.fn(() => ++selectionVersion),
    isStaleResponse: vi.fn((v: number) => v < selectionVersion),
    getArabicErrorMessage: vi.fn((code: string) => `عربي:${code}`),
    getLocalizedBookingErrorMessage: vi.fn((code: string, lang: string) =>
      lang === "en" ? `en:${code}` : `ar:${code}`,
    ),
    listPublicBranches: vi.fn(),
    resetSelectionVersion: () => {
      selectionVersion = 0;
    },
  };
  const branchMock = {
    branches: [
      {
        branchCode: "GLEEM",
        branchName: "جليم",
        shortName: "جليم",
        address: null,
        phone: null,
        timeZone: "Africa/Cairo",
      },
    ],
    isLoadingBranches: false,
    branchesError: null as string | null,
    selectedBranch: {
      branchCode: "GLEEM",
      branchName: "جليم",
      shortName: "جليم",
      address: null,
      phone: null,
      timeZone: "Africa/Cairo",
    },
    hasConfirmedBranch: true,
    selectBranch: vi.fn(),
    clearBranch: vi.fn(),
    refetchBranches: vi.fn(),
  };
  return { fns, branchMock };
});

vi.mock("@/lib/booking-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/booking-api")>("@/lib/booking-api");
  return {
    ...actual,
    getBookingConfig: (...a: unknown[]) => fns.getBookingConfig(...a),
    getServices: (...a: unknown[]) => fns.getServices(...a),
    listBranchBarbers: (...a: unknown[]) => fns.listBranchBarbers(...a),
    getAvailableDays: (...a: unknown[]) => fns.getAvailableDays(...a),
    getAvailableSlots: (...a: unknown[]) => fns.getAvailableSlots(...a),
    createBookingPlan: (...a: unknown[]) => fns.createBookingPlan(...a),
    submitBookingFromPlan: (...a: unknown[]) => fns.submitBookingFromPlan(...a),
    clearPlanSession: (...a: unknown[]) => fns.clearPlanSession(...a),
    abandonMutationId: (...a: unknown[]) => fns.abandonMutationId(...a),
    buildCreateOperationKey: (...a: unknown[]) => fns.buildCreateOperationKey(...a),
    incrementSelectionVersion: (...a: unknown[]) => fns.incrementSelectionVersion(...a),
    isStaleResponse: (...a: unknown[]) => fns.isStaleResponse(...a),
    getArabicErrorMessage: (...a: unknown[]) => fns.getArabicErrorMessage(...a),
    getLocalizedBookingErrorMessage: (...a: unknown[]) =>
      fns.getLocalizedBookingErrorMessage(...a),
    listPublicBranches: (...a: unknown[]) => fns.listPublicBranches(...a),
  };
});

vi.mock("@/context/BranchContext", () => ({
  useBranch: () => branchMock,
  BranchProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/ConfettiBurst", () => ({
  default: () => null,
}));

import BookingModal from "@/components/BookingModal";
import BookingTimeSlots from "@/components/BookingTimeSlots";

function wrap(ui: ReactNode) {
  return <LanguageProvider>{ui}</LanguageProvider>;
}

describe("BookingModalI18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDefaultCatalogMocks(fns);
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders English booking chrome when lang=en", async () => {
    localStorage.setItem("cut-salon-lang", "en");

    render(
      wrap(
        <BookingModal
          open
          onOpenChange={() => {}}
          barber={{ id: 5, name: "Ahmed", image: null }}
          initialMode="specific"
          entryMode="branch_first"
        />,
      ),
    );

    await waitFor(() => {
      expect(screen.getByText(bookingCatalog.service.title.en)).toBeTruthy();
    });
    expect(
      screen.getAllByText(bookingCatalog.header.bookWith.en.replace("{name}", "Ahmed")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(bookingCatalog.service.title.ar)).toBeNull();
    expect(document.querySelector('[dir="ltr"][lang="en"]')).toBeTruthy();
  });

  it("shows customer-safe overnight copy without dayOffset jargon", async () => {
    localStorage.setItem("cut-salon-lang", "en");

    render(
      wrap(
        <BookingTimeSlots
          slots={mockSlots}
          selectedTime={mockSlots[1].time}
          selectedSlot={mockSlots[1]}
          onTimeSelect={() => {}}
          isLoading={false}
        />,
      ),
    );

    await waitFor(() => {
      expect(screen.getAllByText(bookingCatalog.overnight.afterMidnight.en).length).toBeGreaterThan(0);
    });
    expect(document.body.textContent).not.toMatch(/dayOffset/i);
    expect(document.body.textContent).not.toMatch(/تابع لليوم التشغيلي/);
  });

  it("renders Arabic chrome RTL and updates on language switch without closing", async () => {
    localStorage.setItem("cut-salon-lang", "en");

    function LangSwitcher() {
      const { setLang, lang } = useLanguage();
      return (
        <button type="button" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
          toggle-lang
        </button>
      );
    }

    render(
      wrap(
        <>
          <LangSwitcher />
          <BookingModal
            open
            onOpenChange={() => {}}
            barber={{ id: 5, name: "Mahmoud", image: null }}
            initialMode="specific"
            entryMode="branch_first"
          />
        </>,
      ),
    );

    await waitFor(() => {
      expect(screen.getByText(bookingCatalog.service.title.en)).toBeTruthy();
    });
    expect(document.querySelector('[dir="ltr"][lang="en"]')).toBeTruthy();

    screen.getByRole("button", { name: "toggle-lang", hidden: true }).click();

    await waitFor(() => {
      expect(screen.getByText(bookingCatalog.service.title.ar)).toBeTruthy();
    });
    expect(document.querySelector('[dir="rtl"][lang="ar"]')).toBeTruthy();
    expect(
      screen.getByRole("button", { name: bookingCatalog.header.closeAria.ar }),
    ).toBeTruthy();
    expect(screen.getByText(bookingCatalog.service.title.ar)).toBeTruthy();
  });
});
