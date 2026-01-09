import { Client } from 'pg';

(async function smokeTest() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'dukat_voice'
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const tablesToCheck = ['tenants', 'users', 'calls'];
    for (const t of tablesToCheck) {
      const res = await client.query(
        `SELECT to_regclass($1) as exists`, [t]
      );
      if (!res.rows[0].exists) {
        throw new Error(`Expected table ${t} to exist`);
      }
      console.log(`Table ${t} exists`);
    }

    console.log('Integration smoke tests passed');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Integration smoke test failed:', err);
    process.exit(1);
  }
})();