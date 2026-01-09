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
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

interface MembersListProps {
	members: WebsiteMember[];
	pendingInvites: MemberInvite[];
	acceptedInvites: MemberInvite[];
	onMemberRemoved?: () => void;
	onMemberRoleUpdated?: () => void;
}

export default function MembersList({
	members,
	pendingInvites,
	acceptedInvites,
	onMemberRemoved,
	onMemberRoleUpdated,
}: MembersListProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<WebsiteMember | null>(null);

	const handleRemoveMember = async () => {
		if (!selectedMember) return;

		try {
			setLoading(selectedMember.memberId);
			await membersApi.removeMember(selectedMember.memberId);
			setDeleteDialogOpen(false);
			onMemberRemoved?.();
		} catch (error) {
			console.error("Failed to remove member:", error);
		} finally {
			setLoading(null);
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
			onMemberRoleUpdated?.();
		} catch (error) {
			console.error("Failed to update member role:", error);
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Pending Invites */}
			{pendingInvites.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Pending Invitations</CardTitle>
						<CardDescription>
							Awaiting acceptance from invited members
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
									</TableRow>
								</TableHeader>
								<TableBody>
									{pendingInvites.map((invite) => (
										<TableRow key={invite.inviteId}>
											<TableCell className="font-medium">
												{invite.invitedEmail}
											</TableCell>
											<TableCell>
												<Badge variant="outline">Pending</Badge>
											</TableCell>
											<TableCell>
												{invite.invitedBy?.firstName &&
													invite.invitedBy?.lastName
													? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`
													: invite.invitedBy?.email || "-"}
											</TableCell>
											<TableCell>
												{new Date(invite.expiresAt).toLocaleDateString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Accepted Members */}
			<Card>
				<CardHeader>
					<CardTitle>Team Members</CardTitle>
					<CardDescription>
						{members.length} member{members.length !== 1 ? "s" : ""}
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
										<TableHead>Added</TableHead>
										<TableHead className="w-[50px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{members.map((member) => (
										<TableRow key={member.memberId}>
											<TableCell className="font-medium">
												{member.user?.firstName &&
													member.user?.lastName
													? `${member.user.firstName} ${member.user.lastName}`
													: "Unknown"}
											</TableCell>
											<TableCell>{member.user?.email}</TableCell>
											<TableCell>
												<Select
													value={member.role}
													onValueChange={(newRole) =>
														handleRoleChange(
															member.memberId,
															newRole as
																| "owner"
																| "editor"
																| "viewer"
														)
													}
													disabled={loading === member.memberId}
												>
													<SelectTrigger className="w-24">
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
												{new Date(member.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => {
																setSelectedMember(member);
																setDeleteDialogOpen(true);
															}}
															className="text-red-600"
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Remove
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

			{/* Accept Invites */}
			{acceptedInvites.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Accepted Invitations</CardTitle>
						<CardDescription>
							Members who have accepted invitations
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
									{acceptedInvites.map((invite) => (
										<TableRow key={invite.inviteId}>
											<TableCell className="font-medium">
												{invite.invitedEmail}
											</TableCell>
											<TableCell>
												<Badge variant="secondary">Accepted</Badge>
											</TableCell>
											<TableCell>
												{invite.acceptedAt
													? new Date(invite.acceptedAt).toLocaleDateString()
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

			{/* Delete Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove{" "}
							{selectedMember?.user?.email} from this website? This
							action cannot be undone.
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
								"Remove"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
