"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MemberInvite, WebsiteMember, membersApi } from "@/lib/api/members.api";
import { format } from "date-fns";
import {
	Ban,
	Loader2,
	Mail,
	MoreHorizontal,
	Trash2,
	UserCheck,
	UserX
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MembersListProps {
	members: WebsiteMember[];
	pendingInvites: MemberInvite[];
	acceptedInvites: MemberInvite[];
	onMemberRemoved?: () => void;
	onMemberRoleUpdated?: () => void;
	onInviteAction?: () => void;
}

export default function MembersList({
	members,
	pendingInvites,
	acceptedInvites,
	onMemberRemoved,
	onMemberRoleUpdated,
	onInviteAction,
}: MembersListProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
	const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<WebsiteMember | null>(null);
	const [selectedInvite, setSelectedInvite] = useState<MemberInvite | null>(null);

	const handleRemoveMember = async () => {
		if (!selectedMember) return;

		try {
			setLoading(selectedMember.memberId);
			await membersApi.removeMember(selectedMember.memberId);
			setDeleteDialogOpen(false);
			toast.success(`${selectedMember.user?.email} has been removed from the team.`);
			onMemberRemoved?.();
		} catch (error) {
			toast.error("Failed to remove member. Please try again.");
		} finally {
			setLoading(null);
			setSelectedMember(null);
		}
	};

	const handleToggleMemberStatus = async (member: WebsiteMember) => {
		try {
			setLoading(member.memberId);
			const newStatus = !member.isActive;
			await membersApi.updateMember(member.memberId, { isActive: newStatus });
			toast( `${member.user?.email} has been ${newStatus ? 'activated' : 'deactivated'}.`);
			onMemberRoleUpdated?.();
		} catch (error) {
			toast.error("Failed to update member status. Please try again.");
		} finally {
			setLoading(null);
			setDeactivateDialogOpen(false);
			setSelectedMember(null);
		}
	};

	const handleRoleChange = async (
		memberId: string,
		newRole: "owner" | "editor" | "viewer"
	) => {
		try {
			setLoading(memberId);
			await membersApi.updateMemberRole(memberId, newRole);
			toast.success("Member role updated successfully.");
			onMemberRoleUpdated?.();
		} catch (error) {
			toast.error("Failed to update member role. Please try again.");
		} finally {
			setLoading(null);
		}
	};

	const handleResendInvite = async (invite: MemberInvite) => {
		try {
			setLoading(invite.inviteId);
			await membersApi.resendInvite(invite.inviteId);
			toast.success(`Invitation resent to ${invite.email}.`);
			onInviteAction?.();
		} catch (error) {
			toast.error("Failed to resend invitation. Please try again.");
		} finally {
			setLoading(null);
		}
	};

	const handleRevokeInvite = async () => {
		if (!selectedInvite) return;

		try {
			setLoading(selectedInvite.inviteId);
			await membersApi.revokeInvite(selectedInvite.inviteId);
			setRevokeDialogOpen(false);
			toast.success(`Invitation to ${selectedInvite.email} has been revoked.`);
			onInviteAction?.();
		} catch (error) {
			toast.error("Failed to revoke invitation. Please try again.");
		} finally {
			setLoading(null);
			setSelectedInvite(null);
		}
	};

	const getUserDisplayName = (user: WebsiteMember['user']) => {
		if (!user) return "Unknown User";

		if (user.firstName) {
			return user.lastName
				? `${user.firstName} ${user.lastName}`.trim()
				: user.firstName;
		}

		return user.email?.split('@')[0] || "Unknown User";
	};

	const memberEmails = new Set(members.map(m => m.user?.email).filter(Boolean));
	const filteredAcceptedInvites = acceptedInvites.filter(
		invite => !memberEmails.has(invite.email)
	);

	return (
		<div className="space-y-6">
			{/* Pending Invites */}
			{pendingInvites.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Pending Invitations</CardTitle>
						<CardDescription>
							{pendingInvites.length} invitation{pendingInvites.length !== 1 ? 's' : ''} awaiting acceptance
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Invited By</TableHead>
										<TableHead>Expires</TableHead>
										<TableHead className="w-[80px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pendingInvites.map((invite) => (
										<TableRow key={invite.inviteId}>
											<TableCell className="font-medium">
												{invite.email}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
													Pending
												</Badge>
											</TableCell>
											<TableCell>
												{invite.inviter
													? `${invite.inviter.firstName || ''} ${invite.inviter.lastName || ''}`.trim() || invite.inviter.email
													: invite.invitedBy || '-'
												}
											</TableCell>
											<TableCell className="text-sm text-gray-600">
												{invite.expiresAt
													? format(new Date(invite.expiresAt), "MMM dd, yyyy")
													: '-'
												}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															disabled={loading === invite.inviteId}
														>
															{loading === invite.inviteId ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<MoreHorizontal className="h-4 w-4" />
															)}
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleResendInvite(invite)}
														>
															<Mail className="h-4 w-4 mr-2" />
															Resend Invitation
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => {
																setSelectedInvite(invite);
																setRevokeDialogOpen(true);
															}}
															className="text-red-600"
														>
															<Ban className="h-4 w-4 mr-2" />
															Revoke Invitation
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Active Members */}
			<Card>
				<CardHeader>
					<CardTitle>Team Members</CardTitle>
					<CardDescription>
						{members.length} member{members.length !== 1 ? "s" : ""} • {members.filter(m => m.isActive).length} active
					</CardDescription>
				</CardHeader>
				<CardContent>
					{members.length === 0 ? (
						<p className="text-sm text-gray-500 py-4">
							No members yet. Invite someone to get started!
						</p>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead className="w-[80px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{members.map((member) => (
										<TableRow key={member.memberId} className={!member.isActive ? 'opacity-60' : ''}>
											<TableCell className="font-medium">
												{getUserDisplayName(member.user)}
											</TableCell>
											<TableCell>{member.user?.email || '-'}</TableCell>
											<TableCell>
												<Select
													value={member.role}
													onValueChange={(newRole) =>
														handleRoleChange(
															member.memberId,
															newRole as "owner" | "editor" | "viewer"
														)
													}
													disabled={loading === member.memberId || !member.isActive}
												>
													<SelectTrigger className="w-28">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="owner">Owner</SelectItem>
														<SelectItem value="editor">Editor</SelectItem>
														<SelectItem value="viewer">Viewer</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<Badge
													variant={member.isActive ? "default" : "secondary"}
													className={member.isActive ? "bg-green-100 text-green-800" : ""}
												>
													{member.isActive ? "Active" : "Inactive"}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-gray-600">
												{member.joinedAt
													? format(new Date(member.joinedAt), "MMM dd, yyyy")
													: member.createdAt
														? format(new Date(member.createdAt), "MMM dd, yyyy")
														: '-'
												}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															disabled={loading === member.memberId}
														>
															{loading === member.memberId ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<MoreHorizontal className="h-4 w-4" />
															)}
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														{member.isActive ? (
															<DropdownMenuItem
																onClick={() => {
																	setSelectedMember(member);
																	setDeactivateDialogOpen(true);
																}}
															>
																<UserX className="h-4 w-4 mr-2" />
																Deactivate Member
															</DropdownMenuItem>
														) : (
															<DropdownMenuItem
																onClick={() => handleToggleMemberStatus(member)}
															>
																<UserCheck className="h-4 w-4 mr-2" />
																Activate Member
															</DropdownMenuItem>
														)}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => {
																setSelectedMember(member);
																setDeleteDialogOpen(true);
															}}
															className="text-red-600"
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Remove Member
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Accepted Invites */}
			{filteredAcceptedInvites.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Recently Accepted Invitations</CardTitle>
						<CardDescription>
							Invitations accepted but members may still be completing setup
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Accepted</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredAcceptedInvites.map((invite) => (
										<TableRow key={invite.inviteId}>
											<TableCell className="font-medium">
												{invite.email}
											</TableCell>
											<TableCell>
												<Badge variant="secondary" className="bg-green-100 text-green-800">
													Accepted
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-gray-600">
												{invite.acceptedAt
													? format(new Date(invite.acceptedAt), "MMM dd, yyyy")
													: "-"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Remove Member Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove{" "}
							<span className="font-semibold">{selectedMember?.user?.email}</span>{" "}
							from this website? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveMember}
							disabled={loading === selectedMember?.memberId}
							className="bg-red-600 hover:bg-red-700"
						>
							{loading === selectedMember?.memberId ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Removing...
								</>
							) : (
								"Remove Member"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Deactivate Member Dialog */}
			<AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Deactivate Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to deactivate{" "}
							<span className="font-semibold">{selectedMember?.user?.email}</span>?
							They will lose access to this website but can be reactivated later.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => selectedMember && handleToggleMemberStatus(selectedMember)}
							disabled={loading === selectedMember?.memberId}
							className="bg-orange-600 hover:bg-orange-700"
						>
							{loading === selectedMember?.memberId ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Deactivating...
								</>
							) : (
								"Deactivate Member"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Revoke Invite Dialog */}
			<AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to revoke the invitation to{" "}
							<span className="font-semibold">{selectedInvite?.email}</span>?
							The invitation link will no longer work.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRevokeInvite}
							disabled={loading === selectedInvite?.inviteId}
							className="bg-red-600 hover:bg-red-700"
						>
							{loading === selectedInvite?.inviteId ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Revoking...
								</>
							) : (
								"Revoke Invitation"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}