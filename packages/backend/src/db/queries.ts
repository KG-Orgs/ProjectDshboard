/**
 * Database Query Utilities
 * Common queries and operations optimized for performance
 */

import { db } from './client';
import { users, projects, tasks, documents } from './schema';
import { eq, and, lt, gt, like, desc, count } from 'drizzle-orm';

/**
 * User queries
 */
export const userQueries = {
  /**
   * Get user by email
   */
  async getByEmail(email: string) {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  /**
   * Get user by ID
   */
  async getById(id: string) {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        projects: true,
      },
    });
  },

  /**
   * Create new user
   */
  async create(data: any) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },

  /**
   * Update user
   */
  async update(id: string, data: any) {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  },
};

/**
 * Project queries
 */
export const projectQueries = {
  /**
   * Get all projects for a manager
   */
  async getByManager(managerId: string) {
    return await db.query.projects.findMany({
      where: eq(projects.managerId, managerId),
      with: {
        tasks: {
          columns: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: desc(projects.createdAt),
    });
  },

  /**
   * Get project by ID with details
   */
  async getById(id: string) {
    return await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        manager: true,
        tasks: true,
        documents: true,
      },
    });
  },

  /**
   * Get projects by status
   */
  async getByStatus(status: string) {
    return await db.query.projects.findMany({
      where: eq(projects.status, status as any),
      orderBy: desc(projects.startDate),
    });
  },

  /**
   * Get active projects
   */
  async getActive() {
    return await db.query.projects.findMany({
      where: eq(projects.status, 'active'),
      orderBy: desc(projects.progress),
    });
  },

  /**
   * Create new project
   */
  async create(data: any) {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  },

  /**
   * Update project
   */
  async update(id: string, data: any) {
    const result = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  },

  /**
   * Get project statistics
   */
  async getStats(projectId: string) {
    const project = await projectQueries.getById(projectId);
    if (!project) return null;

    const taskStats = await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .groupBy(tasks.status);

    return {
      id: projectId,
      name: project.name,
      progress: project.progress,
      budget: project.budget,
      spent: project.spent,
      taskStats,
      teamSize: 0, // TODO: Get from join table
    };
  },
};

/**
 * Task queries
 */
export const taskQueries = {
  /**
   * Get all tasks for project
   */
  async getByProject(projectId: string) {
    return await db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId),
      with: {
        assignee: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: desc(tasks.createdAt),
    });
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status: string) {
    return await db.query.tasks.findMany({
      where: eq(tasks.status, status as any),
    });
  },

  /**
   * Get tasks assigned to user
   */
  async getAssignedTo(userId: string) {
    return await db.query.tasks.findMany({
      where: eq(tasks.assigneeId, userId),
      with: {
        project: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: tasks.dueDate,
    });
  },

  /**
   * Get overdue tasks
   */
  async getOverdue() {
    const now = new Date();
    return await db.query.tasks.findMany({
      where: and(
        lt(tasks.dueDate, now),
        // Not completed
      ),
    });
  },

  /**
   * Create new task
   */
  async create(data: any) {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  },

  /**
   * Update task
   */
  async update(id: string, data: any) {
    const result = await db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  },
};

/**
 * Document queries
 */
export const documentQueries = {
  /**
   * Get documents for project
   */
  async getByProject(projectId: string) {
    return await db.query.documents.findMany({
      where: eq(documents.projectId, projectId),
      orderBy: desc(documents.createdAt),
    });
  },

  /**
   * Get document by OneDrive ID
   */
  async getByOneDriveId(oneDriveId: string) {
    return await db.query.documents.findFirst({
      where: eq(documents.oneDriveId, oneDriveId),
    });
  },

  /**
   * Create or update document
   */
  async upsert(data: any) {
    return await db
      .insert(documents)
      .values(data)
      .onConflictDoUpdate({
        target: documents.oneDriveId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      });
  },

  /**
   * Delete document
   */
  async delete(id: string) {
    await db.delete(documents).where(eq(documents.id, id));
  },
};
