import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CutClubStore } from "./CutClubStore";
import { StoreItemCard } from "./StoreItemCard";
import { purchaseStoreItem, type StoreItem } from "./storeApi";

const item: StoreItem = {
  itemId: 123, code: "TEST", nameAr: "مكافأة تجريبية", nameEn: "Test reward",
  itemType: "FREE_SERVICE", priceCoins: 100, isFeatured: true, isActive: true,
  status: { canAfford: true, tierLocked: false, stockStatus: "IN_STOCK" },
};

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("CUT CLUB legacy store: secure purchase maintenance", () => {
  it("shows a truthful unavailable message and no active purchase", () => {
    const onPurchased = vi.fn();
    render(<CutClubStore items={[item]} currentBalance={500} clientId={42} onPurchased={onPurchased} />);
    expect(screen.getByRole("status").textContent).toContain("غير متاحين مؤقتًا");
    expect(screen.getByText("مكافأة تجريبية")).toBeInTheDocument();
    const purchase = screen.getByRole("button", { name: "الشراء غير متاح مؤقتًا" });
    expect(purchase).toBeDisabled();
    expect(screen.queryByRole("button", { name: "شراء الآن" })).not.toBeInTheDocument();
    expect(screen.queryByText("تأكيد الشراء")).not.toBeInTheDocument();
    fireEvent.click(purchase);
    expect(onPurchased).not.toHaveBeenCalled();
  });

  it("does not silently enable purchases when the account has enough Coins", () => {
    const onPurchase = vi.fn();
    render(<StoreItemCard item={item} currentBalance={99999}
      onPurchase={onPurchase} purchaseDisabled />);
    const button = screen.getByRole("button", { name: "الشراء غير متاح مؤقتًا" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it("client API helper rejects before network, regardless of caller clientId or itemId", async () => {
    const net = vi.spyOn(globalThis, "fetch");
    for (const id of ["1", "999", "someone-else", 42]) {
      await expect(purchaseStoreItem(id, 123)).rejects.toThrow("الشراء متوقف مؤقتًا");
    }
    expect(net).not.toHaveBeenCalled();
  });

  it("does not fabricate inventory or a zero Coins balance on empty catalog", () => {
    render(<CutClubStore items={[]} currentBalance={100} clientId="other" onPurchased={vi.fn()} />);
    expect(screen.getByText("لا توجد مكافآت للعرض حاليًا.")).toBeInTheDocument();
    expect(screen.queryByText("شراء الآن")).not.toBeInTheDocument();
  });
});
