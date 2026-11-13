import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/seo";

// Only existing public search landing pages; no inferred URLs or modification dates.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/prices", "/services", "/services/haircut", "/services/beard", "/book", "/offers/november-protein"].map((path) => ({
    url: new URL(path, CANONICAL_ORIGIN).href,
  }));
}
