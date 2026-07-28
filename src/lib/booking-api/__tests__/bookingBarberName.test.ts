import { describe, it, expect } from "vitest";
import { resolveBarberDisplayName } from "../barber-name";

describe("resolveBarberDisplayName", () => {
  const barber = { name: "زياد", nameAr: "زياد", nameEn: "Ziad" };

  it("prefers English name for en locale", () => {
    expect(resolveBarberDisplayName(barber, "en")).toBe("Ziad");
  });

  it("prefers Arabic name for ar locale", () => {
    expect(resolveBarberDisplayName(barber, "ar")).toBe("زياد");
  });

  it("falls back when nameEn is missing", () => {
    expect(
      resolveBarberDisplayName({ nameAr: "احمد", name: "احمد", nameEn: null }, "en"),
    ).toBe("احمد");
  });
});
