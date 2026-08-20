export function getErrorMessage(error: string | null, message: string | null): string | null {
  if (message) return message;
  if (error === 'oauth_not_configured') {
    return 'Microsoft OAuth is not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in your environment.';
  }
  if (error === 'backend_unreachable') {
    return 'Backend API is waking up or unavailable. Wait a few seconds and try signing in again.';
  }
  return null;
}
