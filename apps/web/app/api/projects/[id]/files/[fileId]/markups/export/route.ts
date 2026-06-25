import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthHeaders,
  getBackendBaseUrl,
  getSessionToken,
  parseJsonSafe,
} from '../../../../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { id: string; fileId: string } }
) {
  try {
    const sessionToken = getSessionToken(request);
    const format = request.nextUrl.searchParams.get('format') ?? 'csv';

    const response = await fetch(
      `${getBackendBaseUrl()}/api/projects/${encodeURIComponent(context.params.id)}/files/${encodeURIComponent(context.params.fileId)}/markups/export?format=${encodeURIComponent(format)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(sessionToken),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const payload = (await parseJsonSafe(response)) as { error?: string; message?: string } | undefined;
      return NextResponse.json(
        {
          error: payload?.error ?? 'export_failed',
          message: payload?.message ?? 'Failed to export markups',
        },
        { status: response.status }
      );
    }

    const data = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') ?? 'application/octet-stream');
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      headers.set('Content-Disposition', disposition);
    }

    return new NextResponse(data, { status: 200, headers });
  } catch (error) {
    console.error('Export markups error:', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
