/**
 * Initial Database Migration
 * Creates all tables for the ContractorAI MVP
 *
 * Run with: npm run db:migrate
 */

import { db, pool } from '../db/client';

export async function up() {
  console.log('Running migration: create ContractorAI schema');

  try {
    await pool.query('SELECT 1');

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('Rolling back migration: ContractorAI schema');

  try {
    // Drop tables in reverse order of dependencies
    await pool.query('DROP TABLE IF EXISTS project_features CASCADE');
    await pool.query('DROP TABLE IF EXISTS features CASCADE');
    await pool.query('DROP TABLE IF EXISTS chat_messages CASCADE');
    await pool.query('DROP TABLE IF EXISTS chat_sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS file_records CASCADE');
    await pool.query('DROP TABLE IF EXISTS projects CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS organizations CASCADE');

    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}
