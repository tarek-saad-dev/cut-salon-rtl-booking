/**
 * CUT CLUB 2.0 preview access must stay development-only.
 * NODE_ENV=production always denies even if an env flag is accidentally set.
 * Does NOT authorize /club, a member session or any data API.
 */
export type PreviewEnvironment = Readonly<{
  NODE_ENV?: string;
  CUT_CLUB_PREVIEW_ENABLED?: string;
}>;

export function canRenderCutClubPreview(env: PreviewEnvironment): boolean {
  return env.NODE_ENV === "development" &&
    env.CUT_CLUB_PREVIEW_ENABLED === "true";
}
