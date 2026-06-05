const KEY = "cut_client";

export interface StoredClient {
  id?: number;
  name: string;
  phone: string;
}

export function getSavedClient(): StoredClient | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredClient;
  } catch {
    return null;
  }
}

export function saveClient(data: StoredClient): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearClient(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
