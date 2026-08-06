import { describe, it, expect } from "vitest";
import {
  filterCatalogByServiceIds,
  normalizeServicesCatalog,
} from "@/lib/booking-api/services";

describe("normalizeServicesCatalog", () => {
  it("prefers categories order from admin sortOrder", () => {
    const catalog = normalizeServicesCatalog({
      ok: true,
      categories: [
        {
          id: 20,
          name: "خدمات اللحية",
          nameAr: "خدمات اللحية",
          nameEn: "Beard Cut",
          sortOrder: 20,
          services: [
            {
              id: 10,
              name: "Beard",
              nameAr: "ذقن",
              nameEn: "Beard",
              price: 50,
              durationMinutes: 15,
              categoryName: "خدمات اللحية",
              isBookableOnline: true,
              sortOrder: 1,
            },
          ],
        },
        {
          categoryId: "19",
          id: 19,
          name: "قص الشعر",
          nameAr: "قص الشعر",
          nameEn: "Hair Cut",
          sortOrder: 10,
          services: [
            {
              id: 9,
              name: "Hair Cut",
              nameAr: "قص",
              nameEn: "Hair Cut",
              price: 100,
              durationMinutes: 30,
              categoryName: "قص الشعر",
              isBookableOnline: true,
              sortOrder: 1,
            },
          ],
        },
      ],
      meta: { preferredShape: "categories" },
    });

    expect(catalog.categories.map((c) => c.id)).toEqual(["19", "20"]);
    expect(catalog.services.map((s) => s.id)).toEqual([9, 10]);
    expect(catalog.categories[0]?.services[0]?.categoryId).toBe("19");
    expect(catalog.mostPopular).toBeNull();
  });

  it("parses mostPopular first and sorts by popularityRank", () => {
    const catalog = normalizeServicesCatalog({
      ok: true,
      categories: [
        {
          id: 19,
          name: "قص الشعر",
          sortOrder: 10,
          services: [
            {
              id: 9,
              name: "Hair Cut",
              price: 100,
              durationMinutes: 30,
              categoryName: null,
              isBookableOnline: true,
            },
            {
              id: 20,
              name: "شعر ودقن",
              nameAr: "شعر ودقن",
              nameEn: "Haircut & Beard",
              price: 250,
              durationMinutes: 45,
              categoryName: null,
              isBookableOnline: true,
            },
          ],
        },
      ],
      mostPopular: {
        id: "most_popular",
        title: "الأكثر طلباً",
        titleAr: "الأكثر طلباً",
        titleEn: "Most Popular",
        services: [
          {
            serviceId: 20,
            name: "شعر ودقن",
            popularityRank: 1,
            price: 250,
            durationMinutes: 45,
            imageUrl: "https://example.com/a.jpg",
            categoryName: null,
            isBookableOnline: true,
          },
          {
            serviceId: 9,
            name: "Hair Cut",
            popularityRank: 2,
            price: 100,
            durationMinutes: 30,
            categoryName: null,
            isBookableOnline: true,
          },
        ],
      },
    });

    expect(catalog.mostPopular?.id).toBe("most_popular");
    expect(catalog.mostPopular?.titleEn).toBe("Most Popular");
    expect(catalog.mostPopular?.services.map((s) => s.id)).toEqual([20, 9]);
    expect(catalog.mostPopular?.services[0]?.popularityRank).toBe(1);
    expect(catalog.mostPopular?.services[0]?.isMostRequested).toBe(true);
  });

  it("filters categories by allowed service ids", () => {
    const catalog = normalizeServicesCatalog({
      ok: true,
      categories: [
        {
          id: 19,
          name: "قص الشعر",
          sortOrder: 10,
          services: [
            {
              id: 9,
              name: "Hair Cut",
              price: 100,
              durationMinutes: 30,
              categoryName: null,
              isBookableOnline: true,
            },
            {
              id: 11,
              name: "Combo",
              price: 150,
              durationMinutes: 45,
              categoryName: null,
              isBookableOnline: true,
            },
          ],
        },
      ],
    });
    const filtered = filterCatalogByServiceIds(catalog, new Set([11]), true);
    expect(filtered.services.map((s) => s.id)).toEqual([11]);
    expect(filtered.categories).toHaveLength(1);
    expect(filtered.categories[0]?.services.map((s) => s.id)).toEqual([11]);
  });
});
