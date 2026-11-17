import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClientVoucherHandoff, type ClubVoucherSummary } from "./ClientVoucherHandoff";

const vouchers: ClubVoucherSummary[] = [
  { inventoryId: 101, title: "خدمة شعر مجانية", status: "ACTIVE", expiresAt: "2099-01-01T00:00:00.000Z" },
  { inventoryId: 102, title: "قسيمة مستخدمة", status: "USED", expiresAt: null },
];
const proof = { inventoryId: 101, voucherCode: "CUT-PRIVATE-TEST-0123", expiresAt: "2099-01-01T00:00:00.000Z" };

describe("CUT CLUB customer voucher → cashier code handoff", () => {
  it("does not render any secret voucher code in initial server markup", () => {
    const html = renderToStaticMarkup(<ClientVoucherHandoff
      memberSessionReady={true} vouchers={vouchers} revealCode={vi.fn(async () => proof)} />);
    expect(html).toContain("عرض كود القسيمة");
    expect(html).not.toContain(proof.voucherCode);
    expect(html).not.toContain("clientId");
    expect(html).not.toContain("localStorage");
  });

  it("remains fully locked while WhatsApp verification is not connected", () => {
    const reveal = vi.fn(async () => proof);
    render(<ClientVoucherHandoff memberSessionReady={false} vouchers={vouchers} revealCode={reveal} />);
    expect(screen.getByText(/عرض الأكواد متوقف لحد تفعيل تسجيل الدخول الآمن/)).toBeInTheDocument();
    expect(screen.queryByText(proof.voucherCode)).not.toBeInTheDocument();
    expect(reveal).not.toHaveBeenCalled();
  });

  it("reveals only an owner-checked code after explicit click and can hide it", async () => {
    const reveal = vi.fn(async () => proof);
    render(<ClientVoucherHandoff memberSessionReady={true} vouchers={vouchers} revealCode={reveal} />);
    const buttons = screen.getAllByRole("button", { name: "عرض كود القسيمة" });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
    expect(reveal).not.toHaveBeenCalled();
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(screen.getByText(proof.voucherCode)).toBeInTheDocument());
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(reveal).toHaveBeenCalledWith(101);
    fireEvent.click(screen.getByRole("button", { name: "إخفاء" }));
    expect(screen.queryByText(proof.voucherCode)).not.toBeInTheDocument();
  });

  it("does not display codes from another voucher or invalid/expired results", async () => {
    const reveal = vi.fn(async () => ({ ...proof, inventoryId: 102 }));
    render(<ClientVoucherHandoff memberSessionReady={true} vouchers={vouchers} revealCode={reveal} />);
    fireEvent.click(screen.getAllByRole("button", { name: "عرض كود القسيمة" })[0]);
    await waitFor(() => expect(screen.getByText(/تعذر عرض الكود الآن/)).toBeInTheDocument());
    expect(screen.queryByText(proof.voucherCode)).not.toBeInTheDocument();
  });

  it("separates no vouchers from unavailable data and does no network call itself", () => {
    const callback = vi.fn(async () => null);
    const { rerender } = render(<ClientVoucherHandoff
      memberSessionReady={true} vouchers={null} revealCode={callback} />);
    expect(screen.getByText(/مش قادرين نحمل قسائمك حاليًا/)).toBeInTheDocument();
    rerender(<ClientVoucherHandoff memberSessionReady={true} vouchers={[]} revealCode={callback} />);
    expect(screen.getByText(/مافيش قسائم مسجلة/)).toBeInTheDocument();
    expect(callback).not.toHaveBeenCalled();
  });
});
