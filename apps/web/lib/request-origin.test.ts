import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getPublicOrigin, publicUrl } from './request-origin';

describe('getPublicOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC_APP_URL over bind address request URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://contractorai-web.onrender.com');

    const request = new NextRequest('https://0.0.0.0:10000/login');
    expect(getPublicOrigin(request)).toBe('https://contractorai-web.onrender.com');
  });

  it('uses x-forwarded headers when env vars are absent', () => {
    const request = new NextRequest('https://0.0.0.0:10000/login', {
      headers: {
        'x-forwarded-host': 'contractorai-web.onrender.com',
        'x-forwarded-proto': 'https',
      },
    });

    expect(getPublicOrigin(request)).toBe('https://contractorai-web.onrender.com');
  });

  it('uses host header when it is not a bind address', () => {
    const request = new NextRequest('https://0.0.0.0:10000/login', {
      headers: {
        host: 'contractorai-web.onrender.com',
      },
    });

    expect(getPublicOrigin(request)).toBe('https://contractorai-web.onrender.com');
  });

  it('falls back to request origin for local development', () => {
    const request = new NextRequest('http://localhost:3000/login');
    expect(getPublicOrigin(request)).toBe('http://localhost:3000');
  });

  it('builds redirect URLs with the public origin', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://contractorai-web.onrender.com');

    const request = new NextRequest('https://0.0.0.0:10000/api/auth/login');
    const url = publicUrl(request, '/login');
    url.searchParams.set('error', 'oauth_not_configured');

    expect(url.toString()).toBe(
      'https://contractorai-web.onrender.com/login?error=oauth_not_configured'
    );
  });
});
