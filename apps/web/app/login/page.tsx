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

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = firstSearchParam(searchParams?.error);
  const message = firstSearchParam(searchParams?.message);
  const errorMessage = getErrorMessage(error, message);

  return <LoginPageClient errorMessage={errorMessage} />;
}
