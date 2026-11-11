import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import GleemPage, { metadata as gleemMetadata } from "@/app/branches/gleem/page";
import CampPage, { metadata as campMetadata } from "@/app/branches/camp-caesar/page";
import { branches, branchSchema, serializeBranchSchema } from "@/lib/branches";

describe("public branch landing pages", () => {
  it("renders useful distinct content, navigation, maps and safe booking entry on the server", () => {
    const pages = [renderToStaticMarkup(<GleemPage />), renderToStaticMarkup(<CampPage />)];
    expect(pages[0]).not.toEqual(pages[1]);
    Object.values(branches).forEach((branch, i) => {
      const html = pages[i];
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      for (const text of [branch.intro, branch.visit, branch.booking, branch.address]) expect(html).toContain(text);
      for (const href of [branch.map, "/book", "/prices", "tel:+201012126899", "https://wa.me/201012126899"]) expect(html).toContain(`href="${href}"`);
      expect(html).not.toContain("/book?");
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('lang="ar"');
      expect(html).toContain(`href="${Object.values(branches)[1 - i].path}"`);
      const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]);
      expect(schema).toEqual(branchSchema(branch));
      expect(Object.keys(schema).sort()).toEqual(["@context", "@type", "@id", "url", "name", "alternateName", "address", "hasMap", "parentOrganization"].sort());
      expect(schema.address).toEqual({ "@type": "PostalAddress", addressLocality: "Alexandria", addressCountry: "EG" });
      expect(schema.url).toBe(`https://cutsaloon.com${branch.path}`);
      expect(schema["@id"]).toBe(`${schema.url}#barbershop`);
    });
  });

  it("keeps new Gleem content at locality-only precision without disputed streets", () => {
    const html = renderToStaticMarkup(<GleemPage />);
    expect(branches.gleem.address).toBe("جليم – سابا باشا، الإسكندرية، مصر");
    expect(html).toContain("جليم – سابا باشا، الإسكندرية، مصر");
    const content = JSON.stringify({ branch: branches.gleem, metadata: gleemMetadata, html });
    for (const street of ["يسرى قمحة", "ممدوح عبد الرازق"]) {
      expect(content).not.toContain(street);
    }
    expect(branches.gleem.map).toBe("https://share.google/F4o7oOQVs3EJSgxaw");
  });

  it("exports route-specific indexable metadata with matching social copy", () => {
    [gleemMetadata, campMetadata].forEach((metadata, i) => {
      const branch = Object.values(branches)[i];
      expect(metadata.alternates).toEqual({ canonical: branch.path });
      expect(metadata.title).toEqual({ absolute: branch.title });
      expect(metadata.description).toBe(branch.description);
      expect(metadata.openGraph).toMatchObject({ url: branch.path, title: branch.title, description: branch.description });
      expect(metadata.twitter).toMatchObject({ title: branch.title, description: branch.description });
      expect(metadata.robots).toBeUndefined();
      expect(readFileSync(`src/app${branch.path}/page.tsx`, "utf8")).not.toContain('"use client"');
    });
    expect(gleemMetadata.title).not.toEqual(campMetadata.title);
    expect(gleemMetadata.description).not.toEqual(campMetadata.description);
  });

  it("escapes script injection while preserving valid JSON", () => {
    const value = { name: "</script><script>alert(1)</script>" };
    const serialized = serializeBranchSchema(value);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(value);
  });

  it("adds both crawlable localized footer links without replacing map or campaign links", () => {
    const footer = readFileSync("src/components/FooterSection.tsx", "utf8");
    expect(footer).toContain('href="/branches/gleem"');
    expect(footer).toContain('href="/branches/camp-caesar"');
    expect(footer).toContain("tx(t.branchName, lang)");
    expect(footer).toContain("tx(t.campBranchName, lang)");
    expect(footer).toContain("href={campBookHref}");
    expect(footer).toContain("href={campMapUrl}");
    expect(footer).toContain(branches.gleem.map);
  });
});
