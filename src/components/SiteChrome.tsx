"use client";

import { usePathname } from "next/navigation";
import MainNav from "./MainNav";
import GlobalMobileNav from "./GlobalMobileNav";
import CampCaesarCampaign from "./campaign/CampCaesarCampaign";

export default function SiteChrome() {
  const pathname = usePathname();
  if (pathname === "/offers" || pathname?.startsWith("/offers/")) return null;
  return <><CampCaesarCampaign /><GlobalMobileNav /><MainNav /></>;
}
