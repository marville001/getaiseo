'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { ReactNode } from 'react';

interface PermissionGateProps {
	children: ReactNode;
	resource: string;
	action: string;
	fallback?: ReactNode;
}

export function PermissionGate({
	children,
	resource,
	action,
	fallback = null,
}: PermissionGateProps) {
	const { hasPermission } = usePermissions();

	if (!hasPermission(resource, action)) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}

// Multi-permission gate
interface MultiPermissionGateProps {
	children: ReactNode;
	permissions: Array<{ resource: string; action: string; }>;
	requireAll?: boolean;
	fallback?: ReactNode;
}

export function MultiPermissionGate({
	children,
	permissions,
	requireAll = false,
	fallback = null,
}: MultiPermissionGateProps) {
	const { hasAllPermissions, hasAnyPermission } = usePermissions();

	const hasAccess = requireAll
		? hasAllPermissions(permissions)
		: hasAnyPermission(permissions);

	if (!hasAccess) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
