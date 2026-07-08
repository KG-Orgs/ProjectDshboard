import type { UserRole } from "../types/entities";

/** Org-level operator: can create projects and designate admins. */
export function isOrgPowerUser(role: UserRole | undefined): boolean {
  return role === "super" || role === "admin";
}
