import { createHash, randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { UserRole, UUID } from "@contractor/shared";
import { isPlatformOperatorEmail } from "@contractor/shared";
import { getEnv } from "../config/env";
import { getDbIfInitialized, organizations, users } from "../db";
import { AppError } from "../lib/errors";
import { toUuid } from "./service-types";

function toDeterministicUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  const base = hash.slice(0, 32).split("");
  base[12] = "4";
  const variantNibble = Number.parseInt(base[16], 16);
  base[16] = ((variantNibble & 0x3) | 0x8).toString(16);
  const compact = base.join("");

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20, 32),
  ].join("-");
}

export function getPlatformOperatorEmails(): string[] {
  return getEnv().platformOperatorEmails;
}

export function isInviteOnlyAuthEnabled(): boolean {
  return getPlatformOperatorEmails().length > 0;
}

export function isPlatformOperator(email: string | undefined): boolean {
  return isPlatformOperatorEmail(email, getPlatformOperatorEmails());
}

export function assertPlatformOperator(email: string | undefined): void {
  if (!isPlatformOperator(email)) {
    throw new AppError(
      403,
      "forbidden",
      "Only platform operators can perform this action."
    );
  }
}

export const platformAdminService = {
  async listOrganizations() {
    const db = getDbIfInitialized();
    if (!db) {
      return { organizations: [] };
    }

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        onedriveTenantId: organizations.onedriveTenantId,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    return {
      organizations: rows.map((row) => ({
        id: toUuid(row.id),
        name: row.name,
        onedriveTenantId: row.onedriveTenantId ?? undefined,
        createdAt: row.createdAt,
      })),
    };
  },

  async createOrganization(name: string, onedriveTenantId?: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new AppError(400, "invalid_name", "Organization name is required");
    }

    const db = getDbIfInitialized();
    if (!db) {
      throw new AppError(503, "database_unavailable", "Database is not configured");
    }

    const orgId = toUuid(randomUUID());
    const [created] = await db
      .insert(organizations)
      .values({
        id: orgId,
        name: trimmedName,
        onedriveTenantId: onedriveTenantId?.trim() || null,
        createdAt: new Date(),
      })
      .returning();

    return {
      organization: {
        id: toUuid(created.id),
        name: created.name,
        onedriveTenantId: created.onedriveTenantId ?? undefined,
        createdAt: created.createdAt,
      },
    };
  },

  async listOrganizationUsers(orgId: UUID) {
    const db = getDbIfInitialized();
    if (!db) {
      return { users: [] };
    }

    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      throw new AppError(404, "org_not_found", "Organization not found");
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, orgId))
      .orderBy(users.createdAt);

    return {
      users: rows.map((row) => ({
        id: toUuid(row.id),
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        createdAt: row.createdAt,
      })),
    };
  },

  async addUserToOrganization(
    orgId: UUID,
    email: string,
    options?: { name?: string; role?: UserRole }
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError(400, "invalid_email", "Email is required");
    }

    const role = options?.role ?? "member";
    if (!["super", "admin", "pm", "member"].includes(role)) {
      throw new AppError(400, "invalid_role", "Invalid user role");
    }

    const db = getDbIfInitialized();
    if (!db) {
      throw new AppError(503, "database_unavailable", "Database is not configured");
    }

    const [org] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      throw new AppError(404, "org_not_found", "Organization not found");
    }

    const displayName = options?.name?.trim() || normalizedEmail.split("@")[0] || normalizedEmail;

    const [existing] = await db
      .select({
        id: users.id,
        orgId: users.orgId,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      if (existing.orgId !== orgId) {
        await db
          .update(users)
          .set({ orgId, role })
          .where(eq(users.id, existing.id));
      } else if (existing.role !== role) {
        await db.update(users).set({ role }).where(eq(users.id, existing.id));
      }

      return {
        user: {
          id: toUuid(existing.id),
          email: existing.email,
          name: existing.name,
          role,
          orgId,
          createdAt: existing.createdAt,
        },
        organization: {
          id: toUuid(org.id),
          name: org.name,
        },
      };
    }

    const [inserted] = await db
      .insert(users)
      .values({
        id: toUuid(toDeterministicUuid(`invite:${normalizedEmail}`)),
        orgId,
        email: normalizedEmail,
        name: displayName,
        role,
        createdAt: new Date(),
      })
      .returning();

    return {
      user: {
        id: toUuid(inserted.id),
        email: inserted.email,
        name: inserted.name,
        role: inserted.role as UserRole,
        orgId: toUuid(inserted.orgId),
        createdAt: inserted.createdAt,
      },
      organization: {
        id: toUuid(org.id),
        name: org.name,
      },
    };
  },
};
