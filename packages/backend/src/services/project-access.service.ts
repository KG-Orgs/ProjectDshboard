import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type {
  AddProjectMemberResponse,
  ProjectMemberRole,
  ProjectMembersResponse,
  UserRole,
  UUID,
} from "@contractor/shared";
import { isOrgPowerUser, isPlatformOperatorEmail } from "@contractor/shared";
import { getPlatformOperatorEmails } from "./platform-admin.service";
import { getDbIfInitialized, projectMembers, projects, users } from "../db";
import { AppError } from "../lib/errors";
import { toUuid } from "./service-types";

export type ProjectAccessContext = {
  userId: UUID;
  orgId: UUID;
  orgRole: UserRole;
  userEmail?: string;
};

export function isOrgWideProjectAdmin(orgRole: UserRole): boolean {
  return orgRole === "super" || orgRole === "admin";
}

function toMemberResponse(row: {
  userId: string;
  email: string;
  name: string;
  orgRole: UserRole;
  projectRole: ProjectMemberRole;
  createdAt: Date;
}): AddProjectMemberResponse["member"] {
  return {
    userId: toUuid(row.userId),
    email: row.email,
    name: row.name,
    orgRole: row.orgRole,
    projectRole: row.projectRole,
    createdAt: row.createdAt,
  };
}

