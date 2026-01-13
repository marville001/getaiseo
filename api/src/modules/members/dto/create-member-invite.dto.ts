import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMemberInviteDto {
  @IsEmail()
  email: string;

  @IsUUID()
  websiteId: string;

  @IsString()
  @IsOptional()
  message?: string;

}
