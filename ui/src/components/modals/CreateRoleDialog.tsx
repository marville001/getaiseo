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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { permissionsApi } from '@/lib/api/permissions';
import { Permission } from '@/types/permissions';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface CreateRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allPermissions: Permission[];
	onSuccess: () => void;
}

export function CreateRoleDialog({
	open,
	onOpenChange,
	allPermissions,
	onSuccess,
}: CreateRoleDialogProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

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

	const handleCreate = async () => {
		// Validation
		if (!name.trim()) {
			toast.error('Role name is required');
			return;
		}

		if (selectedPermissions.length === 0) {
			toast.error('Please select at least one permission');
			return;
		}

		setIsLoading(true);
		try {
			await permissionsApi.createRole({
				name: name.trim(),
				description: description.trim() || undefined,
				permissionIds: selectedPermissions,
			});
			toast.success('Role created successfully');

			// Reset form
			setName('');
			setDescription('');
			setSelectedPermissions([]);

			onSuccess();
			onOpenChange(false);
		} catch (error: unknown) {
			console.error('Error creating role:', error);
			let errorMessage = 'Failed to create role';
			if (error && typeof error === 'object' && 'response' in error) {
				const response = (error as { response?: { data?: { message?: string; }; }; }).response;
				if (response?.data?.message) {
					errorMessage = response.data.message;
				}
			}
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			setName('');
			setDescription('');
			setSelectedPermissions([]);
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-3xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Create New Role</DialogTitle>
					<DialogDescription>
						Create a custom role with specific permissions
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh] pr-2">
					<div className="space-y-6 py-4 p-2">
						{/* Role Name */}
						<div className="space-y-2">
							<Label htmlFor="role-name">
								Role Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="role-name"
								placeholder="e.g., Content Manager"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={isLoading}
							/>
						</div>

						{/* Role Description */}
						<div className="space-y-2">
							<Label htmlFor="role-description">
								Description (optional)
							</Label>
							<Textarea
								id="role-description"
								placeholder="Brief description of this role's purpose..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={isLoading}
								rows={3}
							/>
						</div>

						<Separator />

						{/* Permissions Section */}
						<div className="space-y-4">
							<div>
								<h3 className="text-sm font-semibold mb-2">
									Permissions <span className="text-destructive">*</span>
								</h3>
								<p className="text-xs text-muted-foreground">
									Select the permissions this role should have
								</p>
							</div>

							{Object.entries(groupedPermissions).map(
								([resource, permissions]) => (
									<div key={resource} className="space-y-3">
										<div className="flex items-center justify-between">
											<h4 className="text-sm font-medium capitalize">
												{resource.replace('_', ' ')}
											</h4>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() =>
													handleSelectAll(resource)
												}
												disabled={isLoading}
											>
												{permissions.every((p) =>
													selectedPermissions.includes(p.permissionId)
												)
													? 'Deselect All'
													: 'Select All'}
											</Button>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											{permissions.map((permission) => (
												<div
													key={permission.permissionId}
													onClick={() => {
														handleTogglePermission(permission.permissionId);
													}}
													className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
												>
													<Checkbox
														id={`create-${permission.permissionId}`}
														checked={selectedPermissions.includes(permission.permissionId)}
														onCheckedChange={() =>
															handleTogglePermission(permission.permissionId)
														}
														disabled={isLoading}
													/>
													<div className="space-y-1 leading-none flex-1">
														<Label
															htmlFor={`create-${permission.permissionId}`}
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
					</div>
				</ScrollArea>

				<DialogFooter className='pr-4'>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={isLoading}>
						{isLoading ? 'Creating...' : 'Create Role'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
