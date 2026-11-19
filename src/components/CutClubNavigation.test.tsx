import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MainNav from "./MainNav";
import MobileMenuSheet from "./MobileMenuSheet";
const language = vi.hoisted(() => ({ lang: "ar", dir: "rtl", setLang: vi.fn() }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => language }));
vi.mock("next/navigation", () => ({ usePathname: () => "/cut-club", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./ClientProfileWidget", () => ({ default: () => null }));

describe("CUT CLUB navigation", () => {
  it.each(["ar", "en"])("routes both desktop CUT CLUB links to the public landing in %s", lang => {
    language.lang = lang;
    language.dir = lang === "ar" ? "rtl" : "ltr";
    render(<MainNav />);
    expect(screen.getByRole("menuitem", { name: lang === "ar" ? "عن CUT CLUB" : "About CUT CLUB" })).toHaveAttribute("href", "/cut-club");
    expect(screen.getByRole("menuitem", { name: "CUT CLUB" })).toHaveAttribute("href", "/cut-club");
  });

  it.each(["ar", "en"])("opens public Club from mobile and closes the sheet in %s", lang => {
    language.lang = lang;
    language.dir = lang === "ar" ? "rtl" : "ltr";
    const onClose = vi.fn();
    render(<MobileMenuSheet open onClose={onClose} />);
    const link = screen.getByRole("link", { name: lang === "ar" ? "عن CUT CLUB" : "About CUT CLUB" });
    expect(link).toHaveAttribute("href", "/cut-club");
    expect(document.querySelector('a[href="/client/loyalty"]')).not.toBeInTheDocument();
    expect(document.querySelectorAll('a[href="/cut-club"]').length).toBeGreaterThanOrEqual(2);
    link.addEventListener("click", event => event.preventDefault());
    fireEvent.click(link);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
