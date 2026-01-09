import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1767967206500 implements MigrationInterface {
    name = 'Migration1767967206500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member_invites" DROP CONSTRAINT "FK_aa0d859ffb7892e72461e21d065"`);
        await queryRunner.query(`ALTER TABLE "member_invites" DROP COLUMN "invitedBy"`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "member_invites" DROP COLUMN "invited_by"`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD "invited_by" uuid`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD CONSTRAINT "FK_24baa2842ab763d635c820b49e6" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member_invites" DROP CONSTRAINT "FK_24baa2842ab763d635c820b49e6"`);
        await queryRunner.query(`ALTER TABLE "member_invites" DROP COLUMN "invited_by"`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD "invited_by" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD "invitedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD CONSTRAINT "FK_aa0d859ffb7892e72461e21d065" FOREIGN KEY ("invitedBy") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
