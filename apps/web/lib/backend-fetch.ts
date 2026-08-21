/**
 * Backend fetch helpers tuned for Render free-tier cold starts.
 * Login start already retries; OAuth callback and /auth/me need the same.
 */

export const BACKEND_FETCH_TIMEOUT_MS = 60_000;
export const COLD_START_RETRY_DELAY_MS = 2_000;
export const COLD_START_MAX_ATTEMPTS = 4;

export function getBackendBaseUrl(): string {
  return process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isBackendTransientFailure(status: number): boolean {
  // Do not include 503 here — Express may return 503 JSON for misconfiguration.
  return [502, 504, 520, 522, 524].includes(status);
}

export async function shouldRetryBackendResponse(response: Response): Promise<boolean> {
  if (isBackendTransientFailure(response.status)) {
    return true;
  }

  if (response.status === 503) {
    const data = (await response
      .clone()
      .json()
      .catch(() => undefined)) as { error?: string } | undefined;
    // Retry cold-start shells; keep structured API errors final.
    return !data?.error;
  }

  return false;
}

export async function fetchBackendWithColdStartRetries(
  input: string,
  init: RequestInit = {},
  options?: {
    maxAttempts?: number;
    timeoutMs?: number;
    shouldRetry?: (response: Response) => boolean | Promise<boolean>;
  }
): Promise<Response> {
  const maxAttempts = options?.maxAttempts ?? COLD_START_MAX_ATTEMPTS;
  const timeoutMs = options?.timeoutMs ?? BACKEND_FETCH_TIMEOUT_MS;
  const shouldRetry =
    options?.shouldRetry ?? ((response: Response) => shouldRetryBackendResponse(response));

  let lastError: unknown;
  let response: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const userSignal = init.signal;
    const onAbort = () => controller.abort();
    userSignal?.addEventListener('abort', onAbort);

    try {
      response = await fetch(input, {
        ...init,
        signal: controller.signal,
        cache: init.cache ?? 'no-store',
      });
      if (!(await shouldRetry(response))) {
        return response;
      }
    } catch (error) {
      lastError = error;
      response = null;
      if (userSignal?.aborted) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
      userSignal?.removeEventListener('abort', onAbort);
    }

    if (attempt < maxAttempts) {
      await sleep(COLD_START_RETRY_DELAY_MS * attempt);
    }
  }

  if (response) {
    return response;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Backend API is unavailable after cold-start retries.');
}
