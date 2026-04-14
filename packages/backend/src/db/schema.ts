import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  oneDriveTenantId: text('onedrive_tenant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .references(() => organizations.id)
      .notNull(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: varchar('role', { length: 32 }).default('member').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('users_org_id_idx').on(table.orgId),
  }),
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .references(() => organizations.id)
      .notNull(),
    name: text('name').notNull(),
    oneDriveFolderId: text('onedrive_folder_id'),
    status: varchar('status', { length: 32 }).default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('projects_org_id_idx').on(table.orgId),
    statusIdx: index('projects_status_idx').on(table.status),
  }),
);

export const fileRecords = pgTable(
  'file_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    oneDriveItemId: text('onedrive_item_id').notNull().unique(),
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileType: varchar('file_type', { length: 32 }),
    fileSize: integer('file_size'),
    mimeType: text('mime_type'),
    summary: varchar('summary', { length: 500 }),
    keyTopics: text('key_topics').array().default([]).notNull(),
    tags: text('tags').array().default([]).notNull(),
    docCategory: varchar('doc_category', { length: 64 }),
    specSection: varchar('spec_section', { length: 32 }),
    sheetNumber: varchar('sheet_number', { length: 32 }),
    revision: varchar('revision', { length: 64 }),
    oneDriveEtag: text('onedrive_etag'),
    oneDriveWebUrl: text('onedrive_web_url'),
    lastSynced: timestamp('last_synced', { withTimezone: true }),
    indexStatus: varchar('index_status', { length: 32 }).default('pending').notNull(),
    lastIndexed: timestamp('last_indexed', { withTimezone: true }),
    chunkCount: integer('chunk_count').default(0).notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('file_records_project_id_idx').on(table.projectId),
    categoryIdx: index('file_records_doc_category_idx').on(table.docCategory),
    specIdx: index('file_records_spec_section_idx').on(table.specSection),
  }),
);

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('chat_sessions_project_id_idx').on(table.projectId),
    userIdx: index('chat_sessions_user_id_idx').on(table.userId),
  }),
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => chatSessions.id)
      .notNull(),
    role: varchar('role', { length: 16 }).notNull(),
    content: text('content').notNull(),
    sources: jsonb('sources').$type<Array<Record<string, unknown>>>().default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index('chat_messages_session_id_idx').on(table.sessionId),
  }),
);

export const features = pgTable('features', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  route: text('route').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().default({}).notNull(),
});

export const projectFeatures = pgTable(
  'project_features',
  {
    projectId: uuid('project_id')
      .references(() => projects.id)
      .notNull(),
    featureId: varchar('feature_id', { length: 64 })
      .references(() => features.id)
      .notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().default({}).notNull(),
  },
  (table) => ({
    projectFeatureIdx: index('project_features_project_feature_idx').on(table.projectId, table.featureId),
  }),
);
