import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CutClubPage, { metadata } from "./page";

describe("public CUT CLUB landing", () => {
  it("renders useful Arabic content and a single H1 before hydration", () => {
    const html = renderToStaticMarkup(<CutClubPage />);
    expect(html).toContain("ما هو CUT CLUB؟");
    expect(html).toContain("النقاط");
    expect(html).toContain("المستوى");
    expect(html).not.toMatch(/<form|<input|clientId|CUT-20491|1240/);
    render(<CutClubPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("main")).toHaveAttribute("lang", "ar");
    expect(screen.getAllByRole("region").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("list", { name: "رحلتك مع CUT CLUB" }).tagName).toBe("OL");
  });

  it("offers real public destinations and FAQs without a wallet or signup", () => {
    render(<CutClubPage />);
    const main = screen.getByRole("main");
    const links = within(main).getAllByRole("link");
    expect(links.some(link => link.getAttribute("href") === "/book")).toBe(true);
    expect(links.some(link => link.getAttribute("href") === "/prices")).toBe(true);
    expect(links.every(link => ["/book", "/prices", "#rewards"].includes(link.getAttribute("href")!))).toBe(true);
    expect(main.querySelectorAll("details").length).toBeGreaterThanOrEqual(4);
    fireEvent.click(screen.getByText("هل كل زيارة تمنحني مكافأة؟"));
    fireEvent.click(screen.getByText("هل أستطيع إدارة حسابي من هذه الصفحة؟"));
    expect(screen.getByText(/لا تضمن كل زيارة/)).toBeVisible();
    expect(screen.getByText(/لا تعرض رصيدًا شخصيًا/)).toBeVisible();
  });

  it("exports route-specific canonical and matching social metadata", () => {
    expect(metadata.alternates).toEqual({ canonical: "/cut-club" });
    expect(metadata.openGraph).toMatchObject({ url: "/cut-club", description: metadata.description, title: "CUT CLUB | تعرّف على برنامج الولاء في CUT Salon" });
    expect(metadata.twitter).toMatchObject({ description: metadata.description, title: "CUT CLUB | تعرّف على برنامج الولاء في CUT Salon" });
    expect(metadata.robots).toBeUndefined();
  });
});
