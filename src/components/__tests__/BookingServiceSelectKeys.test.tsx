import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import BookingServiceSelect from "@/components/BookingServiceSelect";
import { LanguageProvider } from "@/context/LanguageContext";
import type { BookingService } from "@/lib/booking-api";

function wrap(ui: ReactNode) {
  return <LanguageProvider>{ui}</LanguageProvider>;
}

function makeService(id: number, name: string): BookingService {
  return {
    id,
    name,
    nameAr: name,
    nameEn: name,
    price: 100,
    durationMinutes: 20,
    categoryName: "Skincare",
    isBookableOnline: true,
  };
}

describe("BookingServiceSelect keys", () => {
  beforeEach(() => {
    localStorage.setItem("cut-salon-lang", "en");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders overlapping other/addon services without duplicate-key warning", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const shared = makeService(11, "Deep SkinCare");
    const hairCut = makeService(1, "Hair Cut");

    render(
      wrap(
        <BookingServiceSelect
          services={[hairCut, shared, makeService(12, "Basic Skin Care")]}
          selectedIds={[1]}
          onToggleService={() => {}}
          onCoreSelect={() => {}}
        />,
      ),
    );

    const duplicateKeyLogs = spy.mock.calls.filter((args) =>
      args.some((a) => String(a ?? "").includes("same key") || String(a ?? "").includes("unique")),
    );
    expect(
      duplicateKeyLogs.map((c) => c.map((x) => String(x).slice(0, 180)).join(" || ")),
    ).toEqual([]);
    spy.mockRestore();
  });
});
