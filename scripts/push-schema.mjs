import { createClient } from '@libsql/client/web';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0 && !process.env[key.trim()]) {
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
  console.log('Connecting to database and executing migrations...');
  const migrationDir = resolve(process.cwd(), 'drizzle');
  const files = readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const statements = readFileSync(resolve(migrationDir, file), 'utf8')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      if (stmt.startsWith('ALTER TABLE `cards` ADD COLUMN `owner_id`')) {
        const columns = await client.execute('PRAGMA table_info(cards)');
        if (columns.rows.some((row) => row.name === 'owner_id')) continue;
      }
      if (stmt.startsWith('ALTER TABLE `admin_users` ADD COLUMN `expires_at`')) {
        const columns = await client.execute('PRAGMA table_info(admin_users)');
        if (columns.rows.some((row) => row.name === 'expires_at')) continue;
      }
      console.log(`Executing ${file}: ${stmt.slice(0, 50)}...`);
      await client.execute(stmt);
    }
  }

  console.log('✅ Tables created successfully on Turso database!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
