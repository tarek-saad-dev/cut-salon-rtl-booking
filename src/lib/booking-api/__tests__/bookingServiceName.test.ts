import { describe, expect, it } from "vitest";
import {
  formatServiceLabelBilingual,
  formatServicesSummary,
  serviceNameAr,
  serviceNameEn,
} from "../service-name";

describe("serviceName helpers", () => {
  const hair = {
    name: "Hair Cut",
    nameAr: "حلاقة شعر",
    nameEn: "Hair Cut",
  };

  it("prefers locale-specific fields", () => {
    expect(serviceNameAr(hair)).toBe("حلاقة شعر");
    expect(serviceNameEn(hair)).toBe("Hair Cut");
  });

  it("falls back when one locale is missing", () => {
    expect(serviceNameAr({ name: "Hair Cut", nameAr: null, nameEn: "Hair Cut" })).toBe(
      "Hair Cut",
    );
    expect(serviceNameEn({ name: "حلاقة", nameAr: "حلاقة", nameEn: null })).toBe("حلاقة");
  });

  it("formats bilingual labels", () => {
    expect(formatServiceLabelBilingual(hair)).toBe("حلاقة شعر · Hair Cut");
    expect(
      formatServiceLabelBilingual({ name: "حلاقة", nameAr: "حلاقة", nameEn: "حلاقة" }),
    ).toBe("حلاقة");
  });

  it("joins multiple services", () => {
    expect(
      formatServicesSummary([
        hair,
        { name: "Beard", nameAr: "ذقن", nameEn: "Beard" },
      ]),
    ).toBe("حلاقة شعر · Hair Cut + ذقن · Beard");
  });
});
