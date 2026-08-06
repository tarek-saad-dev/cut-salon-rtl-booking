import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
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

  it("renders featured cards first and compact for secondary", () => {
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
    const featured = container.querySelectorAll('[data-service-card="featured"]');
    expect(featured.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByRole("button", { name: /All services/i }));
    const compact = container.querySelectorAll('[data-service-card="compact"]');
    expect(compact.length).toBeGreaterThanOrEqual(1);
  });

  it("shows English name/description only in EN", () => {
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
    expect(screen.getAllByText(/clean cut and fade/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/قص وتدريج نظيف/)).not.toBeInTheDocument();
  });

  it("shows Arabic name/description only in AR", () => {
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
    expect(screen.getAllByText(/قص وتدريج نظيف/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/clean cut and fade/i)).not.toBeInTheDocument();
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
    expect(screen.getByText(/Selected/i)).toBeInTheDocument();
    const allFilter = screen.getByRole("button", { name: /All services/i });
    fireEvent.click(allFilter);
    expect(screen.getByText(/Selected/i)).toBeInTheDocument();
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
    expect(labels[0]).toMatch(/All services/i);
    expect(labels.slice(1)).toEqual(["Hair Cut", "Beard Cut", "Skincare"]);
    expect(container.querySelector('[data-service-category="19"]')).toBeTruthy();
    expect(container.querySelector('[data-service-category="20"]')).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Hair$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Most popular/i })).not.toBeInTheDocument();
  });
});
