import { bookingApiRequest } from "./client";
import type { PublicBranch, BookingApiResponse } from "./types";

interface BranchesResponse {
  ok: boolean;
  branches: PublicBranch[];
}

export async function listPublicBranches(
  signal?: AbortSignal,
): Promise<BookingApiResponse<PublicBranch[]>> {
  const res = await bookingApiRequest<BranchesResponse>({
    path: "/api/public/branches",
    signal,
    timeoutMs: 15_000,
  });
  return { ...res, data: res.data.branches };
}
