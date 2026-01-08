import { permissionsApi } from '@/lib/api/permissions';
import { useUserStore } from '@/stores/user.store';
import { Permission, Role } from '@/types/permissions';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

export const usePermissions = () => {
	const user = useUserStore(state => state.user);

	const permissions = useMemo(() => {
		if (!user?.userRole?.permissions) return [];
		return user.userRole.permissions.map(
			(p: Permission) => `${p.resource}:${p.action}`
		);
	}, [user]);

	const hasPermission = (
		resource: string,
		action: string
	): boolean => {
		// Super Admin has all permissions
		if (user?.userRole?.name === 'SUPER_ADMIN' || user?.userRole?.name === 'SUPER_ADMIN') {
			return true;
		}

		const permissionString = `${resource}:${action}`;
		return permissions.includes(permissionString);
	};

	const hasAnyPermission = (checks: Array<{ resource: string; action: string; }>): boolean => {
		return checks.some(({ resource, action }) =>
			hasPermission(resource, action)
		);
	};

	const hasAllPermissions = (checks: Array<{ resource: string; action: string; }>): boolean => {
		return checks.every(({ resource, action }) =>
			hasPermission(resource, action)
		);
	};

	const isSuperAdmin = user?.userRole?.name === 'SUPER_ADMIN';
	const isAdmin = isSuperAdmin || user?.userRole?.name === 'ADMIN';

	return {
		permissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isSuperAdmin,
		isAdmin,
		user,
	};
};

export const useAllRoles = (): UseQueryResult<Role[]> => {
	return useQuery({
		queryKey: ['all-roles'],
		queryFn: () => permissionsApi.getAllRoles(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};