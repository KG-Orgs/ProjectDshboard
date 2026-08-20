import { NextRequest, NextResponse } from 'next/server';
import { publicUrl } from '../../../../lib/request-origin';

const APP_SESSION_COOKIE = 'app_session';
export const dynamic = 'force-dynamic';

const BACKEND_FETCH_TIMEOUT_MS = 20_000;
const COLD_START_RETRY_DELAY_MS = 1_500;
const COLD_START_MAX_ATTEMPTS = 3;

function getBackendBaseUrl(): string {
  return process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

function buildLoginErrorRedirect(request: NextRequest, error: string, message: string): URL {
  const url = publicUrl(request, '/login');
  url.searchParams.set('error', error);
  url.searchParams.set('message', message);
  return url;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAuthStartFailure(status: number): boolean {
  // Render cold starts usually surface as gateway timeouts, not app-level 503 OAuth errors.
  return status === 502 || status === 504 || status === 0;
}

async function fetchAuthLoginStart(query: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_FETCH_TIMEOUT_MS);

  try {
    return await fetch(`${getBackendBaseUrl()}/api/auth/login${query}`, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get('redirectUri');
  const prompt = request.nextUrl.searchParams.get('prompt');
  const params = new URLSearchParams();
  if (redirectUri) {
    params.set('redirectUri', redirectUri);
  }
  if (prompt) {
    params.set('prompt', prompt);
  }
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    let response: Response | null = null;
    let lastError: unknown;

    for (let attempt = 1; attempt <= COLD_START_MAX_ATTEMPTS; attempt += 1) {
      try {
        response = await fetchAuthLoginStart(query);
        if (!isRetryableAuthStartFailure(response.status)) {
          break;
        }
      } catch (error) {
        lastError = error;
        response = null;
      }

      if (attempt < COLD_START_MAX_ATTEMPTS) {
        await sleep(COLD_START_RETRY_DELAY_MS * attempt);
      }
    }

    if (!response) {
      console.error('Login start proxy error after retries:', lastError);
      return NextResponse.redirect(
        buildLoginErrorRedirect(
          request,
          'backend_unreachable',
          'Backend API is waking up or unavailable. Wait a few seconds and try signing in again.'
        ),
        302
      );
    }

    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      return NextResponse.redirect(location, 302);
    }

    const data = (await response.json().catch(() => undefined)) as
      | { error?: string; message?: string }
      | undefined;

    const error = data?.error ?? (isRetryableAuthStartFailure(response.status) ? 'backend_unreachable' : 'auth_start_failed');
    const message =
      data?.message ??
      (isRetryableAuthStartFailure(response.status)
        ? 'Backend API is waking up or unavailable. Wait a few seconds and try signing in again.'
        : 'Unable to start Microsoft sign-in. Please try again.');
    return NextResponse.redirect(buildLoginErrorRedirect(request, error, message), 302);
  } catch (error) {
    console.error('Login start proxy error:', error);
    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        'backend_unreachable',
        'Backend API is waking up or unavailable. Wait a few seconds and try signing in again.'
      ),
      302
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(
      response.ok ? { user: data.user } : data,
      { status: response.status }
    );

    if (response.ok && data.accessToken) {
      nextResponse.cookies.set(APP_SESSION_COOKIE, data.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Login exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
