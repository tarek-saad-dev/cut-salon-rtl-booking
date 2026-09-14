import { describe, expect, it } from "vitest";
import { buildBookHref } from "@/lib/book-o2/buildBookHref";
import {
  buildGroomCartModel,
  groomCartToResolvableServices,
  parseIdListParam,
} from "@/lib/book-o2/groomHandoff";
import { normalizeApiPackage } from "@/lib/packagesApi";
import { isServiceVisible } from "@/lib/bookingServiceGroups";

const signature = normalizeApiPackage({
  packageId: 2,
  kind: "groom",
  nameEn: "Signature Groom",
  nameAr: "سيجنتشر",
  price: 1500,
  durationMinutes: 110,
  includes: [
    { serviceId: 1049, nameEn: "Advanced Cut", optional: false, listPrice: 250 },
    { serviceId: 10, nameEn: "Beard Styling & Fade", optional: false, listPrice: 100 },
    { serviceId: 22, nameEn: "Hair Oil Treatment", optional: false, listPrice: 120 },
    { serviceId: 32, nameEn: "Face Wax", optional: false, listPrice: 100 },
    { serviceId: 1080, nameEn: "Nose & Ear Wax", optional: false, listPrice: 80 },
    { serviceId: 1081, nameEn: "Groom Final Styling", optional: false, listPrice: 200 },
    { serviceId: 1082, nameEn: "Final Touch", optional: false, listPrice: 150 },
    { serviceId: 12, nameEn: "Deep Skin Care", optional: false, listPrice: 400 },
    { serviceId: 1086, nameEn: "Groom Home Visit — Within the City", optional: true, listPrice: 500 },
  ],
  groom: {},
})!;

describe("buildBookHref groom package params", () => {
  it("carries packageId, addons, and services", () => {
    const href = buildBookHref({
      mode: "nearest",
      packageId: 2,
      addonProIds: [1086],
      serviceIds: [1049, 10, 22, 32, 1080, 1081, 1082, 12, 1086],
    });
    expect(href).toContain("packageId=2");
    expect(href).toContain("addons=1086");
    expect(href).toContain("services=");
    expect(href).toContain("1080");
    expect(href).toContain("1086");
  });
});

describe("Signature + city home visit cart", () => {
  it("keeps package price 1500 + addon 500 = 2000 and does not drop 1080/1081/1082/1086", () => {
    const cart = buildGroomCartModel(signature, [1086]);
    expect(cart.packageId).toBe(2);
    expect(cart.packagePrice).toBe(1500);
    expect(cart.included).toHaveLength(8);
    expect(cart.included.map((i) => i.proId).sort((a, b) => a - b)).toEqual([
      10, 12, 22, 32, 1049, 1080, 1081, 1082,
    ]);
    expect(cart.addons.map((a) => a.proId)).toEqual([1086]);
    expect(cart.addons[0]?.price).toBe(500);
    expect(cart.totalPrice).toBe(2000);
    expect(cart.serviceIds).toEqual(
      expect.arrayContaining([1049, 10, 22, 32, 1080, 1081, 1082, 12, 1086]),
    );
    expect(cart.unresolvedAddonProIds).toEqual([]);
  });

  it("overlays missing catalog IDs as resolvable but not All-Services visible", () => {
    const cart = buildGroomCartModel(signature, [1086]);
    const overlays = groomCartToResolvableServices(cart);
    const missingFromGenericCatalog = [1080, 1081, 1082, 1086];
    for (const id of missingFromGenericCatalog) {
      const row = overlays.find((s) => s.id === id);
      expect(row).toBeTruthy();
      expect(row?.groomContextOnly).toBe(true);
      expect(
        isServiceVisible({
          id: row!.id,
          name: row!.name,
          nameAr: row!.nameAr,
          nameEn: row!.nameEn,
          price: row!.price,
          durationMinutes: row!.durationMinutes,
          categoryName: row!.categoryName,
          isBookableOnline: true,
          groomContextOnly: row!.groomContextOnly,
        }),
      ).toBe(false);
    }
  });

  it("errors on unresolved addon without dropping silently in cart model", () => {
    const cart = buildGroomCartModel(signature, [99999]);
    expect(cart.unresolvedAddonProIds).toEqual([99999]);
    expect(cart.addons).toEqual([]);
    expect(cart.totalPrice).toBe(1500);
  });
});

describe("parseIdListParam", () => {
  it("parses unique positive ids", () => {
    expect(parseIdListParam("1086,1086,10")).toEqual([1086, 10]);
  });
});
