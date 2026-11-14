/** Shell visibility is never authentication or authorization. Server use only. */
export function getClubGate(): 'disabled' | 'authentication-unavailable' {
  return process.env.CUT_CLUB_SHELL_ENABLED === 'true'
    ? 'authentication-unavailable'
    : 'disabled';
}

export type ClubModuleId = 'dashboard' | 'upcoming-booking' | 'reward-notice' | 'challenge-progress' | 'memberships';
export type ClubModuleState = 'loading' | 'empty' | 'unavailable';
export interface ClubModuleDefinition {
  readonly id: ClubModuleId;
  readonly title: string;
}
export const clubModules = [
  { id: 'dashboard', title: 'نظرة عامة' },
  { id: 'upcoming-booking', title: 'الحجز القادم' },
  { id: 'reward-notice', title: 'المكافآت' },
  { id: 'challenge-progress', title: 'التحديات' },
  { id: 'memberships', title: 'العضويات' },
] as const satisfies readonly ClubModuleDefinition[];
