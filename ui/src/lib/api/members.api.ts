import { AcceptInviteResponse, GetInvitesResponse, MemberInvite, UpdateMemberDTO, WebsiteMember } from "@/types/members";
import api from '.';


export const membersApi = {
	getWebsiteMembers: async (
		websiteId: string,
		page: number = 1,
		limit: number = 50
	): Promise<WebsiteMember[]> => {
		const response = await api.get(`/members/website/${websiteId}`, {
			params: { page, limit },
		});
		// Backend returns: { data: { data: [...], pagination: {...} } }
		return response.data?.data?.data || [];
	},


	getWebsiteInvites: async (
		websiteId: string,
		page: number = 1,
		limit: number = 50
	): Promise<GetInvitesResponse> => {
		const response = await api.get(`/members/invites/website/${websiteId}`, {
			params: { page, limit },
		});

		const invites = response.data?.data?.data || [];

		// Group invites by status
		return {
			pending: invites.filter((i: MemberInvite) => i.status === "PENDING"),
			accepted: invites.filter((i: MemberInvite) => i.status === "ACCEPTED"),
			rejected: invites.filter((i: MemberInvite) => i.status === "REJECTED"),
			expired: invites.filter((i: MemberInvite) => i.status === "EXPIRED"),
			revoked: invites.filter((i: MemberInvite) => i.status === "REVOKED"),
		};
	},


	getInviteByToken: async (token: string): Promise<MemberInvite> => {
		const response = await api.get(`/members/invite/${token}`);
		return response.data?.data;
	},

	inviteToWebsite: async (
		websiteId: string,
		email: string,
		message?: string
	): Promise<MemberInvite> => {
		const response = await api.post(`/members/invite/website/${websiteId}`, {
			email,
			message,
			websiteId,
		});
		return response.data?.data;
	},

	inviteMember: async (
		email: string,
		websiteIds: string[],
		message?: string
	): Promise<{
		success: MemberInvite[];
		failed: Array<{ websiteId: string; error: string }>;
	}> => {
		const response = await api.post('/members/invite/bulk', {
			email,
			websiteIds,
			message,
		});
		return response.data?.data;
	},

	acceptInvite: async (token: string): Promise<AcceptInviteResponse> => {
    const response = await api.post('/members/invite/accept', { token });
    return response.data?.data;
  },

	rejectInvite: async (token: string, reason?: string): Promise<void> => {
		await api.post(`/members/invite/${token}/reject`, { reason });
	},
	getMember: async (memberId: string): Promise<WebsiteMember> => {
		const response = await api.get(`/members/${memberId}`);
		return response.data?.data;
	},

	updateMember: async (
		memberId: string,
		data: UpdateMemberDTO
	): Promise<WebsiteMember> => {
		const response = await api.patch(`/members/${memberId}`, data);
		return response.data?.data;
	},

	updateMemberRole: async (
		memberId: string,
		role: "owner" | "editor" | "viewer"
	): Promise<WebsiteMember> => {
		const response = await api.patch(`/members/${memberId}`, { role });
		return response.data?.data;
	},
	removeMember: async (memberId: string): Promise<void> => {
		await api.delete(`/members/${memberId}`);
	},

	revokeInvite: async (inviteId: string): Promise<MemberInvite> => {
		const response = await api.delete(`/members/invite/${inviteId}/revoke`);
		return response.data?.data;
	},

	resendInvite: async (inviteId: string): Promise<MemberInvite> => {
		const response = await api.post(`/members/invite/${inviteId}/resend`);
		return response.data?.data;
	},

	getMemberCount: async (websiteId: string): Promise<number> => {
		const response = await api.get(`/members/count/website/${websiteId}`);
		return response.data?.data?.count || 0;
	},
};