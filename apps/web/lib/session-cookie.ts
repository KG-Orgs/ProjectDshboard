/** Shared app session cookie settings for web auth routes. */

export const APP_SESSION_COOKIE = 'app_session';

/** Keep signed-in for one year; backend session expiry must match. */
export const APP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function appSessionCookieOptions(overrides?: { maxAge?: number }) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: overrides?.maxAge ?? APP_SESSION_MAX_AGE_SECONDS,
  };
}
