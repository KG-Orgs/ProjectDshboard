import { NextRequest } from 'next/server';

const BIND_HOSTS = new Set(['0.0.0.0', '::', '[::]']);

function isBindHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? host;
  return BIND_HOSTS.has(hostname);
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function originFromForwardedHeaders(request: NextRequest): string | undefined {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (!forwardedHost) {
    return undefined;
  }

  const host = forwardedHost.split(',')[0]?.trim();
  if (!host || isBindHost(host)) {
    return undefined;
  }

  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'https';
  return `${proto}://${host}`;
}

function originFromHostHeader(request: NextRequest): string | undefined {
  const host = request.headers.get('host');
  if (!host || isBindHost(host)) {
    return undefined;
  }

  const proto = request.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

export function getPublicOrigin(request: NextRequest): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.WEB_ORIGIN ??
    process.env.RENDER_EXTERNAL_URL;
  if (fromEnv) {
    return normalizeOrigin(fromEnv);
  }

  const fromForwarded = originFromForwardedHeaders(request);
  if (fromForwarded) {
    return fromForwarded;
  }

  const fromHost = originFromHostHeader(request);
  if (fromHost) {
    return fromHost;
  }

  const origin = request.nextUrl.origin;
  if (!isBindHost(new URL(origin).hostname)) {
    return origin;
  }

  return 'http://localhost:3000';
}

export function publicUrl(request: NextRequest, pathname: string): URL {
  return new URL(pathname, getPublicOrigin(request));
}
