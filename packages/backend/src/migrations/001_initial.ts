/**
 * Initial Database Migration
 * Creates all tables for the Contractor Dashboard
 *
 * Run with: npm run db:migrate
 */

import { db, pool } from '../db/client';

export async function up() {
  console.log('Running migration: create initial schema');

  try {
    // Create ENUM types
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'worker');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE project_status AS ENUM ('planning', 'active', 'on-hold', 'completed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'review', 'completed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log('✅ Enum types created');

    // Tables will be created by Drizzle Kit
    // This is a placeholder for manual SQL migrations if needed

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('Rolling back migration: create initial schema');

  try {
    // Drop tables in reverse order of dependencies
    await pool.query('DROP TABLE IF EXISTS invitations CASCADE');
    await pool.query('DROP TABLE IF EXISTS activity_log CASCADE');
    await pool.query('DROP TABLE IF EXISTS chat_messages CASCADE');
    await pool.query('DROP TABLE IF EXISTS documents CASCADE');
    await pool.query('DROP TABLE IF EXISTS tasks CASCADE');
    await pool.query('DROP TABLE IF EXISTS projects CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    // Drop ENUM types
    await pool.query('DROP TYPE IF EXISTS task_priority');
    await pool.query('DROP TYPE IF EXISTS task_status');
    await pool.query('DROP TYPE IF EXISTS project_status');
    await pool.query('DROP TYPE IF EXISTS user_role');

    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}
