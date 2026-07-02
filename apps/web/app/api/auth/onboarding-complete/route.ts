import { NextRequest, NextResponse } from 'next/server';

const APP_SESSION_COOKIE = 'app_session';
export const dynamic = 'force-dynamic';

function getBackendBaseUrl(): string {
  return process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(APP_SESSION_COOKIE)?.value;
    const body = await request.json().catch(() => ({}));
    const response = await fetch(`${getBackendBaseUrl()}/api/auth/onboarding-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
