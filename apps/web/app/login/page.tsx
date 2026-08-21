import LoginPageClient from './LoginPageClient';
import { getErrorMessage } from './getErrorMessage';

type LoginSearchParams = {
  error?: string | string[];
  message?: string | string[];
};

type LoginPageProps = {
  searchParams?: LoginSearchParams;
};

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    return value || null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return null;
}

function resolveAppOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.WEB_ORIGIN ??
    process.env.RENDER_EXTERNAL_URL;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = firstSearchParam(searchParams?.error);
  const message = firstSearchParam(searchParams?.message);
  const errorMessage = getErrorMessage(error, message);
  const redirectUri = `${resolveAppOrigin()}/auth/callback`;

  return <LoginPageClient errorMessage={errorMessage} redirectUri={redirectUri} />;
}
