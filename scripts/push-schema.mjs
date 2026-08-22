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

if (!url) {
  console.error('Error: TURSO_DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run() {
  console.log('Connecting to Turso via HTTP web client and executing migration...');
  const sqlFile = resolve(process.cwd(), 'drizzle/0000_init.sql');
  const sql = readFileSync(sqlFile, 'utf8');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    console.log(`Executing: ${stmt.slice(0, 50)}...`);
    await client.execute(stmt);
  }

  console.log('✅ Tables created successfully on Turso database!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
