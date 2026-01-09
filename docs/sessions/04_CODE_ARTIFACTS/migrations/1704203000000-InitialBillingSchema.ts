import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialBillingSchema1704203000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "name" character varying NOT NULL,
                "price_monthly" decimal(10,2) NOT NULL,
                "limits" jsonb NOT NULL DEFAULT '{}',
                "stripe_price_id" character varying,
                CONSTRAINT "UQ_plans_name" UNIQUE ("name"),
                CONSTRAINT "PK_plans" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "plan_id" uuid NOT NULL,
                "status" character varying NOT NULL DEFAULT 'active',
                "current_period_start" TIMESTAMP NOT NULL,
                "current_period_end" TIMESTAMP NOT NULL,
                "stripe_subscription_id" character varying,
                CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "plans"("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_subscriptions_tenant" ON "subscriptions" ("tenant_id")`);

        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "amount" decimal(10,2) NOT NULL,
                "currency" character varying NOT NULL DEFAULT 'USD',
                "status" character varying NOT NULL DEFAULT 'draft',
                "stripe_invoice_id" character varying,
                "paid_at" TIMESTAMP,
                CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_tenant" ON "invoices" ("tenant_id")`);

        await queryRunner.query(`
            CREATE TABLE "usage_records" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                "type" character varying NOT NULL,
                "quantity" decimal(12,4) NOT NULL,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_usage_records" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_usage_records_tenant_type" ON "usage_records" ("tenant_id", "type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "usage_records"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "plans"`);
    }
}
