#!/usr/bin/env node
const { Client } = require('pg');
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const maxRetries = parseInt(process.env.DB_MAX_RETRIES || '60');

(async function waitForDb() {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const c = new Client({ host, port, user, password });
      await c.connect();
      await c.end();
      console.log('Postgres is available');
      process.exit(0);
    } catch (err) {
      console.log(`Waiting for Postgres (${i + 1}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.error('Postgres did not become available in time');
  process.exit(1);
})();