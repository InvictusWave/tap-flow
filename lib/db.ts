import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof createDbClient>;
let _db: DrizzleDb | null = null;

function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export function getDb(): DrizzleDb {
  if (_db) return _db;
  _db = createDbClient();
  return _db;
}

// Lazy proxy so callers can write `db.query...` without calling getDb()
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    return getDb()[prop as keyof DrizzleDb];
  },
});
