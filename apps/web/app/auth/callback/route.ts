import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendWithColdStartRetries, getBackendBaseUrl } from '../../../lib/backend-fetch';
import { getPublicOrigin, publicUrl } from '../../../lib/request-origin';
import { APP_SESSION_COOKIE, appSessionCookieOptions } from '../../../lib/session-cookie';

export const dynamic = 'force-dynamic';

function buildLoginErrorRedirect(request: NextRequest, error: string, message: string): URL {
  const url = publicUrl(request, '/login');
  url.searchParams.set('error', error);
  url.searchParams.set('message', message);
  return url;
}

export async function GET(request: NextRequest) {
  const authError = request.nextUrl.searchParams.get('error');
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state') ?? undefined;

  if (authError) {
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        'auth_callback_failed',
        'Microsoft sign-in was cancelled or failed. Try again.'
      ),
      302
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        'missing_auth_code',
        'Open /login and start the Microsoft sign-in flow from there.'
      ),
      302
    );
  }

  const redirectUri = `${getPublicOrigin(request)}/auth/callback`;

  try {
    // Same cold-start retries as login start — callback is when the API is most often asleep.
    const response = await fetchBackendWithColdStartRetries(`${getBackendBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        redirectUri,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      return NextResponse.redirect(
        buildLoginErrorRedirect(
          request,
          data.error ?? 'oauth_exchange_failed',
          data.message ?? 'Microsoft sign-in could not be completed. Start sign-in again.'
        ),
        302
      );
    }

    const data = (await response.json()) as { accessToken?: string };
    if (!data.accessToken) {
      return NextResponse.redirect(
        buildLoginErrorRedirect(
          request,
          'missing_session_token',
          'Sign-in succeeded but no app session was returned. Retry from /login.'
        ),
        302
      );
    }

    const nextResponse = NextResponse.redirect(publicUrl(request, '/'), 302);
    nextResponse.cookies.set(APP_SESSION_COOKIE, data.accessToken, appSessionCookieOptions());

    return nextResponse;
  } catch (error) {
    console.error('Auth callback exchange error:', error);
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        'backend_unreachable',
        'Backend API is waking up. Wait about 30 seconds and try signing in again.'
      ),
      302
    );
  }
}
