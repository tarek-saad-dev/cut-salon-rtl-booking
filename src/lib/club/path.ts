/** Pure routing helper safe for navigation/client use. Not an auth guard. */
export function isClubPath(pathname: string | null): boolean {
  return pathname === "/club" || Boolean(pathname?.startsWith("/club/"));
}
