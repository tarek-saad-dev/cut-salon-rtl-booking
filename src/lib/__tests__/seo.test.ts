import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import sitemap from "@/app/sitemap";
import { CANONICAL_ORIGIN, publicPageMetadata } from "@/lib/seo";

const source = (path: string) => readFileSync(`src/app/${path}`, "utf8");

describe("technical SEO policy", () => {
  it("lists exactly the existing public canonical landing URLs without fake dates", () => {
    expect(sitemap()).toEqual(["/", "/prices", "/services", "/services/haircut", "/services/beard", "/book", "/offers/november-protein"].map(path => ({
      url: new URL(path, CANONICAL_ORIGIN).href,
    })));
  });

  it("allows crawlers to read noindex and declares the absolute sitemap", () => {
    const robots = readFileSync("public/robots.txt", "utf8");
    expect(robots).toContain("Sitemap: https://cutsaloon.com/sitemap.xml");
    expect(robots).not.toMatch(/^Disallow:\s*\S/m);
    expect(readdirSync("src/app")).not.toContain("robots.ts");
  });

  it("gives each public page its own canonical and matching social copy", () => {
    const routes = ["", "prices/", "services/", "services/haircut/", "services/beard/", "book/", "offers/november-protein/"];
    for (const route of routes) {
      const page = source(`${route}page.tsx`);
      expect(page).toContain("publicPageMetadata(");
      expect(page).not.toContain("searchParams");
      expect(page).not.toContain("index: false");
    }
    for (const path of ["/", "/prices", "/services", "/services/haircut", "/services/beard", "/book", "/offers/november-protein"]) {
      const metadata = publicPageMetadata(path, `Title ${path}`, `Description ${path}`);
      expect(metadata.alternates).toEqual({ canonical: path });
      expect(metadata.openGraph).toMatchObject({ url: path, title: `Title ${path}`, description: `Description ${path}` });
      expect(metadata.twitter).toMatchObject({ title: `Title ${path}`, description: `Description ${path}`, card: "summary_large_image" });
      expect(metadata.robots).toBeUndefined();
    }
    expect(source("page.tsx")).toContain('publicPageMetadata("/",');
    expect(source("prices/page.tsx")).toContain('publicPageMetadata("/prices",');
    expect(source("book/page.tsx")).toContain('publicPageMetadata("/book",');
    expect(source("offers/november-protein/page.tsx")).toContain("novemberProteinOffer.href,");
    // Inspect metadata keys so favicon URLs cannot trigger the page-URL policy.
    const layout = ts.createSourceFile("layout.tsx", source("layout.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const metadataDeclaration = layout.statements
      .filter(ts.isVariableStatement)
      .flatMap(statement => [...statement.declarationList.declarations])
      .find(declaration => declaration.name.getText(layout) === "metadata");
    const rootMetadata = metadataDeclaration?.initializer;
    expect(rootMetadata && ts.isObjectLiteralExpression(rootMetadata)).toBe(true);
    if (!rootMetadata || !ts.isObjectLiteralExpression(rootMetadata)) throw new Error("Missing root metadata object");
    for (const [section, forbiddenKey] of [["alternates", "canonical"], ["openGraph", "url"]]) {
      const property = rootMetadata.properties.find(property => property.name?.getText(layout).replace(/["']/g, "") === section);
      if (!property) continue;
      expect(ts.isPropertyAssignment(property) && ts.isObjectLiteralExpression(property.initializer)).toBe(true);
      if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) throw new Error(`Expected literal ${section} metadata`);
      expect(property.initializer.properties.map(property => property.name?.getText(layout).replace(/["']/g, ""))).not.toContain(forbiddenKey);
    }
  });

  it("protects private routes and every booking step with server layouts", () => {
    const steps = readdirSync("src/app/book", { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name !== "__tests__")
      .map(entry => `book/${entry.name}`);
    for (const segment of ["client", "booking", "dev", ...steps]) {
      const layout = source(`${segment}/layout.tsx`);
      expect(layout).not.toContain('"use client"');
      expect(layout).toContain("export const metadata");
      expect(layout).toContain("index: false, follow: true");
    }
    expect(readdirSync("src/app/book")).not.toContain("layout.tsx");
    for (const route of ["october-333", "october-package"]) {
      expect(source(`offers/${route}/page.tsx`)).toContain("index: false, follow: true");
    }
    expect(source("offers/october-333/success/page.tsx")).toContain("index: false");
  });
});
