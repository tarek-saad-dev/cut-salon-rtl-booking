import { describe, it, expect } from "vitest";
import type { BookingService } from "@/lib/booking-api";
import {
  availableServiceFilters,
  defaultServiceFilter,
  getServicePresentation,
  resolveFeaturedServices,
  serviceMatchesFilter,
} from "@/lib/booking/service-presentation";
import { getServiceVisual } from "@/lib/booking/service-visuals";

function svc(
  partial: Partial<BookingService> & { id: number; name: string },
): BookingService {
  return {
    nameAr: partial.nameAr ?? partial.name,
    nameEn: partial.nameEn ?? partial.name,
    price: partial.price ?? 200,
    durationMinutes: partial.durationMinutes ?? 30,
    categoryName: partial.categoryName ?? null,
    isBookableOnline: true,
    ...partial,
  };
}

describe("service presentation + featured", () => {
  const catalog = [
    svc({ id: 9, name: "Hair Cut", nameAr: "حلاقة شعر", nameEn: "Hair Cut" }),
    svc({ id: 10, name: "Beard Styling & Fade", nameAr: "دقن", nameEn: "Beard Styling" }),
    svc({
      id: 11,
      name: "Haircut & Beard",
      nameAr: "شعر ودقن",
      nameEn: "Haircut & Beard",
    }),
    svc({ id: 20, name: "Face Mask", nameAr: "ماسك", nameEn: "Face Mask", price: 100, durationMinutes: 15 }),
    svc({ id: 21, name: "Deep SkinCare", nameAr: "تنظيف عميق", nameEn: "Deep SkinCare" }),
  ];

  it("featured services resolve first for core packages", () => {
    const featured = resolveFeaturedServices(catalog);
    expect(featured.map((s) => s.id).slice(0, 3)).toEqual(
      expect.arrayContaining([9, 10, 11]),
    );
    expect(featured[0].id).not.toBe(20);
  });

  it("English presentation does not include Arabic description text", () => {
    const p = getServicePresentation(catalog[0], "en");
    expect(p.displayName).toBe("Hair Cut");
    expect(p.description).toMatch(/clean cut/i);
    expect(p.description).not.toMatch(/قص|تدريج|وجهك/);
  });

  it("Arabic presentation does not include English benefit copy", () => {
    const p = getServicePresentation(catalog[0], "ar");
    expect(p.displayName).toBe("حلاقة شعر");
    expect(p.description).toMatch(/قص|تدريج/);
    expect(p.description).not.toMatch(/clean cut|tailored/i);
  });

  it("filters only expose categories with services", () => {
    const featured = resolveFeaturedServices(catalog);
    const filters = availableServiceFilters(catalog, featured);
    expect(filters).toContain("all");
    expect(filters).toContain("popular");
    expect(filters).toContain("hair");
    expect(filters).toContain("care");
  });

  it("default filter prefers popular when enough featured exist", () => {
    const featured = resolveFeaturedServices(catalog);
    const filters = availableServiceFilters(catalog, featured);
    expect(defaultServiceFilter(featured, filters)).toBe("popular");
  });

  it("filtering by hair excludes pure skincare", () => {
    const featuredIds = new Set(resolveFeaturedServices(catalog).map((s) => s.id));
    expect(serviceMatchesFilter(catalog[0], "hair", featuredIds)).toBe(true);
    expect(serviceMatchesFilter(catalog[4], "hair", featuredIds)).toBe(false);
  });

  it("API image wins in visual resolver", () => {
    const visual = getServiceVisual({
      service: svc({
        id: 9,
        name: "Hair Cut",
        imageUrl: "https://casher-five.vercel.app/services/haircut.jpg",
      }),
    });
    expect(visual.fromApi).toBe(true);
    expect(visual.image).toContain("haircut.jpg");
  });

  it("unknown service uses category/icon fallback without throwing", () => {
    const visual = getServiceVisual({
      service: svc({ id: 99, name: "Mystery Ritual", categoryName: "Other" }),
    });
    expect(visual.iconHint).toBeTruthy();
  });
});
