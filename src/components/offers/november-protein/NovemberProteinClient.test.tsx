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

  it("shows the campaign hero, 600 EGP, and books with the resolved package id", async () => {
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
      const ctas = screen.getAllByRole("link", { name: "احجز العرض الآن" });
      expect(ctas.length).toBeGreaterThanOrEqual(1);
      expect(ctas[0]).toHaveAttribute("href", "/book?mode=nearest&packageId=21");
    });
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
    expect(screen.queryByRole("link", { name: "احجز العرض الآن" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "احجز العرض الآن" }).length).toBeGreaterThanOrEqual(1);
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
      const ctas = await screen.findAllByRole("link", { name: "احجز العرض الآن" });
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
    await screen.findAllByRole("link", { name: "احجز العرض الآن" });
    expect(screen.getByRole("heading", { name: "HAIRCUT" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PROTEIN TREATMENT" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HOT & COLD TOWELS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CARE MASK" })).toBeInTheDocument();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/بدل/)).toBeNull();
  });
});
