import { createClient } from '@libsql/client/web';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim().replace(/^["'](.*)["']$/, '$1');
    }
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });

async function run() {
  console.log('Creating custom_templates table in Turso...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS custom_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      aspect TEXT NOT NULL DEFAULT 'square',
      width INTEGER NOT NULL DEFAULT 500,
      height INTEGER NOT NULL DEFAULT 500,
      background TEXT NOT NULL DEFAULT '#ffffff',
      elements TEXT NOT NULL,
      thumbnail TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  console.log('✅ custom_templates table created successfully in Turso!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error creating table:', err);
  process.exit(1);
});
