import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CutClubPage, { metadata } from "./page";

describe("CUT CLUB wallet-first public member experience", () => {
  it("renders the actual wallet UI in Arabic before hydration, never invented customer data", () => {
    const html = renderToStaticMarkup(<CutClubPage />);
    expect(html).toContain("محفظتك. كل حاجة في مكانها.");
    expect(html).toContain("CUT Coins");
    expect(html).toContain("قسائمي ومكافآتي");
    expect(html).toContain("سجل حركة النقاط");
    expect(html).toContain("رصيد ترويجي");
    expect(html).not.toMatch(/<form|<input|clientId|CUT-20491|DEMO|رصيد تجريبي/);
    render(<CutClubPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByTestId("cut-club-experience")).toHaveAttribute("dir", "rtl");
    expect(screen.getByTestId("cut-club-experience")).toHaveAttribute("lang", "ar");
    expect(screen.getByRole("navigation", { name: "أقسام CUT CLUB" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "CUT CLUB الموبايل" })).toBeInTheDocument();
    expect(screen.getByText("البيانات الخاصة لا تظهر للزائر")).toBeInTheDocument();
  });

  it("navigates all member areas including rewards, partnerships and referrals without server requests", () => {
    render(<CutClubPage />);
    const nav = screen.getByRole("navigation", { name: "أقسام CUT CLUB" });
    fireEvent.click(within(nav).getByRole("button", { name: "المكافآت" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("المكافآت اللي تستاهل زيارتك");
    expect(screen.getAllByRole("button", { name: "تفاصيل الخدمة" })).toHaveLength(4);
    fireEvent.click(within(nav).getByRole("button", { name: "العضويات" }));
    expect(screen.getByText("المدارس والجامعات")).toBeInTheDocument();
    expect(screen.getByText("الأطباء")).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "الإحالات" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("شارك تجربة CUT");
    fireEvent.click(within(nav).getByRole("button", { name: "حسابي" }));
    expect(screen.getByText("مفيش جلسة عضو موثقة")).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "محفظتي" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("محفظتك");
  });

  it("provides functional public booking/pricing while withholding private wallet data", () => {
    render(<CutClubPage />);
    const links = screen.getAllByRole("link");
    expect(links.some(l => l.getAttribute("href") === "/book")).toBe(true);
    expect(links.some(l => l.getAttribute("href") === "/prices")).toBe(true);
    expect(links.every(l => ["/", "/book", "/prices", "#cut-club-content"].includes(l.getAttribute("href")!))).toBe(true);
    expect(screen.getAllByText(/يظهر بعد التحقق من الحساب/).length).toBeGreaterThan(0);
  });

  it("preserves public canonical and social metadata", () => {
    expect(metadata.alternates).toEqual({ canonical: "/cut-club" });
    expect(metadata.openGraph).toMatchObject({
      url: "/cut-club",
      description: metadata.description,
      title: "CUT CLUB | محفظتك وعضويتك في CUT Salon",
    });
    expect(metadata.twitter).toMatchObject({ title: "CUT CLUB | محفظتك وعضويتك في CUT Salon" });
    expect(metadata.robots).toBeUndefined();
  });
});
