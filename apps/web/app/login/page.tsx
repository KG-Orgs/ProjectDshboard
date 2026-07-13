import LoginPageClient from './LoginPageClient';

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

export function getErrorMessage(error: string | null, message: string | null): string | null {
  if (message) return message;
  if (error === 'oauth_not_configured') {
    return 'Microsoft OAuth is not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in your environment.';
  }
  if (error === 'backend_unreachable') {
    return 'Backend API is unavailable. Start the backend service on localhost:3001 and retry.';
  }
  return null;
}

export default function LoginPage({ searchParams }: LoginPageProps = {}) {
  const error = firstSearchParam(searchParams?.error);
  const message = firstSearchParam(searchParams?.message);
  const errorMessage = getErrorMessage(error, message);

  return <LoginPageClient errorMessage={errorMessage} />;
}
