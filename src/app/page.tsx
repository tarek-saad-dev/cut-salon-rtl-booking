import { publicPageMetadata, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo";
import DecemberHomePromo from "@/components/home/DecemberHomePromo";
import {readDecemberRates} from "@/lib/december/rates";
import HomePageClient from "@/components/HomePageClient";

export const metadata = publicPageMetadata("/", SITE_TITLE, SITE_DESCRIPTION);

export default async function Home() {
  const rates=process.env.DECEMBER_EXAM_HOME_PREVIEW_ENABLED==='true'?await readDecemberRates():null;
  return <HomePageClient campaignPromo={rates?<DecemberHomePromo rates={rates} launched={process.env.DECEMBER_EXAM_PUBLIC_LAUNCH_ENABLED==='true'}/>:undefined} />;
}
