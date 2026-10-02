import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteChrome from "./SiteChrome";
const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("./MainNav", () => ({ default: () => <div>Main navigation</div> }));
vi.mock("./GlobalMobileNav", () => ({ default: () => <div>Mobile navigation</div> }));
vi.mock("./campaign/CampCaesarCampaign", () => ({ default: () => <div>Camp Caesar campaign</div> }));
describe("site chrome", () => {
  it.each(["/offers/october-333", "/offers/october-333/success", "/offers/another"])('excludes chrome on %s', pathname => {
    route.pathname = pathname;
    const { container } = render(<SiteChrome />);
    expect(container).toBeEmptyDOMElement();
  });
  it.each(["/", "/book", "/offers-other"])('preserves chrome on %s', pathname => {
    route.pathname = pathname;
    render(<SiteChrome />);
    expect(screen.getByText("Main navigation")).toBeInTheDocument();
    expect(screen.getByText("Mobile navigation")).toBeInTheDocument();
    expect(screen.getByText("Camp Caesar campaign")).toBeInTheDocument();
  });
});
