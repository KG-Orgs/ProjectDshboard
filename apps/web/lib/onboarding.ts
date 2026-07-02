import type { User } from '@contractor/shared';

export async function completeOnboarding(jobRole?: string): Promise<User> {
  const normalizedRole = jobRole?.trim() || undefined;
  const response = await fetch('/api/auth/onboarding-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedRole ? { jobRole: normalizedRole } : {}),
  });

  if (!response.ok) {
    throw new Error('Unable to save onboarding status. Please try again.');
  }

  const data = (await response.json()) as { user: User };
  if (!data.user) {
    throw new Error('Unable to save onboarding status. Please try again.');
  }

  return data.user;
}

export function shouldAutoShowOnboarding(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return !user.onboardingCompleted;
}
