import { Exclude, Expose, Type } from 'class-transformer';
import { InviteStatus } from '../entities/member-invite.entity';

@Exclude()
export class MemberInviteResponseDto {
  @Expose()
  inviteId: string;

  @Expose()
  memberId?: string;

  @Expose()
  websiteId: string;

  @Expose()
  invitedEmail: string;

  @Expose()
  token: string;

  @Expose()
  status: InviteStatus;

  @Expose()
  expiresAt: Date;

  @Expose()
  acceptedAt?: Date;

  @Expose()
  rejectedAt?: Date;

  @Expose()
  revokedAt?: Date;

  @Expose()
  rejectionReason?: string;

  @Expose()
  @Type(() => Object)
  invitedBy?: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
