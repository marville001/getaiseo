'use client';

import { PermissionGate } from '@/components/auth/PermissionGate';
import { CreateRoleDialog } from '@/components/modals/CreateRoleDialog';
import { EditPermissionsDialog } from '@/components/modals/EditPermissionsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionAction, PermissionResource } from '@/constants/permissions';
import { permissionsApi } from '@/lib/api/permissions';
import { Permission, Role } from '@/types/permissions';
import { Plus, Settings, Shield, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function RolesPage() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const [rolesData, permissionsData] = await Promise.all([
				permissionsApi.getAllRoles(),
				permissionsApi.getAllPermissions(),
			]);

			setRoles(rolesData);
			setAllPermissions(permissionsData);
		} catch (error) {
			console.error('Error loading data:', error);
			toast.error('Failed to load roles and permissions');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditRole = (role: Role) => {
		setSelectedRole(role);
		setIsEditDialogOpen(true);
	};

	const getRoleIcon = (roleName: string) => {
		switch (roleName) {
			case 'SUPER_ADMIN':
				return <ShieldCheck className="h-5 w-5" />;
			case 'ADMIN':
				return <Shield className="h-5 w-5" />;
			case 'TEACHER':
			case 'PARENT':
			case 'STUDENT':
				return <Users className="h-5 w-5" />;
			default:
				return <Settings className="h-5 w-5" />;
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-8 space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			</div>
		);
	}

	return (
		<PermissionGate
			resource={PermissionResource.ROLES}
			action={PermissionAction.READ}
			showAccessDenied
		>
			<div className="container mx-auto py-8 space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">
							Roles & Permissions
						</h1>
						<p className="text-muted-foreground">
							Manage roles and configure permissions for admin users
						</p>
					</div>
					<PermissionGate
						resource={PermissionResource.ROLES}
						action={PermissionAction.CREATE}
					>
						<Button onClick={() => setIsCreateDialogOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create Role
						</Button>
					</PermissionGate>
				</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{roles.map((role) => {
					if(["TEACHER", "PARENT", "STUDENT"].includes(role.name)) {
						return null;
					}

					return (
						<Card
							key={role.roleId}
							className="hover:shadow-lg transition-shadow !self-start"
						>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-primary/10 rounded-lg">
											{getRoleIcon(role.name)}
										</div>
										<div>
											<CardTitle className="text-xl">
												{role.name.replace('_', ' ')}
											</CardTitle>
											{role.isSystemRole && (
												<Badge
													variant={"destructive"}
													className="mt-1"
												>
													System Role
												</Badge>
											)}
										</div>
									</div>
								</div>
								<CardDescription className='!mt-2'>
									{role.description || 'No description'}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									{
										(role.name === 'ADMIN' || !role.isSystemRole) &&
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												Permissions
											</span>
											<span className="font-semibold">
												{role.permissions?.length || 0}
											</span>
										</div>
									}
									<div className="text-xs text-muted-foreground">
										{role.permissions
											?.slice(0, 3)
											.map((p) => p.name)
											.join(', ')}
										{role.permissions &&
											role.permissions.length > 3 &&
											` +${role.permissions.length - 3} more`}
									</div>

								</div>

								{
									!['SUPER_ADMIN', 'USER'].includes(role.name) &&
									<PermissionGate
										resource={PermissionResource.ROLES}
										action={PermissionAction.UPDATE}
									>
										<Button
											onClick={() => handleEditRole(role)}
											variant="outline"
											className="w-full"
										>
											<Settings className="mr-2 h-4 w-4" />
											Manage Permissions
										</Button>
									</PermissionGate>
								}
							</CardContent>
						</Card>
					);
				})}
			</div>

			<EditPermissionsDialog
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				role={selectedRole}
				allPermissions={allPermissions}
				onSuccess={loadData}
			/>

			<CreateRoleDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				allPermissions={allPermissions}
				onSuccess={loadData}
			/>
		</div>
		</PermissionGate>
	);
}
