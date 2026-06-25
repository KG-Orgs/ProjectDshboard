import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../../../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string; fileId: string; markupId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const payload = await request.json();

    const response = await fetch(
      `${getBackendBaseUrl()}/api/projects/${encodeURIComponent(context.params.id)}/files/${encodeURIComponent(context.params.fileId)}/markups/${encodeURIComponent(context.params.markupId)}`,
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
    console.error('Update markup error:', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string; fileId: string; markupId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);

    const response = await fetch(
      `${getBackendBaseUrl()}/api/projects/${encodeURIComponent(context.params.id)}/files/${encodeURIComponent(context.params.fileId)}/markups/${encodeURIComponent(context.params.markupId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Delete markup error:', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
