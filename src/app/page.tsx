import { publicPageMetadata, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo";
import HomePageClient from "@/components/HomePageClient";

export const metadata = publicPageMetadata("/", SITE_TITLE, SITE_DESCRIPTION);

export default function Home() {
  return <HomePageClient />;
}
