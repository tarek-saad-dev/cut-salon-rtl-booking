import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/context/LanguageContext";
import NovemberProteinPromo, {
  NOVEMBER_PROMO_DISMISS_KEY,
  NOVEMBER_PROMO_HREF,
  NOVEMBER_PROMO_TIMING,
} from "./NovemberProteinPromo";

vi.mock("@/config/novemberProteinOffer", async () => {
  const actual = await vi.importActual<typeof import("@/config/novemberProteinOffer")>(
    "@/config/novemberProteinOffer",
  );
  return {
    ...actual,
    isNovemberCampaignActive: () => true,
  };
});

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function renderPromo(lang: "ar" | "en" = "ar") {
  window.localStorage.setItem("cut-salon-lang", lang);
  return render(
    <LanguageProvider>
      <NovemberProteinPromo />
    </LanguageProvider>,
  );
}

describe("November protein homepage promo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a clear Arabic offer name, price, and landing link", () => {
    renderPromo("ar");
    advance(NOVEMBER_PROMO_TIMING.showAfterMs + 20);
    const region = screen.getByRole("region", { name: "عرض نوفمبر" });
    expect(region).toHaveAttribute("lang", "ar");
    expect(region).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { name: "عرض نوفمبر" })).toBeInTheDocument();
    expect(screen.getByText("سبيشال البروتين")).toBeInTheDocument();
    expect(screen.getByText(/قص شعر/)).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
    expect(screen.getByText("جنيه")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "احجز العرض" })).toHaveAttribute("href", NOVEMBER_PROMO_HREF);
  });

  it("switches copy when the website language is English", () => {
    renderPromo("en");
    advance(NOVEMBER_PROMO_TIMING.showAfterMs + 20);
    const region = screen.getByRole("region", { name: "November offer" });
    expect(region).toHaveAttribute("lang", "en");
    expect(region).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("heading", { name: "November Offer" })).toBeInTheDocument();
    expect(screen.getByText("Protein Special")).toBeInTheDocument();
    expect(screen.getByText(/Haircut/)).toBeInTheDocument();
    expect(screen.getByText("EGP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book the offer" })).toHaveAttribute(
      "href",
      NOVEMBER_PROMO_HREF,
    );
  });

  it("can be dismissed for the session", () => {
    renderPromo("ar");
    advance(NOVEMBER_PROMO_TIMING.showAfterMs + 20);
    fireEvent.click(screen.getByRole("button", { name: "إخفاء" }));
    expect(sessionStorage.getItem(NOVEMBER_PROMO_DISMISS_KEY)).toBe("1");
    expect(screen.queryByRole("region", { name: "عرض نوفمبر" })).toBeNull();
  });
});