export const projectAccessService = {
  async getMembership(projectId: UUID, userId: UUID): Promise<ProjectMemberRole | null> {
    const db = getDbIfInitialized();
    if (!db) {
      return "admin";
    }

    const [row] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))
      )
      .limit(1);

    return (row?.role as ProjectMemberRole | undefined) ?? null;
  },

  async assertCanAccessProject(
    projectId: UUID,
    access: ProjectAccessContext
  ): Promise<ProjectMemberRole> {
    const db = getDbIfInitialized();
    if (!db) {
      return "admin";
    }

    const [project] = await db
      .select({ orgId: projects.orgId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found");
    }

    if (project.orgId !== access.orgId) {
      throw new AppError(403, "forbidden", "Project does not belong to your organization");
    }

    if (isOrgWideProjectAdmin(access.orgRole)) {
      const existing = await this.getMembership(projectId, access.userId);
      return existing ?? "admin";
    }

    const membership = await this.getMembership(projectId, access.userId);
    if (!membership) {
      throw new AppError(
        403,
        "project_access_denied",
        "You do not have access to this project. Ask a project admin to add you."
      );
    }

    return membership;
  },

  async assertCanManageMembers(projectId: UUID, access: ProjectAccessContext): Promise<void> {
    if (isOrgWideProjectAdmin(access.orgRole)) {
      await this.assertCanAccessProject(projectId, access);
      return;
    }

    const membership = await this.assertCanAccessProject(projectId, access);
    if (membership !== "admin") {
      throw new AppError(
        403,
        "forbidden",
        "Only project admins can manage teammates on this project."
      );
    }
  },

  async addCreatorAsAdmin(projectId: UUID, userId: UUID): Promise<void> {
    const db = getDbIfInitialized();
    if (!db) {
      return;
    }

    await db
      .insert(projectMembers)
      .values({
        id: toUuid(randomUUID()),
        projectId,
        userId,
        role: "admin",
        invitedBy: userId,
        createdAt: new Date(),
      })
      .onConflictDoNothing({
        target: [projectMembers.projectId, projectMembers.userId],
      });
  },

  async listMembers(
    projectId: UUID,
    access: ProjectAccessContext
  ): Promise<ProjectMembersResponse> {
    await this.assertCanAccessProject(projectId, access);
    const db = getDbIfInitialized();
    if (!db) {
      return {
        projectId,
        members: [],
        canManageMembers: true,
      };
    }

    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        orgRole: users.role,
        projectRole: projectMembers.role,
        createdAt: projectMembers.createdAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(projectMembers.createdAt);

    const currentUserProjectRole = await this.getMembership(projectId, access.userId);
    const canManageMembers =
      isOrgWideProjectAdmin(access.orgRole) || currentUserProjectRole === "admin";

    return {
      projectId,
      members: rows.map((row) =>
        toMemberResponse({
          userId: row.userId,
          email: row.email,
          name: row.name,
          orgRole: row.orgRole as UserRole,
          projectRole: row.projectRole as ProjectMemberRole,
          createdAt: row.createdAt,
        })
      ),
      currentUserProjectRole: currentUserProjectRole ?? undefined,
      canManageMembers,
      canPromoteOrgAdmin: isPlatformOperatorEmail(
        access.userEmail,
        getPlatformOperatorEmails()
      ),
    };
  },

  async addMember(
    projectId: UUID,
    email: string,
    projectRole: ProjectMemberRole,
    access: ProjectAccessContext,
    options?: { promoteToOrgAdmin?: boolean }
  ): Promise<AddProjectMemberResponse> {
    await this.assertCanManageMembers(projectId, access);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AppError(400, "invalid_email", "Email is required");
    }

    const db = getDbIfInitialized();
    if (!db) {
      throw new AppError(503, "database_unavailable", "Database is not configured");
    }

    const [project] = await db
      .select({ orgId: projects.orgId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found");
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        orgId: users.orgId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw new AppError(
        404,
        "user_not_found",
        `${normalizedEmail} has not signed in yet. They must log in once with Microsoft, then you can add them.`
      );
    }

    if (user.orgId !== project.orgId) {
      throw new AppError(
        400,
        "user_wrong_org",
        "That user belongs to a different organization. Move them to this org first, or use grant:org-access."
      );
    }

    if (options?.promoteToOrgAdmin) {
      if (!isPlatformOperatorEmail(access.userEmail, getPlatformOperatorEmails())) {
        throw new AppError(
          403,
          "forbidden",
          "Only platform operators can grant org admin access."
        );
      }
      if (user.role !== "admin" && user.role !== "super") {
        await db
          .update(users)
          .set({ role: "admin" })
          .where(eq(users.id, user.id));
        user.role = "admin";
      }
    }

    const [existing] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id))
      )
      .limit(1);

    if (existing) {
      throw new AppError(409, "member_exists", "That user already has access to this project");
    }

    const [inserted] = await db
      .insert(projectMembers)
      .values({
        id: toUuid(randomUUID()),
        projectId,
        userId: toUuid(user.id),
        role: projectRole,
        invitedBy: access.userId,
        createdAt: new Date(),
      })
      .returning({
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
      });

    return {
      member: toMemberResponse({
        userId: user.id,
        email: user.email,
        name: user.name,
        orgRole: user.role as UserRole,
        projectRole: (inserted?.role ?? projectRole) as ProjectMemberRole,
        createdAt: inserted?.createdAt ?? new Date(),
      }),
    };
  },

  async removeMember(
    projectId: UUID,
    memberUserId: UUID,
    access: ProjectAccessContext
  ): Promise<void> {
    await this.assertCanManageMembers(projectId, access);

    if (memberUserId === access.userId) {
      throw new AppError(400, "cannot_remove_self", "You cannot remove yourself from the project");
    }

    const db = getDbIfInitialized();
    if (!db) {
      return;
    }

    const adminCount = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, "admin"))
      );

    const targetRole = await this.getMembership(projectId, memberUserId);
    if (targetRole === "admin" && adminCount.length <= 1) {
      throw new AppError(
        400,
        "last_admin",
        "Cannot remove the last project admin. Promote another admin first."
      );
    }

    await db
      .delete(projectMembers)
      .where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberUserId))
      );
  },

  /**
   * Ensures every user in the project's org has a project_members row.
   * Matches migration 0020 backfill — org admins become project admins, others members.
   * Safe to call repeatedly (ON CONFLICT DO NOTHING).
   */
  async backfillOrgMembersForProject(projectId: UUID): Promise<number> {
    const db = getDbIfInitialized();
    if (!db) {
      return 0;
    }

    const [project] = await db
      .select({ orgId: projects.orgId, createdAt: projects.createdAt })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new AppError(404, "project_not_found", "Project not found");
    }

    const orgUsers = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.orgId, project.orgId));

    if (orgUsers.length === 0) {
      return 0;
    }

    let inserted = 0;
    for (const user of orgUsers) {
      const projectRole: ProjectMemberRole =
        user.role === "super" || user.role === "admin" ? "admin" : "member";

      const result = await db
        .insert(projectMembers)
        .values({
          id: toUuid(randomUUID()),
          projectId,
          userId: toUuid(user.id),
          role: projectRole,
          createdAt: project.createdAt ?? new Date(),
        })
        .onConflictDoNothing({
          target: [projectMembers.projectId, projectMembers.userId],
        })
        .returning({ id: projectMembers.id });

      if (result.length > 0) {
        inserted += 1;
      }
    }

    return inserted;
  },

  async grantMembership(
    projectId: UUID,
    userId: UUID,
    projectRole: ProjectMemberRole
  ): Promise<void> {
    const db = getDbIfInitialized();
    if (!db) {
      return;
    }

    await db
      .insert(projectMembers)
      .values({
        id: toUuid(randomUUID()),
        projectId,
        userId,
        role: projectRole,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [projectMembers.projectId, projectMembers.userId],
        set: { role: projectRole },
      });
  },
};
