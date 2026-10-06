import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OCTOBER_PACKAGE_SERVICES } from "@/config/octoberOffer";

const getPackageById = vi.fn();
vi.mock("@/lib/packagesApi", () => ({ getPackageById: (id: number) => getPackageById(id) }));

import { OctoberPackageClient } from "./OctoberPackageClient";

const livePackage = {
  packageId: 7,
  kind: "regular",
  nameAr: "باكدج أكتوبر",
  nameEn: "October Package",
  price: 333,
  originalPrice: 720,
  savings: 387,
  durationMinutes: 85,
  includes: [
    { serviceId: 9, durationMinutes: 30, optional: false },
    { serviceId: 10, durationMinutes: 20, optional: false },
    { serviceId: 22, durationMinutes: 5, optional: false },
    { serviceId: 29, durationMinutes: 30, optional: false },
  ],
};

describe("October package simple page", () => {
  beforeEach(() => {
    getPackageById.mockReset();
  });

  it("shows the package name, backend price and duration from packageId 7", async () => {
    getPackageById.mockResolvedValue(livePackage);
    render(<OctoberPackageClient />);

    expect(getPackageById).toHaveBeenCalledWith(7);
    expect(screen.getByRole("heading", { level: 1, name: "باكدج أكتوبر" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/85 دقيقة/)).toBeInTheDocument());
    const price = screen.getByTestId("october-package-price");
    expect(price).toHaveTextContent("333 جنيه");
    expect(price.querySelector("del")).toHaveTextContent("720 جنيه");
    expect(screen.getByText("احجز الباكدج أونلاين، والدفع داخل الفرع.")).toBeInTheDocument();
  });

  it("has a booking CTA above and below the video, both into the packageId 7 flow", () => {
    getPackageById.mockResolvedValue(livePackage);
    render(<OctoberPackageClient />);

    const ctas = screen.getAllByRole("link", { name: "احجز دلوقتي" });
    expect(ctas).toHaveLength(2);
    for (const cta of ctas) expect(cta).toHaveAttribute("href", "/book?mode=nearest&packageId=7");

    const video = screen.getByRole("region", { name: "فيديو الباكدج" });
    expect(ctas[0].compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(video.compareDocumentPosition(ctas[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("explains every package service with what it is, its steps and its benefit", async () => {
    getPackageById.mockResolvedValue(livePackage);
    render(<OctoberPackageClient />);

    const section = screen.getByRole("heading", { level: 2, name: "إيه اللي في الباكدج؟" }).closest("section")!;
    const services = within(section).getAllByRole("heading", { level: 3 });
    expect(services.map((h) => h.textContent)).toEqual([
      "01قص الشعر",
      "02الذقن والفيد",
      "03حمام الزيت",
      "04تنظيف البشرة الكلاسيكي",
    ]);
    for (const service of OCTOBER_PACKAGE_SERVICES) {
      const card = within(section).getByRole("heading", { level: 3, name: new RegExp(service.name) }).closest("li")!;
      expect(card).toHaveTextContent(service.about);
      expect(card).toHaveTextContent("المراحل");
      for (const step of service.steps) expect(card).toHaveTextContent(step);
      expect(card).toHaveTextContent(`الفايدة: ${service.benefit}`);
    }
    await waitFor(() =>
      expect(
        within(section).getByRole("heading", { level: 3, name: /حمام الزيت/ }).closest("li"),
      ).toHaveTextContent("5 دقيقة"),
    );
  });

  it("keeps the campaign price if the package can't be loaded", async () => {
    getPackageById.mockRejectedValue(new Error("offline"));
    render(<OctoberPackageClient />);
    await waitFor(() => expect(getPackageById).toHaveBeenCalled());
    expect(screen.getByTestId("october-package-price")).toHaveTextContent(/333 جنيه.*720 جنيه/);
    expect(screen.getAllByRole("link", { name: "احجز دلوقتي" })).toHaveLength(2);
  });

  it("shows a placeholder instead of requesting a video file that isn't uploaded yet", () => {
    getPackageById.mockResolvedValue(livePackage);
    const { container } = render(<OctoberPackageClient />);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("region", { name: "فيديو الباكدج" })).toHaveTextContent("فيديو الباكدج");
  });

  it("shows how much the customer saves", async () => {
    getPackageById.mockResolvedValue(livePackage);
    render(<OctoberPackageClient />);
    await waitFor(() => expect(screen.getByTestId("october-package-price")).toHaveTextContent("وفّر 387 جنيه"));
  });

  it("keeps the sticky booking bar hidden and unfocusable while an inline CTA is on screen", () => {
    getPackageById.mockResolvedValue(livePackage);
    render(<OctoberPackageClient />);
    const bar = screen.getByTestId("october-package-sticky-bar");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    const link = bar.querySelector("a")!;
    expect(link).toHaveAttribute("href", "/book?mode=nearest&packageId=7");
    expect(link).toHaveAttribute("tabindex", "-1");
  });

  it("opens a service's details when its summary tile is tapped", () => {
    getPackageById.mockResolvedValue(livePackage);
    Element.prototype.scrollIntoView = vi.fn();
    const { container } = render(<OctoberPackageClient />);

    const card = container.querySelector<HTMLDetailsElement>("#october-service-card-22")!;
    expect(card.open).toBe(false);
    const tiles = within(screen.getByRole("list", { name: "خدمات الباكدج" })).getAllByRole("link");
    expect(tiles).toHaveLength(4);
    fireEvent.click(tiles[2]);
    expect(card.open).toBe(true);
    expect(card.scrollIntoView).toHaveBeenCalled();
  });

  it("has none of the cinematic experience", () => {
    getPackageById.mockResolvedValue(livePackage);
    const { container } = render(<OctoberPackageClient />);
    expect(screen.queryByRole("button", { name: "ابدأ التجربة" })).toBeNull();
    expect(container.querySelector("audio")).toBeNull();
  });
});
