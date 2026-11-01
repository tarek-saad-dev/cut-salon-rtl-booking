const STORAGE_KEY = "cut:campaign-attribution";

export type CampaignAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
};

const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const satisfies readonly (keyof CampaignAttribution)[];

function readParam(params: URLSearchParams, key: (typeof KEYS)[number]): string | undefined {
  const value = params.get(key)?.trim();
  return value || undefined;
}

/** Persist UTM / click ids from the current URL into sessionStorage (first non-empty wins per key). */
export function captureCampaignAttribution(search?: string): CampaignAttribution {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(search ?? window.location.search);
  const existing = readCampaignAttribution();
  const next: CampaignAttribution = { ...existing };
  let changed = false;
  for (const key of KEYS) {
    const value = readParam(params, key);
    if (value && !next[key]) {
      next[key] = value;
      changed = true;
    }
  }
  if (changed) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }
  return next;
}

export function readCampaignAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: CampaignAttribution = {};
    for (const key of KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) out[key] = value.trim();
    }
    return out;
  } catch {
    return {};
  }
}
