import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string; userId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const response = await fetch(
      `${getBackendBaseUrl()}/api/projects/${encodeURIComponent(context.params.id)}/members/${encodeURIComponent(context.params.userId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Remove project member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
