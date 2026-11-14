"use client";

import { usePathname } from "next/navigation";
import { isClubPath } from "@/lib/club/registry";
import MainNav from "./MainNav";
import GlobalMobileNav from "./GlobalMobileNav";
import CampCaesarCampaign from "./campaign/CampCaesarCampaign";

export default function SiteChrome() {
  const pathname = usePathname();
  if (isClubPath(pathname)) return null;
  if (pathname === "/offers" || pathname?.startsWith("/offers/")) return null;
  return <><CampCaesarCampaign /><GlobalMobileNav /><MainNav /></>;
}
