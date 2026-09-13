import { describe, expect, it } from "vitest";
import {
  buildGroomBookingPayload,
  getGroomTotals,
  reconcileOptionalSelection,
  toggleOptionalSelection,
} from "@/lib/groomBuilder";
import {
  getSelectableOptionalExtras,
  normalizeApiPackage,
  normalizeGroomOptionalExtra,
  splitSelectableExtras,
  type ApiPackage,
} from "@/lib/packagesApi";

function fixturePackage(raw: Record<string, unknown>): ApiPackage {
  const normalized = normalizeApiPackage(raw);
  if (!normalized) throw new Error("invalid fixture");
  return normalized;
}

const essential = fixturePackage({
  packageId: 1,
  kind: "groom",
  nameEn: "Essential Groom",
  nameAr: "أساسي",
  price: 1300,
  durationMinutes: 95,
  includes: [
    { serviceId: 1049, nameEn: "Advanced Cut", nameAr: "قصة", optional: false, listPrice: 250 },
    { serviceId: 1083, nameEn: "Hair Detail Color", nameAr: "تفاصيل لون", optional: true, listPrice: 150, durationMinutes: 25 },
    { serviceId: 1084, nameEn: "Relax Session", nameAr: "استرخاء", optional: true, listPrice: 200 },
    { serviceId: 14, nameEn: "Foot pedicure", nameAr: "باديكير", optional: true, listPrice: 400 },
    { serviceId: 1077, nameEn: "Medium Hair Protein", nameAr: "بروتين", optional: true, listPrice: 1000 },
    { serviceId: 1085, nameEn: "Groom Home Visit — Near the Salon", nameAr: "قريب", optional: true, listPrice: 300 },
    { serviceId: 1086, nameEn: "Groom Home Visit — Within the City", nameAr: "مدينة", optional: true, listPrice: 500 },
    { serviceId: 1087, nameEn: "Groom Home Visit — Extended Zone", nameAr: "ممتد", optional: true, listPrice: 1000 },
  ],
  groom: {},
});

const signature = fixturePackage({
  packageId: 2,
  kind: "groom",
  nameEn: "Signature Groom",
  nameAr: "سيجنتشر",
  price: 1500,
  durationMinutes: 110,
  includes: essential.includes,
  groom: {},
});

const complete = fixturePackage({
  packageId: 3,
  kind: "groom",
  nameEn: "Complete Groom",
  nameAr: "كامل",
  price: 3000,
  durationMinutes: 195,
  includes: [
    { serviceId: 1049, nameEn: "Advanced Cut", nameAr: "قصة", optional: false, listPrice: 250 },
    { serviceId: 14, nameEn: "Foot pedicure", nameAr: "باديكير", optional: false, listPrice: 400 },
    { serviceId: 1077, nameEn: "Medium Hair Protein", nameAr: "بروتين", optional: false, listPrice: 1000 },
    { serviceId: 1083, nameEn: "Hair Detail Color", nameAr: "تفاصيل لون", optional: true, listPrice: 150 },
    { serviceId: 1084, nameEn: "Relax Session", nameAr: "استرخاء", optional: true, listPrice: 200 },
    { serviceId: 1085, nameEn: "Groom Home Visit — Near the Salon", nameAr: "قريب", optional: true, listPrice: 300 },
    { serviceId: 1086, nameEn: "Groom Home Visit — Within the City", nameAr: "مدينة", optional: true, listPrice: 500 },
    { serviceId: 1087, nameEn: "Groom Home Visit — Extended Zone", nameAr: "ممتد", optional: true, listPrice: 1000 },
  ],
  groom: {
    optionalExtras: [
      {
        proId: 14,
        nameEn: "Foot pedicure",
        nameAr: "باديكير",
        price: 400,
        alreadyIncluded: true,
        availableAsOptional: false,
      },
      {
        proId: 1077,
        nameEn: "Medium Hair Protein",
        nameAr: "بروتين",
        price: 1000,
        alreadyIncluded: true,
        availableAsOptional: false,
      },
      {
        proId: 1083,
        nameEn: "Hair Detail Color",
        nameAr: "تفاصيل لون",
        price: 150,
        alreadyIncluded: false,
        availableAsOptional: true,
      },
      {
        proId: 1084,
        nameEn: "Relax Session",
        nameAr: "استرخاء",
        price: 200,
        alreadyIncluded: false,
        availableAsOptional: true,
      },
      {
        proId: 1085,
        nameEn: "Groom Home Visit — Near the Salon",
        nameAr: "قريب",
        price: 300,
        alreadyIncluded: false,
        availableAsOptional: true,
        mutuallyExclusiveGroup: "home_visit",
      },
      {
        proId: 1086,
        nameEn: "Groom Home Visit — Within the City",
        nameAr: "مدينة",
        price: 500,
        alreadyIncluded: false,
        availableAsOptional: true,
        mutuallyExclusiveGroup: "home_visit",
      },
      {
        proId: 1087,
        nameEn: "Groom Home Visit — Extended Zone",
        nameAr: "ممتد",
        price: 1000,
        alreadyIncluded: false,
        availableAsOptional: true,
        mutuallyExclusiveGroup: "home_visit",
      },
    ],
    optionalGroups: [
      { key: "groom_addons", titleEn: "Add to your order (optional)", titleAr: "أضف لطلبك (اختياري)", mutuallyExclusive: false },
      {
        key: "home_visit",
        titleEn: "Home visit (optional)",
        titleAr: "زيارة خارجية يوم الفرح (اختياري)",
        descriptionEn: "Choose the visit range that matches your wedding location.",
        descriptionAr: "اختار نطاق الزيارة المناسب حسب مكان تجهيز العريس يوم الفرح.",
        mutuallyExclusive: true,
      },
    ],
  },
});

