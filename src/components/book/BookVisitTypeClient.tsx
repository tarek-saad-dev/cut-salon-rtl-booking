"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeBranchCode } from "@/lib/booking-api/branch-code";

/**
 * Visit-type step is temporarily skipped (group booking not live yet).
 * Old links still land here and bounce straight to services as individual.
 */
export default function BookVisitTypeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branch = normalizeBranchCode(searchParams.get("branch") ?? "");

  useEffect(() => {
    if (!branch) {
      router.replace("/book");
      return;
    }
    router.replace(
      `/book/services?branch=${encodeURIComponent(branch)}&visit=individual`,
    );
  }, [branch, router]);

  return <div className="min-h-[100svh] bg-cut-soft-ivory" aria-busy="true" />;
}
