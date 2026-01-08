'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { permissionsApi } from '@/lib/api/permissions';
import { Permission, Role } from '@/types/permissions';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface EditPermissionsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	role: Role | null;
	allPermissions: Permission[];
	onSuccess: () => void;
}

export function EditPermissionsDialog({
	open,
	onOpenChange,
	role,
	allPermissions,
	onSuccess,
}: EditPermissionsDialogProps) {
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (role?.permissions) {
			setSelectedPermissions(role.permissions.map((p) => p.permissionId));
		}
	}, [role]);

	const groupedPermissions = allPermissions.reduce((acc, permission) => {
		if (!acc[permission.resource]) {
			acc[permission.resource] = [];
		}
		acc[permission.resource].push(permission);
		return acc;
	}, {} as Record<string, Permission[]>);

	const handleTogglePermission = (permissionId: string) => {
		setSelectedPermissions((prev) =>
			prev.includes(permissionId)
				? prev.filter((id) => id !== permissionId)
				: [...prev, permissionId]
		);
	};

	const handleSelectAll = (resource: string) => {
		const resourcePermissions = groupedPermissions[resource];
		const allSelected = resourcePermissions.every((p) =>
			selectedPermissions.includes(p.permissionId)
		);

		if (allSelected) {
			// Deselect all
			setSelectedPermissions((prev) =>
				prev.filter(
					(id) => !resourcePermissions.some((p) => p.permissionId === id)
				)
			);
		} else {
			// Select all
			const newIds = resourcePermissions.map((p) => p.permissionId);
			setSelectedPermissions((prev) => [
				...new Set([...prev, ...newIds]),
			]);
		}
	};

	const handleSave = async () => {
		if (!role?.roleId) return;

		setIsLoading(true);
		try {
			await permissionsApi.updateRolePermissions(role.roleId, selectedPermissions);
			toast.success('Permissions updated successfully');
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error('Error updating permissions:', error);
			toast.error('Failed to update permissions');
		} finally {
			setIsLoading(false);
		}
	};

	if (!role) return null;

	console.log("selectedPermissions: ", selectedPermissions);
	
	

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[80vh]">
				<DialogHeader>
					<DialogTitle>Edit Role Permissions</DialogTitle>
					<DialogDescription>
						Configure permissions for <strong>{role.name}</strong> role
						{role.isSystemRole && role.name === 'SUPER_ADMIN' && (
							<span className="text-destructive ml-2">
								(System role - cannot be modified)
							</span>
						)}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="h-[500px] pr-4">
					<div className="space-y-6 py-4">
						{Object.entries(groupedPermissions).map(
							([resource, permissions]) => (
								<div key={resource} className="space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-sm font-semibold capitalize">
											{resource.replace('_', ' ')}
										</h3>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												handleSelectAll(resource)
											}
											disabled={
												role.isSystemRole &&
												role.name === 'SUPER_ADMIN'
											}
										>
											{permissions.every((p) =>
												selectedPermissions.includes(p.permissionId)
											)
												? 'Deselect All'
												: 'Select All'}
										</Button>
									</div>
									<Separator />
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{permissions.map((permission) => (
											<div
												key={permission.permissionId}
												className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
											>
												<Checkbox
													id={permission.permissionId}
													checked={selectedPermissions.includes(permission.permissionId)}
													onCheckedChange={() => handleTogglePermission(permission.permissionId)}
													disabled={
														role.isSystemRole &&
														role.name === 'SUPER_ADMIN'
													}
												/>
												<div className="space-y-1 leading-none flex-1">
													<Label
														htmlFor={permission.permissionId}
														className="text-sm font-medium cursor-pointer"
													>
														{permission.name}
													</Label>
													<p className="text-xs text-muted-foreground">
														{permission.description}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)
						)}
					</div>
				</ScrollArea>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							isLoading ||
							(role.isSystemRole && role.name === 'SUPER_ADMIN')
						}
					>
						{isLoading ? 'Saving...' : 'Save Permissions'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
