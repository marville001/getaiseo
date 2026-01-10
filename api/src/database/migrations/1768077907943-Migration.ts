import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1768077907943 implements MigrationInterface {
    name = 'Migration1768077907943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "members" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "member_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "website_id" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "joinedAt" TIMESTAMP, "invitedAt" TIMESTAMP, "invited_by" character varying, CONSTRAINT "PK_7613f2f182039ec974f24a53810" PRIMARY KEY ("member_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c9178b62a8858f9e3aa657085f" ON "members" ("user_id", "website_id") `);
        await queryRunner.query(`CREATE TABLE "member_invites" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "invite_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "website_id" character varying NOT NULL, "email" character varying NOT NULL, "token" character varying NOT NULL, "status" "public"."member_invites_status_enum" NOT NULL DEFAULT 'PENDING', "invited_by" uuid, "acceptedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "revokedAt" TIMESTAMP, "rejectedAt" TIMESTAMP, "rejectionReason" character varying, "member_id" uuid, CONSTRAINT "UQ_6a8891dafc9473d9d5088816d16" UNIQUE ("token"), CONSTRAINT "PK_b98241a72b0a28afbf878a35ab2" PRIMARY KEY ("invite_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6a8891dafc9473d9d5088816d1" ON "member_invites" ("token") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_eceee4b5a8722cd90009bc2491" ON "member_invites" ("email", "website_id") `);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_da404b5fd9c390e25338996e2d1" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD CONSTRAINT "FK_d382346866ddf2a1fc5b6f765fb" FOREIGN KEY ("member_id") REFERENCES "members"("member_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_invites" ADD CONSTRAINT "FK_24baa2842ab763d635c820b49e6" FOREIGN KEY ("invited_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member_invites" DROP CONSTRAINT "FK_24baa2842ab763d635c820b49e6"`);
        await queryRunner.query(`ALTER TABLE "member_invites" DROP CONSTRAINT "FK_d382346866ddf2a1fc5b6f765fb"`);
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_da404b5fd9c390e25338996e2d1"`);
        await queryRunner.query(`ALTER TABLE "ai_model_configurations" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eceee4b5a8722cd90009bc2491"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a8891dafc9473d9d5088816d1"`);
        await queryRunner.query(`DROP TABLE "member_invites"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9178b62a8858f9e3aa657085f"`);
        await queryRunner.query(`DROP TABLE "members"`);
    }

}
