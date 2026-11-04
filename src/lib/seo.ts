import type { Metadata } from "next";

export const CANONICAL_ORIGIN = "https://cutsaloon.com";
export const SITE_TITLE = "CUT Salon | صالون حلاقة رجالي في الإسكندرية";
export const SITE_DESCRIPTION =
  "اكتشف خدمات قص الشعر والعناية باللحية في CUT Salon بالإسكندرية. تعرّف على الأسعار واختر الفرع والحلاق واحجز موعدك أونلاين.";

/** Explicit per-page social metadata avoids inherited homepage URLs and copy. */
export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title, description, url: path, siteName: "CUT Salon",
      locale: "ar_EG", type: "website",
      images: [{ url: "/logo.jpeg", alt: "CUT Salon" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/logo.jpeg"] },
  };
}
