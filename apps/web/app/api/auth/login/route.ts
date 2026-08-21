import { NextRequest, NextResponse } from 'next/server';
import { publicUrl } from '../../../../lib/request-origin';

const APP_SESSION_COOKIE = 'app_session';
export const dynamic = 'force-dynamic';

/** Render free-tier API wake can exceed 20s; keep this above observed cold-start times. */
const BACKEND_FETCH_TIMEOUT_MS = 60_000;
const COLD_START_RETRY_DELAY_MS = 2_000;
const COLD_START_MAX_ATTEMPTS = 4;

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

function isSuccessfulAuthRedirect(response: Response): boolean {
  const location = response.headers.get('location');
  return response.status >= 300 && response.status < 400 && Boolean(location);
}

async function shouldRetryAuthStart(response: Response): Promise<boolean> {
  if (isSuccessfulAuthRedirect(response)) {
    return false;
  }

  if ([502, 504, 520, 522, 524].includes(response.status)) {
    return true;
  }

  // 503 may be OAuth misconfig (JSON) or a cold-start shell (HTML).
  if (response.status === 503 || response.status === 200) {
    const data = (await response
      .clone()
      .json()
      .catch(() => undefined)) as { error?: string } | undefined;
    if (data?.error) {
      return false;
    }
    return true;
  }

  return false;
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
        if (!(await shouldRetryAuthStart(response))) {
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
          'Backend API is waking up. Wait about 30 seconds and try signing in again.'
        ),
        302
      );
    }

    if (isSuccessfulAuthRedirect(response)) {
      return NextResponse.redirect(response.headers.get('location')!, 302);
    }

    const data = (await response.json().catch(() => undefined)) as
      | { error?: string; message?: string }
      | undefined;

    if (data?.error) {
      return NextResponse.redirect(
        buildLoginErrorRedirect(
          request,
          data.error,
          data.message ?? 'Unable to start Microsoft sign-in. Please try again.'
        ),
        302
      );
    }

    return NextResponse.redirect(
      buildLoginErrorRedirect(
        request,
        'backend_unreachable',
        'Backend API is waking up. Wait about 30 seconds and try signing in again.'
      ),
      302
    );
  } catch (error) {
    console.error('Login start proxy error:', error);
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
