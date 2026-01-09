import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTelephonySchema1704202000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "phone_numbers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "e164" character varying NOT NULL,
                "tenant_id" uuid NOT NULL,
                "provider" character varying NOT NULL,
                "provider_sid" character varying,
                "capabilities" jsonb NOT NULL DEFAULT '{"voice":true,"sms":false}',
                CONSTRAINT "UQ_phone_numbers_e164" UNIQUE ("e164"),
                CONSTRAINT "PK_phone_numbers" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "calls" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "direction" character varying NOT NULL,
                "from_number" character varying NOT NULL,
                "to_number" character varying NOT NULL,
                "status" character varying NOT NULL,
                "duration_seconds" integer NOT NULL DEFAULT 0,
                "provider_call_id" character varying,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                CONSTRAINT "PK_calls" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_calls_tenant" ON "calls" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_calls_provider_id" ON "calls" ("provider_call_id")`);

        await queryRunner.query(`
            CREATE TABLE "call_recordings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "url" character varying NOT NULL,
                "call_id" uuid NOT NULL,
                CONSTRAINT "PK_call_recordings" PRIMARY KEY ("id"),
                CONSTRAINT "FK_recording_call" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "call_recordings"`);
        await queryRunner.query(`DROP TABLE "calls"`);
        await queryRunner.query(`DROP TABLE "phone_numbers"`);
    }
}
