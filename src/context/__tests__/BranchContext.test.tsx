import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { BranchProvider } from "@/context/BranchContext";
import { LanguageProvider } from "@/context/LanguageContext";
import * as bookingApi from "@/lib/booking-api";

vi.mock("@/lib/booking-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/booking-api")>("@/lib/booking-api");
  return {
    ...actual,
    listPublicBranches: vi.fn(),
  };
});

function wrap(ui: ReactNode) {
  return (
    <LanguageProvider>
      <BranchProvider>{ui}</BranchProvider>
    </LanguageProvider>
  );
}

import { useBranch } from "@/context/BranchContext";

function Probe() {
  const { branches, selectedBranch, selectBranch, hasConfirmedBranch } = useBranch();
  return (
    <div>
      <div data-testid="codes">{branches.map((b) => b.branchCode).join(",")}</div>
      <div data-testid="selected">{selectedBranch?.branchCode ?? ""}</div>
      <div data-testid="confirmed">{String(hasConfirmedBranch)}</div>
      <button
        type="button"
        onClick={() =>
          selectBranch({
            branchCode: "CAMP_CAESAR",
            branchName: "كامب شيزار",
            shortName: "كامب",
            address: null,
            phone: null,
            timeZone: "Africa/Cairo",
          })
        }
      >
        pick-camp
      </button>
    </div>
  );
}

describe("BranchContext public policy", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(bookingApi.listPublicBranches).mockResolvedValue({
      data: [
        {
          branchCode: "GLEEM",
          branchName: "جليم",
          shortName: "جليم",
          address: null,
          phone: null,
          timeZone: "Africa/Cairo",
        },
        {
          branchCode: "CAMP_CAESAR",
          branchName: "كامب شيزار",
          shortName: "كامب",
          address: null,
          phone: null,
          timeZone: "Africa/Cairo",
        },
      ],
      metadata: {
        contractVersion: "booking-public-v1",
        contractUnverified: false,
        requestId: "t",
        rateLimit: {
          limit: null,
          remaining: null,
          resetAt: null,
          retryAfterSeconds: null,
        },
        deprecated: false,
        warning: null,
      },
      httpStatus: 200,
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("preserves GLEEM and CAMP_CAESAR from the public API", async () => {
    const { getByTestId } = render(wrap(<Probe />));
    await waitFor(() => {
      expect(getByTestId("codes").textContent).toContain("GLEEM");
      expect(getByTestId("codes").textContent).toContain("CAMP_CAESAR");
    });
  });

  it("allows selecting CAMP_CAESAR", async () => {
    const { getByTestId, getByRole } = render(wrap(<Probe />));
    await waitFor(() => expect(getByTestId("codes").textContent).toContain("CAMP_CAESAR"));
    await act(async () => {
      getByRole("button", { name: "pick-camp" }).click();
    });
    await waitFor(() => {
      expect(getByTestId("selected").textContent).toBe("CAMP_CAESAR");
      expect(getByTestId("confirmed").textContent).toBe("true");
    });
  });

  it("clears invalid persisted branch", async () => {
    localStorage.setItem(
      "cut_branch",
      JSON.stringify({
        branchCode: "OLD_BRANCH",
        branchName: "Old",
        shortName: "Old",
      }),
    );
    const { getByTestId } = render(wrap(<Probe />));
    await waitFor(() => expect(getByTestId("codes").textContent).toContain("GLEEM"));
    expect(getByTestId("selected").textContent).toBe("");
    expect(getByTestId("confirmed").textContent).toBe("false");
  });

  it("keeps valid persisted Camp branch", async () => {
    localStorage.setItem(
      "cut_branch",
      JSON.stringify({
        branchCode: "CAMP_CAESAR",
        branchName: "كامب شيزار",
        shortName: "كامب",
      }),
    );
    const { getByTestId } = render(wrap(<Probe />));
    await waitFor(() => {
      expect(getByTestId("selected").textContent).toBe("CAMP_CAESAR");
      expect(getByTestId("confirmed").textContent).toBe("true");
    });
  });
});
