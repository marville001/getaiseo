import { IsOptional } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  isActive?: boolean;
}
