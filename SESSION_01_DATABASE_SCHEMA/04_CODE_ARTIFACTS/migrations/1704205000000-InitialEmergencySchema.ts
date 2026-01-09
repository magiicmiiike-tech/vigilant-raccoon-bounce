import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialEmergencySchema1704205000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "psap_info" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "psap_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "region" character varying NOT NULL,
                "coverage_area" text NOT NULL,
                CONSTRAINT "UQ_psap_info_id" UNIQUE ("psap_id"),
                CONSTRAINT "PK_psap_info" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "emergency_contacts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "phone_number" character varying NOT NULL,
                "relation" character varying NOT NULL,
                "priority" integer NOT NULL DEFAULT 1,
                CONSTRAINT "PK_emergency_contacts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_emergency_contacts_tenant" ON "emergency_contacts" ("tenant_id")`);

        await queryRunner.query(`
            CREATE TABLE "emergency_calls" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "original_call_id" uuid NOT NULL,
                "caller_number" character varying NOT NULL,
                "location_data" jsonb NOT NULL,
                "psap_id" character varying NOT NULL,
                "status" character varying NOT NULL,
                "recording_url" character varying,
                CONSTRAINT "PK_emergency_calls" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_emergency_calls_tenant" ON "emergency_calls" ("tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "emergency_calls"`);
        await queryRunner.query(`DROP TABLE "emergency_contacts"`);
        await queryRunner.query(`DROP TABLE "psap_info"`);
    }
}
