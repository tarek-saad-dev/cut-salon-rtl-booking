import { buildCasherPublicApiUrl } from "@/lib/casherPublicApiUrl";

export interface ClientLookupRecord {
  id: number;
  name: string;
  mobile: string;
  phone: string;
  address: string;
  email: string;
}

export interface ClientLookupResponse {
  ok: boolean;
  found?: boolean;
  client?: ClientLookupRecord | null;
  message?: string;
}

export interface ClientUpdatePayload {
  clientId: number;
  name?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  email?: string;
}

export interface ClientUpdateResponse {
  ok: boolean;
  message?: string;
}

export async function lookupClientByMobile(
  mobile: string,
  init?: Pick<RequestInit, "signal">,
): Promise<ClientLookupResponse> {
  const digits = mobile.replace(/\D/g, "");
  const res = await fetch(
    buildCasherPublicApiUrl(
      `/api/client/lookup?mobile=${encodeURIComponent(digits)}`,
    ),
    { cache: "no-store", ...init },
  );
  return (await res.json()) as ClientLookupResponse;
}

export async function updateClientProfile(
  payload: ClientUpdatePayload,
): Promise<ClientUpdateResponse> {
  const res = await fetch(buildCasherPublicApiUrl("/api/client/update"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as ClientUpdateResponse;
}
