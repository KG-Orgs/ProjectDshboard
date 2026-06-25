import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const response = await fetch(
      `${getBackendBaseUrl()}/api/chat/sessions/${encodeURIComponent(params.id)}/messages`,
      {
        method: 'GET',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );
    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
