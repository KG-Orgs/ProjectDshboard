import { and, count, desc, eq } from 'drizzle-orm';

import { db } from './client';
import {
  chatMessages,
  chatSessions,
  features,
  fileRecords,
  organizations,
  projectFeatures,
  projects,
  users,
} from './schema';

export const organizationQueries = {
  async getById(id: string) {
    return db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
  },
};

export const userQueries = {
  async getByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  async getById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  async create(data: typeof users.$inferInsert) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  },
};

export const projectQueries = {
  async listByOrg(orgId: string) {
    return db.query.projects.findMany({
      where: eq(projects.orgId, orgId),
      orderBy: desc(projects.createdAt),
    });
  },

  async getById(id: string) {
    return db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  },

  async create(data: typeof projects.$inferInsert) {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  },

  async update(id: string, data: Partial<typeof projects.$inferInsert>) {
    const result = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return result[0];
  },

  async getOverview(projectId: string) {
    const project = await this.getById(projectId);

    if (!project) {
      return null;
    }

    const indexedFiles = await db
      .select({ value: count() })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.indexStatus, 'indexed')));

    const totalFiles = await db
      .select({ value: count() })
      .from(fileRecords)
      .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.deleted, false)));

    return {
      project,
      indexedFileCount: indexedFiles[0]?.value ?? 0,
      totalFileCount: totalFiles[0]?.value ?? 0,
    };
  },
};

export const fileRecordQueries = {
  async listByProject(projectId: string) {
    return db.query.fileRecords.findMany({
      where: and(eq(fileRecords.projectId, projectId), eq(fileRecords.deleted, false)),
      orderBy: desc(fileRecords.updatedAt),
    });
  },

  async getByOneDriveItemId(oneDriveItemId: string) {
    return db.query.fileRecords.findFirst({
      where: eq(fileRecords.oneDriveItemId, oneDriveItemId),
    });
  },

  async upsert(data: typeof fileRecords.$inferInsert) {
    const result = await db
      .insert(fileRecords)
      .values(data)
      .onConflictDoUpdate({
        target: fileRecords.oneDriveItemId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  },

  async softDelete(projectId: string, oneDriveItemId: string) {
    const result = await db
      .update(fileRecords)
      .set({ deleted: true, updatedAt: new Date() })
      .where(and(eq(fileRecords.projectId, projectId), eq(fileRecords.oneDriveItemId, oneDriveItemId)))
      .returning();

    return result[0];
  },
};

export const chatQueries = {
  async listSessions(projectId: string) {
    return db.query.chatSessions.findMany({
      where: eq(chatSessions.projectId, projectId),
      orderBy: desc(chatSessions.createdAt),
    });
  },

  async createSession(data: typeof chatSessions.$inferInsert) {
    const result = await db.insert(chatSessions).values(data).returning();
    return result[0];
  },

  async listMessages(sessionId: string) {
    return db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: desc(chatMessages.createdAt),
    });
  },

  async appendMessage(data: typeof chatMessages.$inferInsert) {
    const result = await db.insert(chatMessages).values(data).returning();
    return result[0];
  },
};

export const featureQueries = {
  async getRegistry() {
    return db.query.features.findMany({
      orderBy: features.sortOrder,
    });
  },

  async getByProject(projectId: string) {
    return db.query.projectFeatures.findMany({
      where: eq(projectFeatures.projectId, projectId),
    });
  },

  async upsertProjectFeature(data: typeof projectFeatures.$inferInsert) {
    return db
      .insert(projectFeatures)
      .values(data)
      .onConflictDoUpdate({
        target: [projectFeatures.projectId, projectFeatures.featureId],
        set: {
          enabled: data.enabled ?? true,
          config: data.config ?? {},
        },
      })
      .returning();
  },
};
