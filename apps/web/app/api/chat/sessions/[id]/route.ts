import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const payload = await request.json();
    const response = await fetch(
      `${getBackendBaseUrl()}/api/chat/sessions/${encodeURIComponent(params.id)}`,
      {
        method: 'PATCH',
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
    console.error('Update chat session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const response = await fetch(
      `${getBackendBaseUrl()}/api/chat/sessions/${encodeURIComponent(params.id)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Delete chat session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
