import { redirect } from "next/navigation";

/**
 * CUT CLUB public launch compatibility:
 * Never render the legacy phone/clientId-driven wallet, store or inventory.
 * Redirect old bookmarks to the public, non-personal CUT CLUB landing.
 * The incoming ?clientId / other query parameters are deliberately discarded.
 */
export default function LegacyCutClubRedirect() {
  redirect("/cut-club");
}
