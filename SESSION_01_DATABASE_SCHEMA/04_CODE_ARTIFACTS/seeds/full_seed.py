"""
Full database seeding for testing: tenants, users, agents, calls, etc.
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict
import psycopg
from psycopg.rows import dict_row
from werkzeug.security import generate_password_hash

class FullDatabaseSeeder:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    async def seed_full_data(self):
        try:
            async with await psycopg.AsyncConnection.connect(
                self.connection_string, row_factory=dict_row
            ) as conn:
                async with conn.cursor() as cur:
                    print("🚀 Starting full database seeding...")
                    tenant_id = await self._seed_tenants(cur)
                    await self._seed_users(cur, tenant_id)
                    agent_id = await self._seed_voice_agents(cur, tenant_id)
                    await self._seed_phone_numbers(cur, tenant_id, agent_id)
                    call_id = await self._seed_calls(cur, tenant_id, agent_id)
                    await self._seed_conversation_turns(cur, tenant_id, call_id)
                    await self._seed_knowledge_base(cur, tenant_id, agent_id)
                    await self._seed_analytics(cur, tenant_id)
                    await self._seed_audit_logs(cur, tenant_id)
                    await conn.commit()
                    print("✅ Full database seeding completed!")
        except Exception as e:
            print(f"❌ Seeding failed: {e}")

    async def _seed_tenants(self, cur) -> uuid.UUID:
        tenant_id = uuid.uuid4()
        await cur.execute("""
            INSERT INTO tenants (id, external_id, name, domain, tier, contact_email, billing_email, max_users, max_concurrent_calls, max_storage_gb, voice_clones_allowed, requires_hipaa, requires_gdpr)
            VALUES (%s, 'test-tenant-1', 'Test Tenant', 'test.tenant.com', 'enterprise', 'contact@test.com', 'billing@test.com', 100, 50, 500, 5, true, true)
            ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (tenant_id,))
        result = await cur.fetchone()
        return result['id']

    async def _seed_users(self, cur, tenant_id: uuid.UUID):
        users = [
            ('admin@test.com', 'Admin', 'User', 'tenant_admin', generate_password_hash('AdminPass123!')),
            ('user@test.com', 'Regular', 'User', 'user', generate_password_hash('UserPass123!'))
        ]
        for email, first, last, role, pw_hash in users:
            await cur.execute("""
                INSERT INTO users (id, tenant_id, external_id, email, password_hash, first_name, last_name, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (tenant_id, email) DO NOTHING
            """, (uuid.uuid4(), tenant_id, f'user-{uuid.uuid4().hex[:8]}', email, pw_hash, first, last, role))

    async def _seed_voice_agents(self, cur, tenant_id: uuid.UUID) -> uuid.UUID:
        agent_id = uuid.uuid4()
        await cur.execute("""
            INSERT INTO voice_agents (id, tenant_id, name, description, status)
            VALUES (%s, %s, 'Helpful Agent', 'A testing agent', 'active')
            ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
            RETURNING id
        """, (agent_id, tenant_id))
        result = await cur.fetchone()
        return result['id']

    async def _seed_phone_numbers(self, cur, tenant_id: uuid.UUID, agent_id: uuid.UUID):
        await cur.execute("""
            INSERT INTO phone_numbers (id, tenant_id, phone_number, country_code, number_type, provider, voice_agent_id, status)
            VALUES (%s, %s, '+15550100001', 'US', 'local', 'twilio', %s, 'active')
            ON CONFLICT (phone_number) DO NOTHING
        """, (uuid.uuid4(), tenant_id, agent_id))

    async def _seed_calls(self, cur, tenant_id: uuid.UUID, agent_id: uuid.UUID) -> uuid.UUID:
        call_id = uuid.uuid4()
        await cur.execute("""
            INSERT INTO calls (id, tenant_id, voice_agent_id, direction, call_type, from_number, to_number, call_time, status)
            VALUES (%s, %s, %s, 'inbound', 'voice', '+15559998888', '+15550100001', NOW(), 'completed')
            RETURNING id
        """, (call_id, tenant_id, agent_id))
        result = await cur.fetchone()
        return result['id']

    async def _seed_conversation_turns(self, cur, tenant_id: uuid.UUID, call_id: uuid.UUID):
        await cur.execute("""
            INSERT INTO conversation_turns (id, call_id, tenant_id, turn_index, speaker, message, start_time)
            VALUES (%s, %s, %s, 1, 'customer', 'Hello, I need help.', NOW())
        """, (uuid.uuid4(), call_id, tenant_id))

    async def _seed_knowledge_base(self, cur, tenant_id: uuid.UUID, agent_id: uuid.UUID):
        await cur.execute("""
            INSERT INTO knowledge_base_documents (id, tenant_id, voice_agent_id, title, source_type, status)
            VALUES (%s, %s, %s, 'Support Docs', 'manual', 'active')
        """, (uuid.uuid4(), tenant_id, agent_id))

    async def _seed_analytics(self, cur, tenant_id: uuid.UUID):
        await cur.execute("""
            INSERT INTO tenant_analytics_daily (id, tenant_id, date, total_calls)
            VALUES (%s, %s, CURRENT_DATE, 1)
            ON CONFLICT (tenant_id, date) DO NOTHING
        """, (uuid.uuid4(), tenant_id))

    async def _seed_audit_logs(self, cur, tenant_id: uuid.UUID):
        await cur.execute("""
            INSERT INTO audit_logs (id, tenant_id, action, resource_type, created_at)
            VALUES (%s, %s, 'seed_run', 'system', NOW())
        """, (uuid.uuid4(), tenant_id))

async def main():
    connection_string = "postgresql://dukat_app:secure_password@localhost:5432/dukat_voice"
    seeder = FullDatabaseSeeder(connection_string)
    await seeder.seed_full_data()

if __name__ == "__main__":
    asyncio.run(main())