describe("Cashier optionalExtras contract", () => {
  it("normalizes ProID flags from backend", () => {
    expect(
      normalizeGroomOptionalExtra({
        ProID: 1086,
        NameEn: "Within the city",
        NameAr: "داخل المدينة",
        Price: 500,
        alreadyIncluded: false,
        availableAsOptional: true,
        mutuallyExclusiveGroup: "home_visit",
      }),
    ).toMatchObject({
      proId: 1086,
      price: 500,
      availableAsOptional: true,
      alreadyIncluded: false,
      mutuallyExclusiveGroup: "home_visit",
    });
  });

  it("Essential exposes pedicure + protein as selectable", () => {
    const ids = getSelectableOptionalExtras(essential).map((item) => item.proId);
    expect(ids).toEqual(expect.arrayContaining([14, 1077, 1083, 1084, 1085, 1086, 1087]));
  });

  it("Signature exposes pedicure + protein as selectable", () => {
    const ids = getSelectableOptionalExtras(signature).map((item) => item.proId);
    expect(ids).toEqual(expect.arrayContaining([14, 1077]));
  });

  it("Complete hides ProID 14 and 1077 via alreadyIncluded / availableAsOptional", () => {
    const ids = getSelectableOptionalExtras(complete).map((item) => item.proId);
    expect(ids).not.toContain(14);
    expect(ids).not.toContain(1077);
    expect(ids).toEqual(expect.arrayContaining([1083, 1084, 1085, 1086, 1087]));
  });
});

describe("home visit mutuallyExclusiveGroup", () => {
  it("selecting 1086 replaces 1085", () => {
    const near = getSelectableOptionalExtras(signature).find((item) => item.proId === 1085)!;
    const city = getSelectableOptionalExtras(signature).find((item) => item.proId === 1086)!;
    const afterNear = toggleOptionalSelection([], near, signature);
    expect(afterNear).toEqual([1085]);
    const afterCity = toggleOptionalSelection(afterNear, city, signature);
    expect(afterCity).toEqual([1086]);
  });

  it("splitSelectableExtras puts 1085/1086/1087 in home_visit", () => {
    const { exclusiveByGroup } = splitSelectableExtras(complete);
    expect(exclusiveByGroup.home_visit?.map((item) => item.proId).sort()).toEqual([
      1085, 1086, 1087,
    ]);
  });
});

describe("package switch reconciliation", () => {
  it("drops pedicure/protein when switching Essential → Complete, keeps color + one home visit", () => {
    const next = reconcileOptionalSelection([14, 1077, 1083, 1085, 1086], complete);
    expect(next).toEqual([1083, 1085]);
    expect(next).not.toContain(14);
    expect(next).not.toContain(1077);
    expect(next.filter((id) => [1085, 1086, 1087].includes(id))).toHaveLength(1);
  });
});

describe("live total + booking payload", () => {
  it("totals package + optionals using backend prices only", () => {
    const selected = getSelectableOptionalExtras(signature).filter((item) =>
      [1083, 1086].includes(item.proId),
    );
    expect(
      getGroomTotals({ pack: signature, selectedOptionals: selected }),
    ).toMatchObject({
      packageSubtotal: 1500,
      optionalSubtotal: 650,
      totalPrice: 2150,
    });
  });

  it("payload preserves packageId, addonProIds, serviceIds without duplicate ProIDs", () => {
    const selected = getSelectableOptionalExtras(signature).filter((item) =>
      [1083, 1086].includes(item.proId),
    );
    const totals = getGroomTotals({ pack: signature, selectedOptionals: selected });
    const payload = buildGroomBookingPayload({
      pack: signature,
      selectedOptionals: selected,
      totals,
    });
    expect(payload.packageId).toBe(2);
    expect(payload.addonProIds).toEqual([1083, 1086]);
    expect(payload.serviceIds).toEqual([...new Set(payload.serviceIds)]);
    expect(payload.serviceIds).toEqual(expect.arrayContaining([1049, 1083, 1086]));
    expect(JSON.parse(payload.note).packageId).toBe(2);
  });
});
