export const USER_JOB_ROLE_STORAGE_KEY = 'contractor-ai-user-role';

export const USER_JOB_ROLE_OPTIONS = [
  'Project Manager',
  'Project Engineer',
  'Superintendent',
  'Field Engineer',
  'Scheduler',
  'Cost Engineer',
  'QC Manager',
  'Safety Manager',
  'Document Control',
] as const;

export function normalizeUserJobRole(role: string | null | undefined): string {
  const trimmed = role?.trim();
  return trimmed || 'Team Member';
}

export function persistUserJobRole(role: string): string {
  const value = normalizeUserJobRole(role);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USER_JOB_ROLE_STORAGE_KEY, value);
  }
  return value;
}

export function readStoredUserJobRole(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(USER_JOB_ROLE_STORAGE_KEY) ?? '';
}
