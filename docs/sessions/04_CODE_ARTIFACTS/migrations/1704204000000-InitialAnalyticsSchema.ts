import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialAnalyticsSchema1704204000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "call_metrics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "call_id" uuid NOT NULL,
                "tenant_id" uuid NOT NULL,
                "jitter" float NOT NULL DEFAULT 0,
                "latency" float NOT NULL DEFAULT 0,
                "packet_loss" float NOT NULL DEFAULT 0,
                "mos_score" float,
                "timeline" jsonb,
                CONSTRAINT "PK_call_metrics" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_call_metrics_call" ON "call_metrics" ("call_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_call_metrics_tenant" ON "call_metrics" ("tenant_id")`);

        await queryRunner.query(`
            CREATE TABLE "tenant_analytics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "date" date NOT NULL,
                "total_calls" integer NOT NULL DEFAULT 0,
                "total_minutes" integer NOT NULL DEFAULT 0,
                "failed_calls" integer NOT NULL DEFAULT 0,
                "cost_estimate" decimal(10,2) NOT NULL DEFAULT 0,
                CONSTRAINT "PK_tenant_analytics" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_tenant_analytics_date" UNIQUE ("tenant_id", "date")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "voice_quality_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "call_id" uuid NOT NULL,
                "tenant_id" uuid NOT NULL,
                "issue_type" character varying NOT NULL,
                "severity" float NOT NULL,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_voice_quality_logs" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "voice_quality_logs"`);
        await queryRunner.query(`DROP TABLE "tenant_analytics"`);
        await queryRunner.query(`DROP TABLE "call_metrics"`);
    }
}
