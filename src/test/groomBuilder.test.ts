import { describe, expect, it } from "vitest";
import { getGroomTotals } from "@/lib/groomBuilder";

describe("getGroomTotals", () => {
  it("calculates every package with its duration and package saving", () => {
    expect(getGroomTotals({ selectedPackageId: "essential", selectedAddonIds: [], selectedLocationVisit: null })).toMatchObject({ packageSubtotal: 1250, totalPrice: 1250, totalDuration: 90, saving: 100 });
    expect(getGroomTotals({ selectedPackageId: "signature", selectedAddonIds: [], selectedLocationVisit: null })).toMatchObject({ packageSubtotal: 1650, totalPrice: 1650, totalDuration: 150, saving: 250 });
    expect(getGroomTotals({ selectedPackageId: "complete", selectedAddonIds: [], selectedLocationVisit: null })).toMatchObject({ packageSubtotal: 2100, totalPrice: 2100, totalDuration: 195, saving: 400 });
  });

  it("adds and removes add-on totals without duplicating calculation logic", () => {
    const withAddons = getGroomTotals({ selectedPackageId: "signature", selectedAddonIds: ["color-detail", "extra-facial"], selectedLocationVisit: null });
    const withoutAddons = getGroomTotals({ selectedPackageId: "signature", selectedAddonIds: [], selectedLocationVisit: null });
    expect(withAddons).toMatchObject({ addonSubtotal: 370, totalPrice: 2020, totalDuration: 195, saving: 380 });
    expect(withoutAddons).toMatchObject({ addonSubtotal: 0, totalPrice: 1650, totalDuration: 150, saving: 250 });
  });

  it("includes the chosen location visit in the same selection summary", () => {
    expect(getGroomTotals({ selectedPackageId: "essential", selectedAddonIds: ["relax"], selectedLocationVisit: "city" })).toMatchObject({ packageSubtotal: 1250, addonSubtotal: 200, totalPrice: 3200, totalDuration: 170, saving: 150 });
  });
});
