import { AbstractEntity } from '@/database/abstract.entity';
import { User } from "@/modules/users/entities/user.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './member.entity';

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity('member_invites')
@Index(['email', 'websiteId'], { unique: true })
@Index(['token'], { unique: true })
export class MemberInvite extends AbstractEntity<MemberInvite> {
  @PrimaryGeneratedColumn('uuid', { name: 'invite_id' })
  inviteId: string;

  @Column({ name: 'website_id' })
  websiteId: string;

  @Column()
  email: string;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  rejectedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @ManyToOne(() => Member, (member) => member.invites, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'member_id' })
  member?: Member;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'invited_by' })
  inviter?: User;
}
