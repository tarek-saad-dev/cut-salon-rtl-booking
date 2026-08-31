import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import BookingServiceStep from "@/components/booking-services/BookingServiceStep";
import { LanguageProvider } from "@/context/LanguageContext";
import type { BookingService } from "@/lib/booking-api";

function wrap(ui: ReactNode) {
  return <LanguageProvider>{ui}</LanguageProvider>;
}

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

const catalog = [
  svc({
    id: 9,
    name: "Hair Cut",
    nameAr: "حلاقة شعر",
    nameEn: "Hair Cut",
    categoryId: "19",
    categoryName: "قص الشعر",
    categoryNameAr: "قص الشعر",
    categoryNameEn: "Hair Cut",
    imageUrl: "https://casher-five.vercel.app/services/haircut.jpg",
  }),
  svc({
    id: 10,
    name: "Beard Styling & Fade",
    nameAr: "تهذيب دقن",
    nameEn: "Beard Styling",
    categoryId: "20",
    categoryName: "خدمات اللحية",
    categoryNameAr: "خدمات اللحية",
    categoryNameEn: "Beard Cut",
  }),
  svc({
    id: 11,
    name: "Haircut & Beard",
    nameAr: "شعر ودقن",
    nameEn: "Haircut & Beard",
    categoryId: "19",
    categoryName: "قص الشعر",
    categoryNameAr: "قص الشعر",
    categoryNameEn: "Hair Cut",
  }),
  svc({
    id: 20,
    name: "Face Mask",
    nameAr: "ماسك للبشرة",
    nameEn: "Face Mask",
    categoryId: "9",
    categoryName: "عناية البشرة",
    categoryNameAr: "عناية البشرة",
    categoryNameEn: "Skincare",
    price: 100,
    durationMinutes: 15,
  }),
];

const categories = [
  {
    id: "19",
    name: "قص الشعر",
    nameAr: "قص الشعر",
    nameEn: "Hair Cut",
    sortOrder: 10,
    serviceCount: 2,
    services: [catalog[0]!, catalog[2]!],
  },
  {
    id: "20",
    name: "خدمات اللحية",
    nameAr: "خدمات اللحية",
    nameEn: "Beard Cut",
    sortOrder: 20,
    serviceCount: 1,
    services: [catalog[1]!],
  },
  {
    id: "9",
    name: "عناية البشرة",
    nameAr: "عناية البشرة",
    nameEn: "Skincare",
    sortOrder: 60,
    serviceCount: 1,
    services: [catalog[3]!],
  },
];

