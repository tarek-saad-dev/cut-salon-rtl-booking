import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/context/LanguageContext";
import { novemberProteinOffer } from "@/config/novemberProteinOffer";
import { ExpiredCampaignPanel } from "./ExpiredCampaignPanel";

describe("ExpiredCampaignPanel", () => {
  it("points visitors to the November Protein offer instead of rebooking October", () => {
    render(
      <LanguageProvider>
        <ExpiredCampaignPanel formerTitle="باكدج أكتوبر" formerBlurb="عرض أكتوبر انتهى." />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { name: "باكدج أكتوبر" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "شوف عرض نوفمبر" })).toHaveAttribute(
      "href",
      novemberProteinOffer.href,
    );
    expect(screen.queryByRole("link", { name: /احجز/ })).toBeNull();
  });
});
