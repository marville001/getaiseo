// Permission Resources - must match API PermissionResource enum
export const PermissionResource = {
	USERS: 'users',
	ADMINS: 'admins',
	ROLES: 'roles',
	SETTINGS: 'settings',
	AI_MODELS: 'ai_models',
	QUESTIONS: 'questions',
	REPORTS: 'reports',
	BILLING: 'billing',
	AUDIT_LOGS: 'audit_logs',
} as const;

export type PermissionResourceType = (typeof PermissionResource)[keyof typeof PermissionResource];

// Permission Actions - must match API PermissionAction enum
export const PermissionAction = {
	CREATE: 'create',
	READ: 'read',
	UPDATE: 'update',
	DELETE: 'delete',
	SUSPEND: 'suspend',
	EXPORT: 'export',
	VIEW_SENSITIVE: 'view_sensitive',
} as const;

export type PermissionActionType = (typeof PermissionAction)[keyof typeof PermissionAction];

// Helper to create permission object
export const Permission = (resource: PermissionResourceType, action: PermissionActionType) => ({
	resource,
	action,
});

// Pre-defined permission sets for common use cases
export const PERMISSIONS = {
	// User management
	USERS_READ: Permission(PermissionResource.USERS, PermissionAction.READ),
	USERS_CREATE: Permission(PermissionResource.USERS, PermissionAction.CREATE),
	USERS_UPDATE: Permission(PermissionResource.USERS, PermissionAction.UPDATE),
	USERS_DELETE: Permission(PermissionResource.USERS, PermissionAction.DELETE),
	USERS_SUSPEND: Permission(PermissionResource.USERS, PermissionAction.SUSPEND),
	USERS_EXPORT: Permission(PermissionResource.USERS, PermissionAction.EXPORT),

	// Admin management
	ADMINS_READ: Permission(PermissionResource.ADMINS, PermissionAction.READ),
	ADMINS_CREATE: Permission(PermissionResource.ADMINS, PermissionAction.CREATE),
	ADMINS_UPDATE: Permission(PermissionResource.ADMINS, PermissionAction.UPDATE),
	ADMINS_DELETE: Permission(PermissionResource.ADMINS, PermissionAction.DELETE),

	// Roles & Permissions
	ROLES_READ: Permission(PermissionResource.ROLES, PermissionAction.READ),
	ROLES_CREATE: Permission(PermissionResource.ROLES, PermissionAction.CREATE),
	ROLES_UPDATE: Permission(PermissionResource.ROLES, PermissionAction.UPDATE),
	ROLES_DELETE: Permission(PermissionResource.ROLES, PermissionAction.DELETE),

	// Settings
	SETTINGS_READ: Permission(PermissionResource.SETTINGS, PermissionAction.READ),
	SETTINGS_UPDATE: Permission(PermissionResource.SETTINGS, PermissionAction.UPDATE),

	// AI Models
	AI_MODELS_READ: Permission(PermissionResource.AI_MODELS, PermissionAction.READ),
	AI_MODELS_UPDATE: Permission(PermissionResource.AI_MODELS, PermissionAction.UPDATE),

	// Audit Logs
	AUDIT_LOGS_READ: Permission(PermissionResource.AUDIT_LOGS, PermissionAction.READ),
	AUDIT_LOGS_EXPORT: Permission(PermissionResource.AUDIT_LOGS, PermissionAction.EXPORT),

	// Reports
	REPORTS_READ: Permission(PermissionResource.REPORTS, PermissionAction.READ),
	REPORTS_EXPORT: Permission(PermissionResource.REPORTS, PermissionAction.EXPORT),
} as const;
