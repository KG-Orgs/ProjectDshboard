import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  toProxyJsonResponse,
} from '../../../../../_lib/proxy';

export const dynamic = 'force-dynamic';

function buildQuery(request: NextRequest): string {
  const params = new URLSearchParams();
  const page = request.nextUrl.searchParams.get('page');
  if (page) {
    params.set('page', page);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string; fileId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const query = buildQuery(request);

    const response = await fetch(
      `${getBackendBaseUrl()}/api/projects/${encodeURIComponent(context.params.id)}/files/${encodeURIComponent(context.params.fileId)}/markups${query}`,
      {
        method: 'GET',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );

    return toProxyJsonResponse(response);
  } catch (error) {
    console.error('Get markups error:', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string; fileId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const payload = await request.json();

    const response = await fetch(
      `${getBackendBaseUrl()}/api/projects/${encodeURIComponent(context.params.id)}/files/${encodeURIComponent(context.params.fileId)}/markups`,
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
    console.error('Create markup error:', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
