import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/context/LanguageContext";
import PublicCatalog from "./PublicCatalog";
import ServiceContent from "./ServiceContent";
import PricesPage from "@/app/prices/page";
vi.mock("@/components/prices/PricesClient", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
import ServicesPage from "@/app/services/page";
import HaircutPage, { metadata as haircutMetadata } from "@/app/services/haircut/page";
import BeardPage, { metadata as beardMetadata } from "@/app/services/beard/page";
vi.mock("@/lib/publicServiceCatalog", () => ({ loadPublicServiceCatalog: async () => [{ code: "A", name: "Test branch", available: true, services: [{ id: 1, ar: "قص شعر", en: "Haircut", price: 123 }, { id: 2, ar: "تهذيب ذقن", en: "Beard trim", price: 99 }] }] }));
const wrap = (children: React.ReactNode) => <LanguageProvider>{children}</LanguageProvider>;
describe("public service server HTML", () => {
  it("contains service facts, scoped prices and working links before hydration", async () => {
    for (const Page of [PricesPage, ServicesPage, HaircutPage, BeardPage]) {
      const html = renderToStaticMarkup(wrap(await Page()));
      expect(html).toContain("Test branch");
      expect(html).toContain('href="/book"');
      expect(html).toContain('href="/#branches"');
      expect(html).toContain('href="/prices"');
    }
    const hair = renderToStaticMarkup(wrap(await HaircutPage()));
    expect(hair).toContain("قص شعر");
    expect(hair).toContain("123");
    expect(hair).not.toContain("99");
    const beard = renderToStaticMarkup(wrap(await BeardPage()));
    expect(beard).toContain("تهذيب ذقن");
    expect(beard).toContain("99");
    expect(beard).not.toContain("123");
    const schema = JSON.parse(hair.match(/<script[^>]*>(.*?)<\/script>/)![1]);
    expect(schema).toMatchObject({ "@type": "Service", url: "https://cutsaloon.com/services/haircut" });
    expect(schema.offers).toBeUndefined();
    expect(haircutMetadata.alternates).toEqual({ canonical: "/services/haircut" });
    expect(beardMetadata.alternates).toEqual({ canonical: "/services/beard" });
  });
  it("renders honest unavailable copy rather than fallback numbers", () => {
    const html = renderToStaticMarkup(wrap(<PublicCatalog branches={[]} />));
    expect(html).toContain("لا نعرض أسعارًا تقديرية");
    expect(html).not.toContain("350");
  });
  it("follows the shared language selection", () => {
    // A small control uses the real shared context to verify both guide and catalog copy.
    render(wrap(<><Toggle /><ServiceContent guide="beard" /><PublicCatalog branches={[]} /></>));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Beard grooming in Alexandria");
    expect(screen.getByText(/Services and prices are unavailable/)).toBeInTheDocument();
  });
});
import { useLanguage } from "@/context/LanguageContext";
function Toggle() { const { setLang } = useLanguage(); return <button onClick={() => setLang("en")}>English</button>; }
