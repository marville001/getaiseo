import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AcceptMemberInviteDto } from './dto/accept-member-invite.dto';
import { CreateMemberInviteDto } from './dto/create-member-invite.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { InviteStatus } from './entities/member-invite.entity';
import { MembersService } from './members.service';

@Controller('members')
@ApiTags('Members')
@UseInterceptors(ClassSerializerInterceptor)
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /**
   * Get all members for a website
   * @param websiteId - Website ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   */
  @Get('website/:websiteId')
  @UseGuards(JwtAuthGuard)
  async getMembers(
    @Param('websiteId') websiteId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.membersService.getMembers(websiteId, page, limit);
  }

  /**
   * Get a single member by ID
   * @param memberId - Member ID
   */
  @Get(':memberId')
  @UseGuards(JwtAuthGuard)
  async getMember(@Param('memberId') memberId: string) {
    return this.membersService.getMember(memberId);
  }

  /**
   * Create a member invite for a website
   * @param websiteId - Website ID
   * @param createMemberInviteDto - Invite details
   * @param user - Current authenticated user
   */
  @Post('invite/websites/:websiteId')
  @UseGuards(JwtAuthGuard)
  async createInvite(
    @Param('websiteId') websiteId: string,
    @Body() createMemberInviteDto: CreateMemberInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    createMemberInviteDto.websiteId = websiteId;
    return this.membersService.createInvite(
      websiteId,
      createMemberInviteDto,
      user.sub,
    );
  }

  /**
   * Bulk create invites for multiple websites
   * @param body - Email and website IDs
   * @param user - Current authenticated user
   */
  @Post('invite/bulk')
  @UseGuards(JwtAuthGuard)
  async bulkCreateInvites(
    @Body() body: { email: string; websiteIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.membersService.bulkCreateInvites(
      body.email,
      body.websiteIds,
      user.sub,
    );
  }

  /**
   * Get all invites for a website
   * @param websiteId - Website ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param status - Filter by invite status (PENDING, ACCEPTED, REJECTED, EXPIRED, REVOKED)
   */
  @Get('invites/website/:websiteId')
  @UseGuards(JwtAuthGuard)
  async getInvites(
    @Param('websiteId') websiteId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
  ) {
    const inviteStatus = status ? (status.toUpperCase() as InviteStatus) : undefined;
    return this.membersService.getInvites(websiteId, page, limit, inviteStatus);
  }

  /**
   * Get invite details by token (public endpoint - optional auth)
   * @param token - Invite token
   */
  @Get('invite/:token')
  async getInviteByToken(@Param('token') token: string) {
    return this.membersService.getInviteByToken(token);
  }

  /**
   * Accept a member invite
   * @param acceptMemberInviteDto - Invite token
   * @param user - Current authenticated user
   */
  @Post('invite/accept')
  // @UseGuards(JwtAuthGuard)
  async acceptInvite(
    @Body() acceptMemberInviteDto: AcceptMemberInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.membersService.acceptInvite(acceptMemberInviteDto.token, );
  }

  /**
   * Reject a member invite
   * @param token - Invite token
   * @param body - Optional reason for rejection
   */
  @Post('invite/:token/reject')
  async rejectInvite(
    @Param('token') token: string,
    @Body() body?: { reason?: string },
  ) {
    return this.membersService.rejectInvite(token, body?.reason);
  }

  /**
   * Revoke a pending invitation
   * @param inviteId - Invite ID
   */
  @Delete('invite/:inviteId/revoke')
  // @UseGuards(JwtAuthGuard)
  async revokeInvite(
    @Param('inviteId') inviteId: string,
  ) {
    return this.membersService.revokeInvite(inviteId);
  }

  /**
   * Resend a pending invitation
   * @param inviteId - Invite ID
   */
  @Post('invite/:inviteId/resend')
  @UseGuards(JwtAuthGuard)
  async resendInvite(
    @Param('inviteId') inviteId: string,
  ) {
    return this.membersService.resendInvite(inviteId);
  }

  /**
   * Update a member (activation/deactivation only)
   * @param memberId - Member ID
   * @param updateMemberDto - Update details
   */
  @Patch(':memberId')
  @UseGuards(JwtAuthGuard)
  async updateMember(
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.updateMember(memberId, updateMemberDto);
  }

  /**
   * Remove a member from website
   * @param memberId - Member ID
   */
  @Delete(':memberId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(memberId);
  }

  /**
   * Get member count for a website
   * @param websiteId - Website ID
   */
  @Get('count/website/:websiteId')
  @UseGuards(JwtAuthGuard)
  async getMemberCount(@Param('websiteId') websiteId: string) {
    return this.membersService.getMemberCount(websiteId).then(count => ({
      count,
    }));
  }
}