describe("Phase 1E BookingServiceStep", () => {
  beforeEach(() => {
    localStorage.setItem("cut-salon-lang", "en");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders popular cards at top and compact cards in categories", () => {
    const { container } = render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
        />,
      ),
    );
    const popular = container.querySelectorAll('[data-service-card="popular"]');
    expect(popular.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: /Skincare/i }));
    const categoryCards = container.querySelectorAll(
      '[data-service-card="compact"], [data-service-card="featured"]',
    );
    expect(categoryCards.length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('[data-service-category="9"]')).toBeTruthy();
  });

  it("shows English service names only in EN", () => {
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
        />,
      ),
    );
    expect(screen.getAllByText("Hair Cut").length).toBeGreaterThan(0);
    expect(screen.queryByText(/clean cut and fade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/قص وتدريج نظيف/)).not.toBeInTheDocument();
  });

  it("shows Arabic service names only in AR", () => {
    localStorage.setItem("cut-salon-lang", "ar");
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
        />,
      ),
    );
    expect(screen.getAllByText("حلاقة شعر").length).toBeGreaterThan(0);
    expect(screen.queryByText(/clean cut and fade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/قص وتدريج نظيف/)).not.toBeInTheDocument();
  });

  it("filtering does not clear selection", () => {
    const onCore = vi.fn();
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[9]}
          onCoreSelect={onCore}
          onToggleService={() => undefined}
          selectedCount={1}
          totalPrice={200}
          totalDuration={30}
        />,
      ),
    );
    expect(document.querySelector('[data-service-card][data-selected="true"]')).toBeTruthy();
    const beardFilter = screen.getByRole("button", { name: /Beard Cut/i });
    fireEvent.click(beardFilter);
    expect(document.querySelector("[data-service-summary]")).toBeTruthy();
    expect(document.querySelector("[data-service-summary]")?.textContent).toMatch(/1/);
    expect(onCore).not.toHaveBeenCalled();
  });

  it("selected card exposes accessible selected state", () => {
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[9]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
        />,
      ),
    );
    const selected = document.querySelector('[data-service-card][data-selected="true"]');
    expect(selected).toBeTruthy();
    expect(selected?.getAttribute("aria-pressed")).toBe("true");
  });

  it("core select replaces previous core via onCoreSelect", () => {
    const onCore = vi.fn();
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[9]}
          onCoreSelect={onCore}
          onToggleService={() => undefined}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /Beard Cut/i }));
    const beard = screen.getAllByRole("radio").find((el) => {
      const text = el.textContent ?? "";
      return text.includes("Beard Styling") && !text.includes("Haircut");
    });
    expect(beard).toBeTruthy();
    fireEvent.click(beard!);
    expect(onCore).toHaveBeenCalledWith(10);
  });

  it("sticky summary shows count price duration", () => {
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[9]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
          selectedCount={1}
          totalPrice={200}
          totalDuration={30}
        />,
      ),
    );
    const summary = document.querySelector("[data-service-summary]");
    expect(summary?.textContent).toMatch(/1/);
    expect(summary?.textContent).toMatch(/200|EGP/i);
  });

  it("keeps cart collapsed after selecting; expands on tap with browse-services CTA", () => {
    const onToggle = vi.fn();
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[9]}
          onCoreSelect={() => undefined}
          onToggleService={onToggle}
          selectedCount={1}
          totalPrice={200}
          totalDuration={30}
          onContinue={() => undefined}
        />,
      ),
    );
    const cart = document.querySelector("[data-service-cart]");
    expect(cart).toBeTruthy();
    expect(cart?.getAttribute("data-cart-expanded")).toBe("false");
    expect(document.querySelector("[data-cart-continue]")).toBeTruthy();
    expect(document.querySelector("[data-cart-added-toast]")).toBeNull();

    const cartToggle = screen.queryByRole("button", { name: /View cart|عرض السلة/i });
    if (cartToggle) {
      fireEvent.click(cartToggle);
      expect(cart?.getAttribute("data-cart-expanded")).toBe("true");
      expect(document.querySelector('[data-cart-item="9"]')).toBeTruthy();
      expect(document.querySelector("[data-cart-browse-services]")).toBeTruthy();
      expect(document.querySelector("[data-cart-add-service]")).toBeTruthy();
      expect(document.querySelectorAll("[data-cart-upsell] button").length).toBe(1);

      const remove = screen.getByRole("button", { name: /Remove service from cart/i });
      fireEvent.click(remove);
      expect(onToggle).toHaveBeenCalledWith(9);
    } else {
      expect(document.querySelector("[data-cart-mobile-summary]")).toBeTruthy();
    }
  });

  it("shows green added-to-cart toast when a service is newly selected", () => {
    function Harness() {
      const [ids, setIds] = useState<number[]>([]);
      return (
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={ids}
          onCoreSelect={(id) => setIds([id])}
          onToggleService={(id) =>
            setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          selectedCount={ids.length}
          totalPrice={ids.length * 200}
          totalDuration={ids.length * 30}
          onContinue={() => undefined}
        />
      );
    }

    render(wrap(<Harness />));
    expect(document.querySelector("[data-cart-continue-disabled]")).toBeTruthy();

    const cards = screen.getAllByRole("radio");
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.click(cards[0]!);

    const toast = document.querySelector("[data-cart-added-toast]");
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toMatch(/Added .+ to cart|تم إضافة .+ للسلة|Added to cart|تم الإضافة للسلة/);
    expect(document.querySelector('[data-cart-pulse="true"]')).toBeTruthy();
  });

  it("loading skeletons match featured + compact layouts", () => {
    const { container } = render(
      wrap(
        <BookingServiceStep
          services={[]}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
          isLoading
        />,
      ),
    );
    expect(container.querySelector('[data-service-step="loading"]')).toBeTruthy();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(3);
  });

  it("API failure is not treated as empty catalog", () => {
    render(
      wrap(
        <BookingServiceStep
          services={[]}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
          isError
          onRetry={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("alert").textContent).toMatch(/couldn’t load|تعذر/i);
    expect(screen.queryByText(/no services are available for this barber/i)).not.toBeInTheDocument();
  });

  it("keyboard Space activates a service card", () => {
    const onCore = vi.fn();
    render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[]}
          onCoreSelect={onCore}
          onToggleService={() => undefined}
        />,
      ),
    );
    const card = screen.getAllByRole("radio")[0];
    fireEvent.keyDown(card, { key: " " });
    expect(onCore).toHaveBeenCalled();
  });

  it("uses backend categories for filters and section order", () => {
    const { container } = render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
        />,
      ),
    );
    const toolbar = container.querySelector("[data-service-filters]");
    const labels = [...(toolbar?.querySelectorAll("button") ?? [])].map(
      (b) => b.textContent?.trim() ?? "",
    );
    expect(labels).toEqual(["Beard Cut", "Skincare"]);
    expect(container.querySelector('[data-service-category="20"]')).toBeTruthy();
    expect(screen.queryByRole("button", { name: /All services/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Hair$/i })).not.toBeInTheDocument();
  });

  it("renders Most Popular section above category filters", () => {
    const mostPopular = {
      id: "most_popular",
      title: "الأكثر طلباً",
      titleAr: "الأكثر طلباً",
      titleEn: "Most Popular",
      services: [
        { ...catalog[2]!, popularityRank: 1, isMostRequested: true },
        { ...catalog[0]!, popularityRank: 2, isMostRequested: true },
      ],
    };
    const { container } = render(
      wrap(
        <BookingServiceStep
          services={catalog}
          categories={categories}
          mostPopular={mostPopular}
          selectedIds={[]}
          onCoreSelect={() => undefined}
          onToggleService={() => undefined}
          onContinue={() => undefined}
        />,
      ),
    );
    const toolbarLabels = [
      ...(container.querySelector("[data-service-filters]")?.querySelectorAll("button") ?? []),
    ].map((b) => b.textContent?.trim() ?? "");
    expect(toolbarLabels).toEqual(["Beard Cut", "Skincare"]);
    expect(screen.queryByRole("button", { name: /Most Popular/i })).not.toBeInTheDocument();

    const ready = container.querySelector('[data-service-step="ready"]');
    const popularSection = ready?.querySelector("[data-most-popular]");
    const allServicesSection = ready?.querySelector("[data-all-services]");
    expect(popularSection).toBeTruthy();
    expect(allServicesSection).toBeTruthy();
    expect(
      popularSection!.compareDocumentPosition(allServicesSection!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelectorAll('[data-service-card="popular"]').length).toBe(2);
    expect(document.querySelector("[data-cart-continue-disabled]")).toBeTruthy();
  });
});
