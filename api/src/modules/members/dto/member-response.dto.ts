import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MemberResponseDto {
  @Expose()
  memberId: string;

  @Expose()
  userId: string;

  @Expose()
  websiteId: string;

  @Expose()
  isActive: boolean;

  @Expose()
  joinedAt?: Date;

  @Expose()
  invitedAt?: Date;

  @Expose()
  invitedBy?: string;

  @Expose()
  user: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  role?: string; // Placeholder - will be resolved by permissions system
}
