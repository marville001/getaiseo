import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1767976729881 implements MigrationInterface {
    name = 'Migration1767976729881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "member_invites" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "invite_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "website_id" character varying NOT NULL, "email" character varying NOT NULL, "token" character varying NOT NULL, "status" "public"."member_invites_status_enum" NOT NULL DEFAULT 'PENDING', "invited_by" uuid, "acceptedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "revokedAt" TIMESTAMP, "rejectedAt" TIMESTAMP, "rejectionReason" character varying, "member_id" uuid, CONSTRAINT "UQ_6a8891dafc9473d9d5088816d16" UNIQUE ("token"), CONSTRAINT "PK_b98241a72b0a28afbf878a35ab2" PRIMARY KEY ("invite_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6a8891dafc9473d9d5088816d1" ON "member_invites" ("token") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_eceee4b5a8722cd90009bc2491" ON "member_invites" ("email", "website_id") `);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD CONSTRAINT "FK_d382346866ddf2a1fc5b6f765fb" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD CONSTRAINT "FK_24baa2842ab763d635c820b49e6" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member_invites" DROP CONSTRAINT "FK_24baa2842ab763d635c820b49e6"`);
        await queryRunner.query(`ALTER TABLE "member_invites" DROP CONSTRAINT "FK_d382346866ddf2a1fc5b6f765fb"`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eceee4b5a8722cd90009bc2491"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a8891dafc9473d9d5088816d1"`);
        await queryRunner.query(`DROP TABLE "member_invites"`);
    }

}
