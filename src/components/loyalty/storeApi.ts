// ─── CUT CLUB — Store API Layer ────────────────────────────────────────────
// Fetches store items and handles purchases via the Economy Store endpoints.

const API_BASE = (process.env.NEXT_PUBLIC_BOOKING_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

function buildUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type StoreItemStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface StoreItemStatus {
  canAfford: boolean;
  tierLocked: boolean;
  stockStatus: StoreItemStockStatus;
}

export interface StoreItem {
  itemId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  itemType:
    | "DISCOUNT_AMOUNT"
    | "DISCOUNT_PERCENT"
    | "FREE_SERVICE"
    | "DOUBLE_POINTS"
    | "BONUS_POINTS"
    | "VIP_UPGRADE"
    | "MYSTERY_BOX"
    | string;
  priceCoins: number;
  value?: number;
  stockQuantity?: number;
  unlimitedStock?: boolean;
  expiresAfterDays?: number;
  minTierCode?: string;
  isFeatured: boolean;
  isActive: boolean;
  categoryId?: number;
  sortOrder?: number;
  status?: StoreItemStatus;
}

export interface StoreCategory {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface StoreResponse {
  ok: true;
  coinsBalance: number;
  categories: StoreCategory[];
  featuredItems: StoreItem[];
  items: StoreItem[];
}

export interface PurchaseResponse {
  ok: true;
  message?: string;
  purchase?: {
    inventoryId: number;
    itemId: number;
    nameAr: string;
    nameEn: string;
    priceCoins: number;
    voucherCode: string;
    expiresAt: string | null;
  };
  newBalance?: number;
}

export interface InventoryItem {
  id: number;
  itemId: number;
  nameAr: string;
  nameEn: string;
  itemType: string;
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";
  voucherCode?: string;
  purchasedAt: string;
  expiresAt?: string | null;
  usedAt?: string | null;
}

export interface InventoryResponse {
  ok: true;
  items: InventoryItem[];
  stats: {
    totalActive: number;
    totalUsed: number;
    expiringThisWeek: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getErrorMessage(data: unknown, fallback: string): string {
  if (data !== null && typeof data === "object") {
    return (
      ((data as Record<string, unknown>).error as string | undefined) ??
      ((data as Record<string, unknown>).message as string | undefined) ??
      fallback
    );
  }
  return fallback;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function fetchStore(
  clientId: string | number,
): Promise<StoreResponse> {
  const res = await fetch(
    buildUrl(
      `/api/public/client/store?clientId=${encodeURIComponent(clientId)}`,
    ),
    { cache: "no-store" },
  );
  const data: unknown = await res.json().catch(() => null);

  if (
    !res.ok ||
    (data !== null &&
      typeof data === "object" &&
      (data as Record<string, unknown>).ok === false)
  ) {
    throw new Error(getErrorMessage(data, "فشل تحميل المتجر"));
  }

  return data as StoreResponse;
}

/**
 * Legacy client-side purchases are disabled until a verified CUT CLUB customer
 * session + tenant-authorized Casher mutation API exists (Casher #243/#264).
 * This is UX defense-in-depth, not an alternative to server auth.
 */
export async function purchaseStoreItem(
  _clientId: string | number,
  _itemId: number,
): Promise<PurchaseResponse> {
  throw new Error("الشراء متوقف مؤقتًا لحين تأمين حساب CUT CLUB.");
}

export async function fetchClientInventory(
  clientId: string | number,
  status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED" | "ALL" = "ACTIVE",
): Promise<InventoryResponse> {
  const res = await fetch(
    buildUrl(
      `/api/public/client/inventory?clientId=${encodeURIComponent(clientId)}&status=${status}`,
    ),
    { cache: "no-store" },
  );
  const data: unknown = await res.json().catch(() => null);
  if (
    !res.ok ||
    (data !== null &&
      typeof data === "object" &&
      (data as Record<string, unknown>).ok === false)
  ) {
    throw new Error(getErrorMessage(data, "فشل تحميل المشتريات"));
  }
  return data as InventoryResponse;
}
