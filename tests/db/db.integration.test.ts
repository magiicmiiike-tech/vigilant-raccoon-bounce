import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dukat_app:secure_password@localhost:5432/dukat_voice_test';

describe('Database integration', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('should have tenants table', async () => {
    const res = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tenants'
      ) as exists
    `);
    expect(res.rows[0].exists).toBe(true);
  }, 20000);

  it('should have users table', async () => {
    const res = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) as exists
    `);
    expect(res.rows[0].exists).toBe(true);
  });

  it('should have calls table', async () => {
    const res = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'calls'
      ) as exists
    `);
    expect(res.rows[0].exists).toBe(true);
  });
});
