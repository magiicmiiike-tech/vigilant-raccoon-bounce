#!/usr/bin/env node
const { Client } = require('pg');
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || 'dukat_voice';

(async function createDb() {
  const c = new Client({ host, port, user, password });
  try {
    await c.connect();
    const res = await c.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (res.rows.length === 0) {
      console.log(`Creating database ${dbName}`);
      await c.query(`CREATE DATABASE ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
    await c.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creating DB:', err);
    process.exit(1);
  }
})();