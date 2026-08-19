import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'contractor',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'contractor_db',
});

// Create drizzle client
export const db = drizzle(pool, { schema });

// Export for migrations and direct queries
export { pool, schema };
