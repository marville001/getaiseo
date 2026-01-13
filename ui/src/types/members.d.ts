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


export interface CreateMemberInviteDTO {
	email: string;
	websiteId: string;
	message?: string;
}


export interface BulkCreateMemberInviteDTO {
	email: string;
	websiteIds: string[];
	message?: string;
}


export interface AcceptMemberInviteDTO {
	token: string;
}


export interface UpdateMemberDTO {
	isActive?: boolean;
	role?: "owner" | "editor" | "viewer";
}

export interface GetInvitesResponse {
	pending: MemberInvite[];
	accepted: MemberInvite[];
	rejected?: MemberInvite[];
	expired?: MemberInvite[];
	revoked?: MemberInvite[];
}

export interface AcceptInviteResponse {
  member: WebsiteMember;
  message: string;
  isNewUser?: boolean;
}