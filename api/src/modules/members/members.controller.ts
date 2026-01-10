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
  Res,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CreateMemberInviteDto } from "./dto/create-member-invite.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { InviteStatus } from "./entities/member-invite.entity";
import { MembersService } from "./members.service";

@Controller("members")
@ApiTags("Members")
@UseInterceptors(ClassSerializerInterceptor)
@ApiSecurity("bearer")
@ApiBearerAuth("JWT")
export class MembersController {
    constructor(private readonly membersService: MembersService) {}

    @Get("website/:websiteId")
    @UseGuards(JwtAuthGuard)
    async getMembers(
        @Param("websiteId") websiteId: string,
        @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
        @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 10
    ) {
        return this.membersService.getMembers(websiteId, page, limit);
    }

    @Get(":memberId")
    @UseGuards(JwtAuthGuard)
    async getMember(@Param("memberId") memberId: string) {
        return this.membersService.getMember(memberId);
    }

    @Post("invite/websites/:websiteId")
    @UseGuards(JwtAuthGuard)
    async createInvite(
        @Param("websiteId") websiteId: string,
        @Body() createMemberInviteDto: CreateMemberInviteDto,
        @CurrentUser() user: JwtPayload
    ) {
        createMemberInviteDto.websiteId = websiteId;
        return this.membersService.createInvite(websiteId, createMemberInviteDto, user.sub);
    }

    @Post("invite/bulk")
    @UseGuards(JwtAuthGuard)
    async bulkCreateInvites(@Body() body: { email: string; websiteIds: string[] }, @CurrentUser() user: JwtPayload) {
        return this.membersService.bulkCreateInvites(body.email, body.websiteIds, user.sub);
    }
    @Get("invites/website/:websiteId")
    @UseGuards(JwtAuthGuard)
    async getInvites(
        @Param("websiteId") websiteId: string,
        @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
        @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 10,
        @Query("status") status?: string
    ) {
        const inviteStatus = status ? (status.toUpperCase() as InviteStatus) : undefined;
        return this.membersService.getInvites(websiteId, page, limit, inviteStatus);
    }

    @Get("invite/accept/:token")
    async acceptInviteViaLink(@Param("token") token: string, @Res() res: Response) {
        try {
            await this.membersService.acceptInvite(token);

            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

            return res.redirect(`${frontendUrl}/dashboard?inviteAccepted=true`);
        } catch (error) {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const errorMessage = encodeURIComponent(error.message || "Failed to accept invite");
            return res.redirect(`${frontendUrl}/dashboard?inviteError=${errorMessage}`);
        }
    }

    @Get("invite/:token")
    async getInviteByToken(@Param("token") token: string) {
        return this.membersService.getInviteByToken(token);
    }
    @Post("invite/accept")
    async acceptInvite(@Body() body: { token: string }) {
        return this.membersService.acceptInvite(body.token);
    }

    @Post("invite/:token/reject")
    async rejectInvite(@Param("token") token: string, @Body() body?: { reason?: string }) {
        return this.membersService.rejectInvite(token, body?.reason);
    }

    @Delete("invite/:inviteId/revoke")
    // @UseGuards(JwtAuthGuard)
    async revokeInvite(@Param("inviteId") inviteId: string) {
        return this.membersService.revokeInvite(inviteId);
    }

    @Post("invite/:inviteId/resend")
    @UseGuards(JwtAuthGuard)
    async resendInvite(@Param("inviteId") inviteId: string) {
        return this.membersService.resendInvite(inviteId);
    }


    @Patch(":memberId")
    @UseGuards(JwtAuthGuard)
    async updateMember(@Param("memberId") memberId: string, @Body() updateMemberDto: UpdateMemberDto) {
        return this.membersService.updateMember(memberId, updateMemberDto);
    }

    @Delete(":memberId")
    @UseGuards(JwtAuthGuard)
    async removeMember(@Param("memberId") memberId: string) {
        return this.membersService.removeMember(memberId);
    }

    @Get("count/website/:websiteId")
    @UseGuards(JwtAuthGuard)
    async getMemberCount(@Param("websiteId") websiteId: string) {
        return this.membersService.getMemberCount(websiteId).then((count) => ({
            count,
        }));
    }
}
