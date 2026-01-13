import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedUserWebsiteEnity1768035001430 implements MigrationInterface {
    name = 'UpdatedUserWebsiteEnity1768035001430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_websites" ADD "deleted_by" character varying`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "user_websites" DROP COLUMN "deleted_by"`);
    }

}
