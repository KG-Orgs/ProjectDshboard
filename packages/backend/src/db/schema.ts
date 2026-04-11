import {
  pgTable,
  text,
  serial,
  timestamp,
  numeric,
  varchar,
  boolean,
  uuid,
  index,
  foreignKey,
  enum as pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum types
export const userRole = pgEnum('user_role', ['admin', 'manager', 'worker']);
export const projectStatus = pgEnum('project_status', [
  'planning',
  'active',
  'on-hold',
  'completed',
]);
export const taskStatus = pgEnum('task_status', [
  'todo',
  'in-progress',
  'review',
  'completed',
]);
export const taskPriority = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').default('worker'),
  avatar: text('avatar'),
  oneDriveId: varchar('onedrive_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Projects table
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: projectStatus('status').default('planning'),
    progress: numeric('progress', { precision: 5, scale: 2 }).default('0'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    budget: numeric('budget', { precision: 12, scale: 2 }).notNull(),
    spent: numeric('spent', { precision: 12, scale: 2 }).default('0'),
    managerId: uuid('manager_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    managerIdx: index('projects_manager_id_idx').on(table.managerId),
    statusIdx: index('projects_status_idx').on(table.status),
  })
);

// Tasks table
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: taskStatus('status').default('todo'),
    priority: taskPriority('priority').default('medium'),
    assigneeId: uuid('assignee_id'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    projectIdx: index('tasks_project_id_idx').on(table.projectId),
    assigneeIdx: index('tasks_assignee_id_idx').on(table.assigneeId),
    statusIdx: index('tasks_status_idx').on(table.status),
  })
);

// Documents table for OneDrive sync
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    oneDriveId: varchar('onedrive_id', { length: 255 }).notNull().unique(),
    oneDrivePath: text('onedrive_path'),
    mimeType: varchar('mime_type', { length: 100 }),
    size: numeric('size', { precision: 15, scale: 0 }),
    url: text('url'),
    lastModified: timestamp('last_modified', { withTimezone: true }),
    uploadedBy: uuid('uploaded_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    projectIdx: index('documents_project_id_idx').on(table.projectId),
    oneDriveIdx: index('documents_onedrive_id_idx').on(table.oneDriveId),
  })
);

// Chat Messages table
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(),
    senderId: uuid('sender_id').notNull(),
    content: text('content').notNull(),
    attachments: text('attachments'), // JSON array of attachments
    isEdited: boolean('is_edited').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    projectIdx: index('chat_messages_project_id_idx').on(table.projectId),
    senderIdx: index('chat_messages_sender_id_idx').on(table.senderId),
    createdIdx: index('chat_messages_created_at_idx').on(table.createdAt),
  })
);

// Activity Log table
export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(),
    userId: uuid('user_id').notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(), // 'task', 'project', etc.
    entityId: uuid('entity_id'),
    changes: text('changes'), // JSON of what changed
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    projectIdx: index('activity_log_project_id_idx').on(table.projectId),
    userIdx: index('activity_log_user_id_idx').on(table.userId),
    createdIdx: index('activity_log_created_at_idx').on(table.createdAt),
  })
);

// User invitations table
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    role: userRole('role').default('worker'),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    projectIdx: index('invitations_project_id_idx').on(table.projectId),
    emailIdx: index('invitations_email_idx').on(table.email),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  chatMessages: many(chatMessages),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  manager: one(users, {
    fields: [projects.managerId],
    references: [users.id],
  }),
  tasks: many(tasks),
  documents: many(documents),
  chatMessages: many(chatMessages),
  activities: many(activityLog),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
}));
