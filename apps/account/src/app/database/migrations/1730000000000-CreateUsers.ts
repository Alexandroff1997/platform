import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUsers1730000000000 implements MigrationInterface {
  name = 'CreateUsers1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('Teacher', 'Student')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "display_name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'Student',
        CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "users_email_unique" UNIQUE ("email")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
