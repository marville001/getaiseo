"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionAction, PermissionResource } from "@/constants/permissions";
import { Users } from "lucide-react";
import { UsersTable } from "./components";

export default function UsersPage() {
	return (
		<PermissionGate
			resource={PermissionResource.USERS}
			action={PermissionAction.READ}
			showAccessDenied
		>
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							User Management
						</CardTitle>
						<CardDescription>
							Manage users, view user details, and control user access to the platform
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UsersTable />
					</CardContent>
				</Card>
			</div>
		</PermissionGate>
	);
}