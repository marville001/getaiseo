import { IsUUID, IsString } from 'class-validator';

export class AcceptMemberInviteDto {
  @IsString()
  token: string;
}
