import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { orgId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const response = await fetch(
      `${getBackendBaseUrl()}/api/platform/organizations/${encodeURIComponent(context.params.orgId)}/users`,
      {
        method: 'GET',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('List platform org users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { orgId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const payload = await request.json();
    const response = await fetch(
      `${getBackendBaseUrl()}/api/platform/organizations/${encodeURIComponent(context.params.orgId)}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(sessionToken),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }
    );

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Add platform org user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
