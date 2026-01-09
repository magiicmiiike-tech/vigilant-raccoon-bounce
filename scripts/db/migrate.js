#!/usr/bin/env node
/*
  Simple migration runner: executes all .sql files in the migrations folder in sorted order
  Usage: DATABASE_URL=postgresql://user:pass@host:port/db node scripts/db/migrate.js
*/
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const migrationsDir = process.env.MIGRATIONS_DIR || path.join(__dirname, '..', '..', 'SESSION_01_DATABASE_SCHEMA', 'databases', 'postgresql', 'migrations');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Example: postgresql://dukat_app:secure_password@localhost:5432/dukat_voice');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`--> Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ Applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${file} failed:`, err.message);
        throw err;
      }
    }

    console.log('All migrations applied successfully');
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
