import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendWithColdStartRetries, getBackendBaseUrl } from '../../../../lib/backend-fetch';
import { APP_SESSION_COOKIE } from '../../../../lib/session-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(APP_SESSION_COOKIE)?.value;
    const response = await fetchBackendWithColdStartRetries(`${getBackendBaseUrl()}/api/auth/me`, {
      method: 'GET',
      headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get auth me error:', error);
    return NextResponse.json(
      {
        error: 'backend_unreachable',
        message: 'Backend API is waking up. Wait a moment and refresh.',
      },
      { status: 503 }
    );
  }
}
