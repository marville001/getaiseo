'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { AlertTriangle, Lock, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface PermissionGuardProps {
	children: ReactNode;
	resource: string;
	action: string;
	fallback?: ReactNode;
	redirectTo?: string;
}

/**
 * PermissionGuard - Route-level permission protection
 * Use this to wrap entire pages/routes that require specific permissions
 */
export function PermissionGuard({
	children,
	resource,
	action,
	fallback,
	redirectTo,
}: PermissionGuardProps) {
	const { hasPermission, isSuperAdmin } = usePermissions();
	const router = useRouter();

	const hasAccess = isSuperAdmin || hasPermission(resource, action);

	useEffect(() => {
		if (!hasAccess && redirectTo) {
			router.replace(redirectTo);
		}
	}, [hasAccess, redirectTo, router]);

	if (!hasAccess) {
		if (fallback) {
			return <>{fallback}</>;
		}

		return <AccessDeniedPage />;
	}

	return <>{children}</>;
}

interface MultiPermissionGuardProps {
	children: ReactNode;
	permissions: Array<{ resource: string; action: string; }>;
	requireAll?: boolean;
	fallback?: ReactNode;
	redirectTo?: string;
}

/**
 * MultiPermissionGuard - Route-level protection requiring multiple permissions
 * Set requireAll=true to require all permissions, false (default) for any permission
 */
export function MultiPermissionGuard({
	children,
	permissions,
	requireAll = false,
	fallback,
	redirectTo,
}: MultiPermissionGuardProps) {
	const { hasAllPermissions, hasAnyPermission, isSuperAdmin } = usePermissions();
	const router = useRouter();

	const hasAccess = isSuperAdmin || (requireAll
		? hasAllPermissions(permissions)
		: hasAnyPermission(permissions));

	useEffect(() => {
		if (!hasAccess && redirectTo) {
			router.replace(redirectTo);
		}
	}, [hasAccess, redirectTo, router]);

	if (!hasAccess) {
		if (fallback) {
			return <>{fallback}</>;
		}

		return <AccessDeniedPage />;
	}

	return <>{children}</>;
}

/**
 * Default access denied page component
 */
function AccessDeniedPage() {
	const router = useRouter();

	return (
		<div className="flex items-center justify-center min-h-[60vh] p-6">
			<Card className="w-full max-w-lg border-red-200 bg-red-50/50">
				<CardHeader className="text-center pb-2">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
						<ShieldAlert className="h-8 w-8 text-red-600" />
					</div>
					<CardTitle className="text-2xl text-red-800">Access Denied</CardTitle>
					<CardDescription className="text-red-600">
						You don&apos;t have permission to access this page
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-white p-4 border border-red-200">
						<div className="flex items-start gap-3">
							<Lock className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
							<div className="space-y-1">
								<p className="text-sm font-medium text-gray-900">
									Insufficient Permissions
								</p>
								<p className="text-sm text-gray-600">
									Your current role doesn&apos;t include the required permissions to view this content.
									Please contact your administrator if you believe this is an error.
								</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
						<div className="flex items-start gap-3">
							<AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
							<div className="space-y-1">
								<p className="text-sm font-medium text-amber-800">
									Need Access?
								</p>
								<p className="text-sm text-amber-700">
									If you need access to this feature, please reach out to a Super Admin 
									to have your role updated with the necessary permissions.
								</p>
							</div>
						</div>
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => router.back()}
						>
							Go Back
						</Button>
						<Button
							className="flex-1"
							onClick={() => router.push('/admin')}
						>
							Go to Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export { AccessDeniedPage };
