"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import MobileMenuSheet, { CutLogoMark, MOBILE_MENU_ID } from "@/components/MobileMenuSheet";

/**
 * Offer pages hide the global site chrome, so they carry this minimal header:
 * hamburger on the right (RTL start), logo centered by a symmetric 3-column grid.
 * Fixed + spacer rather than sticky: the global body overflow-x rule makes body a scroll container, which breaks sticky.
 */
export function OfferMobileHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        dir="rtl"
        data-scrolled={scrolled}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        className={`fixed inset-x-0 top-0 z-30 border-b transition-[background-color,border-color,backdrop-filter] duration-200 ${
          scrolled ? "border-cut-ivory/[0.06] bg-cut-black/75 backdrop-blur-md" : "border-transparent bg-cut-black"
        }`}
      >
        <div className="mx-auto grid h-14 w-full max-w-md grid-cols-[2.75rem_1fr_2.75rem] items-center px-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            className="inline-flex size-11 items-center justify-center rounded-xl text-cut-ivory transition hover:bg-cut-ivory/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cut-gold lg:invisible"
          >
            {menuOpen ? <X className="size-[22px]" strokeWidth={1.75} /> : <Menu className="size-[22px]" strokeWidth={1.75} />}
          </button>
          <div className="flex justify-center">
            <CutLogoMark compact={false} />
          </div>
          <span aria-hidden />
        </div>
      </header>
      <div aria-hidden style={{ height: "calc(3.5rem + 1px + env(safe-area-inset-top, 0px))" }} />
      <MobileMenuSheet open={menuOpen} onClose={closeMenu} returnFocusRef={triggerRef} />
    </>
  );
}
