/** Platform operators can provision orgs and users (invite-only deployments). */
export function parsePlatformOperatorEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformOperatorEmail(
  email: string | undefined,
  operatorEmails: readonly string[]
): boolean {
  if (!email || operatorEmails.length === 0) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return operatorEmails.some((candidate) => candidate === normalized);
}

export function isInviteOnlyAuth(operatorEmails: readonly string[]): boolean {
  return operatorEmails.length > 0;
}
