import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, existsSync, statSync } from "node:fs";
import HeroPicture from "../HeroPicture";

describe("homepage performance contracts", () => {
  it("art directs one eager high-priority image at the existing breakpoint", () => {
    const html = renderToStaticMarkup(<HeroPicture />);
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).toContain('media="(min-width: 768px)"');
    expect(html).toContain('media="(max-width: 767px)"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('/hero_vertical.png');
    for (const url of html.match(/\/hero[^\s",]+\.webp/g) ?? []) {
      expect(existsSync(`public${url}`)).toBe(true);
      expect(statSync(`public${url}`).size).toBeLessThan(400_000);
    }
  });
  it("retains server rendered sections, booking links and stable hero space", () => {
    const home = readFileSync('src/components/HomePageClient.tsx', 'utf8');
    expect(home).toContain('<ArabicServicesSection />');
    expect(home).toContain('<BarbersSection />');
    expect(home).not.toContain('ssr: false');
    const hero = readFileSync('src/components/HeroSection.tsx', 'utf8');
    expect(hero).toContain('min-h-[100svh]');
    expect(hero).toContain('min-h-[102px]');
    expect(hero.match(/href="\/book"/g)).toHaveLength(2);
    const css = readFileSync('src/app/globals.css', 'utf8');
    expect(css).not.toContain('fonts.googleapis.com');
    expect(css).not.toContain('url("/fonts/LAXR.otf")');
  });
});
