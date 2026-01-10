import { AbstractEntity } from '@/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MemberInvite } from './member-invite.entity';

@Entity('members')
@Index(['userId', 'websiteId'], { unique: true })
export class Member extends AbstractEntity<Member> {
  @PrimaryGeneratedColumn('uuid', { name: 'member_id' })
  memberId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'website_id' })
  websiteId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  joinedAt?: Date;

  @Column({ nullable: true })
  invitedAt?: Date;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  // Relations
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => MemberInvite, (invite) => invite.member, { cascade: true })
  invites: MemberInvite[];
}
