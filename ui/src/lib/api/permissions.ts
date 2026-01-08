import { Permission, Role } from '@/types/permissions';
import api from '.';

export const permissionsApi = {
	// Get all permissions
	getAllPermissions: async (): Promise<Permission[]> => {
		const response = await api.get('/permissions');
		return response.data?.data;
	},

	// Get all roles
	getAllRoles: async (): Promise<Role[]> => {
		const response = await api.get('/permissions/roles');
		return response.data?.data;
	},

	// Get role by ID
	getRoleById: async (roleId: string): Promise<Role> => {
		const response = await api.get(`/permissions/roles/${roleId}`);
		return response.data;
	},

	// Update role permissions
	updateRolePermissions: async (
		roleId: string,
		permissionIds: string[]
	): Promise<Role> => {
		const response = await api.put(`/permissions/roles/${roleId}`, {
			permissionIds,
		});
		return response.data;
	},

	// Create custom role
	createRole: async (data: {
		name: string;
		description?: string;
		permissionIds: string[];
	}): Promise<Role> => {
		const response = await api.post('/permissions/roles', data);
		return response.data;
	},

	// Delete role
	deleteRole: async (roleId: string): Promise<void> => {
		await api.delete(`/permissions/roles/${roleId}`);
	},
};
