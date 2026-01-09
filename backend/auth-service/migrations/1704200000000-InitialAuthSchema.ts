import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialAuthSchema1704200000000 implements MigrationInterface {
    name = 'InitialAuthSchema1704200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Roles
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying,
                "tenant_id" uuid NOT NULL,
                CONSTRAINT "PK_roles" PRIMARY KEY ("id")
            )
        `);

        // Permissions
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "slug" character varying NOT NULL,
                "description" character varying NOT NULL,
                "scope" character varying NOT NULL DEFAULT 'system',
                CONSTRAINT "UQ_permissions_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
            )
        `);

        // Users
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "email" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "first_name" character varying,
                "last_name" character varying,
                "tenant_id" uuid NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "last_login_at" TIMESTAMP,
                "role_id" uuid,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Sessions
        await queryRunner.query(`
            CREATE TABLE "sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "token" character varying NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "ip_address" character varying,
                "user_agent" character varying,
                "is_valid" boolean NOT NULL DEFAULT true,
                "user_id" uuid NOT NULL,
                CONSTRAINT "UQ_sessions_token" UNIQUE ("token"),
                CONSTRAINT "PK_sessions" PRIMARY KEY ("id")
            )
        `);

        // Relationships
        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "FK_users_roles" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        
        // Join Table for Roles <-> Permissions
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
                CONSTRAINT "FK_rp_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_rp_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_users"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_roles"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }
}
