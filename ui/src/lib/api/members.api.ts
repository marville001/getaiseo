import api from '.';

/**
 * Response DTO for a website member
 */
export interface WebsiteMember {
	memberId: string;
	userId: string;
	websiteId: string;
	role: "owner" | "editor" | "viewer";
	isActive: boolean;
	joinedAt: string;
	invitedAt: string;
	invitedBy: string;
	createdAt: string;
	updatedAt: string;
	user?: {
		userId: string;
		firstName: string;
		lastName: string;
		email: string;
		avatar?: string;
	};
}
/**
 * Response DTO for a member invite
 */
export interface MemberInvite {
	inviteId: string;
	memberId?: string;
	websiteId: string;
	email: string;
	token: string;
	status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";
	expiresAt?: string;
	acceptedAt?: string;
	rejectedAt?: string;
	revokedAt?: string;
	rejectionReason?: string;
	invitedBy?: string;
	inviter?: {
		userId: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
}

/**
 * Request DTO for creating member invites
 */
export interface CreateMemberInviteDTO {
	email: string;
	websiteId: string;
	message?: string;
}

/**
 * Request DTO for bulk inviting members
 */
export interface BulkCreateMemberInviteDTO {
	email: string;
	websiteIds: string[];
	message?: string;
}

/**
 * Request DTO for accepting member invite
 */
export interface AcceptMemberInviteDTO {
	token: string;
}

/**
 * Request DTO for updating member
 */
export interface UpdateMemberDTO {
	isActive?: boolean;
	role?: "owner" | "editor" | "viewer";
}

/**
 * Response DTO for member invites with status grouping
 */
export interface GetInvitesResponse {
	pending: MemberInvite[];
	accepted: MemberInvite[];
	rejected?: MemberInvite[];
	expired?: MemberInvite[];
	revoked?: MemberInvite[];
}

export const membersApi = {
	/**
	 * Get all members for a specific website
	 */
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

	/**
	 * Get all invites for a specific website grouped by status
	 */
	getWebsiteInvites: async (
		websiteId: string,
		page: number = 1,
		limit: number = 50
	): Promise<GetInvitesResponse> => {
		const response = await api.get(`/members/invites/website/${websiteId}`, {
			params: { page, limit },
		});

		// Backend returns: { data: { data: [...], pagination: {...} } }
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

	/**
	 * Get details of a specific invite by token (public, no auth required)
	 */
	getInviteByToken: async (token: string): Promise<MemberInvite> => {
		const response = await api.get(`/members/invite/${token}`);
		return response.data?.data;
	},

	/**
	 * Invite a member to a single website
	 */
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

	/**
	 * Bulk invite member to multiple websites at once
	 */
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

	/**
	 * Accept an invitation by token
	 */
	acceptInvite: async (token: string): Promise<MemberInvite> => {
		const response = await api.post('/members/invite/accept', { token });
		return response.data?.data;
	},

	/**
	 * Reject an invitation by token
	 */
	rejectInvite: async (token: string, reason?: string): Promise<void> => {
		await api.post(`/members/invite/${token}/reject`, { reason });
	},

	/**
	 * Get a specific member's details
	 */
	getMember: async (memberId: string): Promise<WebsiteMember> => {
		const response = await api.get(`/members/${memberId}`);
		return response.data?.data;
	},

	/**
	 * Update a member
	 */
	updateMember: async (
		memberId: string,
		data: UpdateMemberDTO
	): Promise<WebsiteMember> => {
		const response = await api.patch(`/members/${memberId}`, data);
		return response.data?.data;
	},

	/**
	 * Update member role
	 */
	updateMemberRole: async (
		memberId: string,
		role: "owner" | "editor" | "viewer"
	): Promise<WebsiteMember> => {
		const response = await api.patch(`/members/${memberId}`, { role });
		return response.data?.data;
	},

	/**
	 * Remove a member from a website
	 */
	removeMember: async (memberId: string): Promise<void> => {
		await api.delete(`/members/${memberId}`);
	},

	/**
	 * Revoke a pending invitation
	 */
	revokeInvite: async (inviteId: string): Promise<MemberInvite> => {
		const response = await api.delete(`/members/invite/${inviteId}/revoke`);
		return response.data?.data;
	},

	/**
	 * Resend an invitation by ID
	 */
	resendInvite: async (inviteId: string): Promise<MemberInvite> => {
		const response = await api.post(`/members/invite/${inviteId}/resend`);
		return response.data?.data;
	},

	/**
	 * Get member count for a website
	 */
	getMemberCount: async (websiteId: string): Promise<number> => {
		const response = await api.get(`/members/count/website/${websiteId}`);
		return response.data?.data?.count || 0;
	},
};