import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from "../mail/mail.module";
import { User } from '../users/entities/user.entity';
import { MemberInvite } from './entities/member-invite.entity';
import { Member } from './entities/member.entity';
import { MemberInvitesRepository } from './member-invites.repository';
import { MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, MemberInvite, User]),
    MailModule
  ],
  controllers: [MembersController],
  providers: [MembersService, MembersRepository, MemberInvitesRepository],
  exports: [MembersService, MembersRepository, MemberInvitesRepository],
})
export class MembersModule {}
