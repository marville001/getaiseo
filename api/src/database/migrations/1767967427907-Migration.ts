import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1767967427907 implements MigrationInterface {
    name = 'Migration1767967427907'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "last_opened_website_id" uuid`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_dd845045ccdebe750e379214209" FOREIGN KEY ("last_opened_website_id") REFERENCES "website_pages"("page_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_dd845045ccdebe750e379214209"`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_opened_website_id"`);
    }

}
