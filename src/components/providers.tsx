"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { BranchProvider } from "@/context/BranchContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { MobileNavProvider } from "@/context/MobileNavContext";
import { BookingControllerProvider } from "@/context/BookingController";
import BookingPrefetchBoot from "@/components/BookingPrefetchBoot";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Global language state is ready; pages opt into bilingual direction as they are migrated. */}
          <LanguageProvider>
            <MobileNavProvider>
              <BranchProvider>
                <BookingPrefetchBoot />
                <BookingControllerProvider>{children}</BookingControllerProvider>
              </BranchProvider>
            </MobileNavProvider>
          </LanguageProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
