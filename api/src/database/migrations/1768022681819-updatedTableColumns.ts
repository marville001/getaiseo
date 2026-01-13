import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedTableColumns1768022681819 implements MigrationInterface {
    name = 'UpdatedTableColumns1768022681819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_dd845045ccdebe750e379214209"`);
        await queryRunner.query(`ALTER TABLE "keywords" DROP CONSTRAINT "FK_8eac6e14ad0963782e81a098a4e"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_fcc59033d724394ca570aa07237"`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_dd845045ccdebe750e379214209" FOREIGN KEY ("last_opened_website_id") REFERENCES "user_websites"("website_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "keywords" ADD CONSTRAINT "FK_8eac6e14ad0963782e81a098a4e" FOREIGN KEY ("website_id") REFERENCES "user_websites"("website_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_fcc59033d724394ca570aa07237" FOREIGN KEY ("website_id") REFERENCES "user_websites"("website_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_fcc59033d724394ca570aa07237"`);
        await queryRunner.query(`ALTER TABLE "keywords" DROP CONSTRAINT "FK_8eac6e14ad0963782e81a098a4e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_dd845045ccdebe750e379214209"`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_fcc59033d724394ca570aa07237" FOREIGN KEY ("website_id") REFERENCES "website_pages"("page_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "keywords" ADD CONSTRAINT "FK_8eac6e14ad0963782e81a098a4e" FOREIGN KEY ("website_id") REFERENCES "website_pages"("page_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_dd845045ccdebe750e379214209" FOREIGN KEY ("last_opened_website_id") REFERENCES "website_pages"("page_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
