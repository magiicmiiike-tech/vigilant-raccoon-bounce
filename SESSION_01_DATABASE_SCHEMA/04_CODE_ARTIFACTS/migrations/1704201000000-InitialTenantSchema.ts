import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTenantSchema1704201000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "domain" character varying,
                "status" character varying NOT NULL DEFAULT 'active',
                "contact_email" character varying,
                CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tenant_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "settings" jsonb NOT NULL DEFAULT '{}',
                "branding" jsonb NOT NULL DEFAULT '{}',
                "voice_settings" jsonb NOT NULL DEFAULT '{}',
                "tenant_id" uuid NOT NULL,
                CONSTRAINT "PK_tenant_configs" PRIMARY KEY ("id"),
                CONSTRAINT "REL_tenant_config" UNIQUE ("tenant_id"),
                CONSTRAINT "FK_tenant_config_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "api_keys" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "name" character varying NOT NULL,
                "key_hash" character varying NOT NULL,
                "prefix" character varying NOT NULL,
                "scopes" text array NOT NULL DEFAULT '{}',
                "expires_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                CONSTRAINT "PK_api_keys" PRIMARY KEY ("id"),
                CONSTRAINT "FK_api_keys_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);
        
        await queryRunner.query(`CREATE INDEX "IDX_api_keys_tenant" ON "api_keys" ("tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "api_keys"`);
        await queryRunner.query(`DROP TABLE "tenant_configs"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
    }
}
