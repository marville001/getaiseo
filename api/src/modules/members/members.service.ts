import { User } from '@/modules/users/entities/user.entity';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { CreateMemberInviteDto } from './dto/create-member-invite.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { InviteStatus, MemberInvite } from './entities/member-invite.entity';
import { Member } from './entities/member.entity';
import { MemberInvitesRepository } from './member-invites.repository';
import { MembersRepository } from './members.repository';

@Injectable()
export class MembersService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly memberInvitesRepository: MemberInvitesRepository,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  private async sendInviteEmail(email: string, token: string, invitedBy: string | null): Promise<void> {
    try {
      let inviterName = 'Someone';
      if (invitedBy) {
        const inviter = await this.usersRepository.findOne({
          where: { userId: invitedBy },
        });
        if (inviter) {
          inviterName = inviter.firstName ? `${inviter.firstName} ${inviter.lastName || ''}`.trim() : inviter.email;
        }
      }

      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/dashboard/website-settings/accept-invite?token=${token}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You've Been Invited to Join a Team</h2>
          <p>Hello,</p>
          <p>${inviterName} has invited you to join their team on Edu AI Platform.</p>
          <p>Click the button below to accept the invitation and join the team:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
          <p><strong>This invitation will expire in 7 days.</strong></p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `;

      await this.mailService.sendEmail({
        to: email,
        subject: 'You\'ve Been Invited to Join Our Team',
        html: emailHtml,
      });
    } catch (error) {
      // Log error but don't throw - invite should still be created even if email fails
      console.error('Error sending invite email:', error);
    }
  }


  async createInvite(
    websiteId: string,
    createMemberInviteDto: CreateMemberInviteDto,
    invitedBy: string,
  ): Promise<MemberInvite> {
    const { email } = createMemberInviteDto;

    const existingInvite = await this.memberInvitesRepository.findByEmail(
      email,
      websiteId,
    );

    if (existingInvite && existingInvite.status === InviteStatus.PENDING) {``
      throw new ConflictException('This email already has a pending invitation');
    }

    if (existingInvite && existingInvite.status === InviteStatus.ACCEPTED) {
      throw new ConflictException('This email is already a member of this website');
    }

    // Generate invite token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = new MemberInvite({
      email,
      websiteId,
      token,
      invitedBy,
      expiresAt,
      status: InviteStatus.PENDING,
    });

    const createdInvite = await this.memberInvitesRepository.create(invite);

    // Send invite email
    await this.sendInviteEmail(email, token, invitedBy);
    //check for error sending emails

    return createdInvite;
  }


  async getInvites(
    websiteId: string,
    page: number = 1,
    limit: number = 10,
    status?: InviteStatus,
  ) {
    return this.memberInvitesRepository.findByWebsiteIdPaginated(
      websiteId,
      page,
      limit,
      status,
      ['inviter'],
    );
  }

  async getMembers(
    websiteId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    return this.membersRepository.findByWebsiteIdPaginated(
      websiteId,
      page,
      limit,
    );
  }

  async getMember(memberId: string): Promise<Member> {
    const member = await this.membersRepository.findOne({
      where: { memberId },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  // In members.service.ts
async acceptInvite(token: string): Promise<{ member: Member; message: string }> {
  const invite = await this.memberInvitesRepository.findByToken(token);

  if (!invite) {
    throw new NotFoundException('Invite not found or expired');
  }

  if (invite.status !== InviteStatus.PENDING) {
    throw new BadRequestException(`Invite has already been ${invite.status.toLowerCase()}`);
  }

  if (new Date() > invite.expiresAt) {
    invite.status = InviteStatus.EXPIRED;
    await this.memberInvitesRepository.save(invite);
    throw new BadRequestException('Invite has expired');
  }

  // Find user by email from the invite
  const user = await this.usersRepository.findOne({
    where: { email: invite.email },
  });

  if (!user) {
    // If user doesn't exist, you could:
    // 1. Create a new user account
    // 2. Ask user to sign up first
    // 3. Create a placeholder user
    throw new NotFoundException('No account found with this email. Please sign up first.');
  }

  // Check if user is already a member
  const existingMember = await this.membersRepository.findByUserAndWebsite(
    user.userId,
    invite.websiteId,
  );

  if (existingMember) {
    throw new ConflictException('You are already a member of this website');
  }

  const member = new Member({
    userId: user.userId,
    websiteId: invite.websiteId,
    isActive: true,
    joinedAt: new Date(),
  });

  const createdMember = await this.membersRepository.create(member);

  invite.status = InviteStatus.ACCEPTED;
  invite.acceptedAt = new Date();
  await this.memberInvitesRepository.save(invite);

  return {
    member: createdMember,
    message: 'Successfully accepted the invitation',
  };
}


  async rejectInvite(token: string, rejectionReason?: string): Promise<{ message: string }> {
    const invite = await this.memberInvitesRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(`Invite has already been ${invite.status.toLowerCase()}`);
    }

    invite.status = InviteStatus.REJECTED;
    invite.rejectedAt = new Date();
    invite.rejectionReason = rejectionReason;
    await this.memberInvitesRepository.save(invite);

    return { message: 'Invitation rejected successfully' };
  }

  async revokeInvite(inviteId: string): Promise<{ message: string }> {
    const invite = await this.memberInvitesRepository.findOne({
      where: { inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    invite.status = InviteStatus.REVOKED;
    invite.revokedAt = new Date();
    await this.memberInvitesRepository.save(invite);

    return { message: 'Invitation revoked successfully' };
  }


  async updateMember(
    memberId: string,
    updateMemberDto: UpdateMemberDto,
  ): Promise<Member> {
    const member = await this.membersRepository.findOne({
      where: { memberId },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Update member
    if (updateMemberDto.isActive !== undefined) {
      member.isActive = updateMemberDto.isActive;
    }

    return this.membersRepository.save(member);
  }


  async removeMember(memberId: string): Promise<{ message: string }> {
    const member = await this.membersRepository.findOne({
      where: { memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Soft delete by marking as inactive
    member.isActive = false;
    await this.membersRepository.save(member);

    return {
      message: 'Member removed successfully',
    };
  }


  async getMemberCount(websiteId: string): Promise<number> {
    return this.membersRepository.countMembers(websiteId);
  }


  async resendInvite(inviteId: string): Promise<MemberInvite> {
    const invite = await this.memberInvitesRepository.findOne({
      where: { inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    // Generate new token
    invite.token = randomBytes(32).toString('hex');
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedInvite = await this.memberInvitesRepository.save(invite);

    await this.sendInviteEmail(invite.email, updatedInvite.token, invite.invitedBy);

    return updatedInvite;
  }


  async getInviteByToken(token: string): Promise<MemberInvite> {
    const invite = await this.memberInvitesRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite not found or expired');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('This invitation has expired');
    }

    return invite;
  }


  async bulkCreateInvites(
    email: string,
    websiteIds: string[],
    invitedBy: string,
  ): Promise<MemberInvite[]> {
    const invites: MemberInvite[] = [];

    for (const websiteId of websiteIds) {
      const createInviteDto: CreateMemberInviteDto = {
        email,
        websiteId,
      };

      try {
        const invite = await this.createInvite(websiteId, createInviteDto, invitedBy);
        invites.push(invite);
      } catch (error) {
        // Continue with other websites even if one fails
        console.error(`Failed to create invite for website ${websiteId}:`, error);
      }
    }

    return invites;
  }
}
