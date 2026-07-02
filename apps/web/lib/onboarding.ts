export const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

export function resetOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

export function shouldAutoShowOnboarding(): boolean {
  return !isOnboardingCompleted();
}
