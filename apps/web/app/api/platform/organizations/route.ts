import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request);
    const response = await fetch(`${getBackendBaseUrl()}/api/platform/organizations`, {
      method: 'GET',
      headers: getAuthHeaders(sessionToken),
      cache: 'no-store',
    });

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('List platform organizations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request);
    const payload = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/api/platform/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(sessionToken),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Create platform organization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
