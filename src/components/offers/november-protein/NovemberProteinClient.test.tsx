import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { novemberProteinOffer } from "@/config/novemberProteinOffer";

const resolveNovemberPackage = vi.fn();
vi.mock("@/lib/offers/resolveNovemberPackage", () => ({
  resolveNovemberPackage: () => resolveNovemberPackage(),
}));

vi.mock("@/config/novemberProteinOffer", async () => {
  const actual = await vi.importActual<typeof import("@/config/novemberProteinOffer")>(
    "@/config/novemberProteinOffer",
  );
  return {
    ...actual,
    isNovemberCampaignActive: () => true,
  };
});

import { LanguageProvider } from "@/context/LanguageContext";
import { NovemberProteinClient } from "./NovemberProteinClient";

const livePackage = {
  packageId: 21,
  kind: "regular" as const,
  code: "NOV-PRO600",
  nameAr: "بروتين نوفمبر",
  nameEn: "November Protein Reset",
  price: 600,
  originalPrice: null,
  savings: null,
  durationMinutes: 90,
  imageUrl: null,
  popular: false,
  includes: [],
  groom: null,
};

const renderPage = () =>
  render(
    <LanguageProvider>
      <NovemberProteinClient />
    </LanguageProvider>,
  );

describe("November Protein landing", () => {
  beforeEach(() => {
    resolveNovemberPackage.mockReset();
    sessionStorage.clear();
  });

  it("shows the campaign hero, 600 EGP, and both nearest + specific barber paths", async () => {
    resolveNovemberPackage.mockResolvedValue({
      status: "ready",
      packageId: 21,
      package: livePackage,
      matchedBy: "code",
    });
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "YOUR HAIR. RESET." })).toBeInTheDocument();
    expect(screen.getByTestId("november-protein-price")).toHaveTextContent("600");

    await waitFor(() => {
      const nearest = screen.getAllByRole("link", { name: "أقرب حلاق متاح" });
      const specific = screen.getAllByRole("link", { name: "اختيار حلاق معين" });
      expect(nearest.length).toBeGreaterThanOrEqual(1);
      expect(specific.length).toBeGreaterThanOrEqual(1);
      expect(nearest[0]).toHaveAttribute("href", "/book?mode=nearest&packageId=21");
      expect(specific[0]).toHaveAttribute("href", "/book?mode=barber&packageId=21");
    });

    const gleemNearest = screen
      .getAllByRole("link", { name: "أقرب حلاق متاح" })
      .find((el) => el.getAttribute("href")?.includes("branch=GLEEM") && el.getAttribute("href")?.includes("mode=nearest"));
    const gleemBarber = screen
      .getAllByRole("link", { name: "اختيار حلاق معين" })
      .find((el) => el.getAttribute("href")?.includes("branch=GLEEM") && el.getAttribute("href")?.includes("mode=barber"));
    expect(gleemNearest).toHaveAttribute("href", "/book?mode=nearest&branch=GLEEM&packageId=21");
    expect(gleemBarber).toHaveAttribute("href", "/book?mode=barber&branch=GLEEM&packageId=21");
  });

  it("disables booking and keeps WhatsApp when the POS package is missing", async () => {
    resolveNovemberPackage.mockResolvedValue({
      status: "missing",
      packageId: null,
      package: null,
      matchedBy: null,
    });
    renderPage();

    await waitFor(() => expect(screen.getByTestId("november-book-status")).toHaveTextContent(/قيد التفعيل/));
    expect(screen.queryByRole("link", { name: "أقرب حلاق متاح" })).toBeNull();
    expect(screen.queryByRole("link", { name: "اختيار حلاق معين" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "أقرب حلاق متاح" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: "اختيار حلاق معين" }).length).toBeGreaterThanOrEqual(1);
    const wa = screen.getByRole("link", { name: "واتساب للمساعدة" });
    expect(wa).toHaveAttribute("href", novemberProteinOffer.whatsappHref);
  });

  it("fires Meta InitiateCheckout only when booking is ready", async () => {
    resolveNovemberPackage.mockResolvedValue({
      status: "ready",
      packageId: 21,
      package: livePackage,
      matchedBy: "env",
    });
    const fbq = vi.fn();
    window.fbq = fbq as unknown as Window["fbq"];
    try {
      renderPage();
      const ctas = await screen.findAllByRole("link", { name: "اختيار حلاق معين" });
      const cta = ctas[0];
      cta.addEventListener("click", (event) => event.preventDefault(), { once: true });
      fireEvent.click(cta);
      expect(fbq).toHaveBeenCalledWith("track", "InitiateCheckout", expect.objectContaining({
        content_name: "November Protein Reset",
        content_ids: ["21"],
        value: 600,
        currency: "EGP",
      }));
    } finally {
      delete window.fbq;
    }
  });

  it("lists the four experience steps without inventing a discount percentage", async () => {
    resolveNovemberPackage.mockResolvedValue({
      status: "ready",
      packageId: 21,
      package: livePackage,
      matchedBy: "code",
    });
    renderPage();
    await screen.findAllByRole("link", { name: "أقرب حلاق متاح" });
    expect(screen.getByRole("heading", { name: "HAIRCUT" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PROTEIN TREATMENT" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HOT & COLD TOWELS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CARE MASK" })).toBeInTheDocument();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/بدل/)).toBeNull();
  });
});
