interface Permission {
	createdAt: string;
	updatedAt: string;
	deletedAt: null;
	permissionId: string;
	resource: string;
	action: string;
	name: string;
	description: string;
}

interface Role {
	permissionId: string;
	roleId: string;
	name: string;
	description?: string;
	isSystemRole: boolean;
	isAdminRole: boolean;
	permissions: Permission[];
	createdAt?: string;
	updatedAt?: string;
}