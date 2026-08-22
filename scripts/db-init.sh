#!/bin/bash
# Initialize TapFlow database schema on Turso
# Usage: bash scripts/db-init.sh

set -e

if [ -z "$TURSO_DATABASE_URL" ]; then
  echo "Error: TURSO_DATABASE_URL not set. Copy .env.example to .env.local and fill in values."
  exit 1
fi

echo "Running database migration..."
npx drizzle-kit push
echo "Database initialized successfully!"
