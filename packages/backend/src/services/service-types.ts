import type { UUID } from "@contractor/shared";

export interface RequestUserContext {
  id: string;
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  role: "super" | "admin" | "pm" | "member";
  jobRole?: string;
  onboardingCompleted: boolean;
}

export function toUuid(value: string): UUID {
  return value as UUID;
}
