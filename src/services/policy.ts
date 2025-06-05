import { PERMISSIONS } from '@/constants/permissions';
import { getUserGroups } from './auth';

export const GROUP_PERMISSIONS: Record<string, string[]> = {
	'wp-veritas-admins_AppGrpU': [PERMISSIONS.SITE.READ, PERMISSIONS.SITE.CREATE, PERMISSIONS.SITE.UPDATE, PERMISSIONS.SITE.DELETE, PERMISSIONS.SITE.LIST, PERMISSIONS.TAGS.READ, PERMISSIONS.TAGS.CREATE, PERMISSIONS.TAGS.UPDATE, PERMISSIONS.TAGS.DELETE, PERMISSIONS.TAGS.LIST, PERMISSIONS.LOGS.LISTS, PERMISSIONS.REDIRECTIONS.READ, PERMISSIONS.REDIRECTIONS.CREATE, PERMISSIONS.REDIRECTIONS.UPDATE, PERMISSIONS.REDIRECTIONS.DELETE, PERMISSIONS.REDIRECTIONS.LIST],
	'wp-veritas-editor_AppGrpU': [PERMISSIONS.SITE.READ, PERMISSIONS.SITE.UPDATE, PERMISSIONS.SITE.LIST, PERMISSIONS.TAGS.LIST],
	public: [PERMISSIONS.SITE.READ, PERMISSIONS.SITE.LIST, PERMISSIONS.TAGS.READ, PERMISSIONS.TAGS.LIST],
};

export async function hasPermission(permission: string): Promise<boolean> {
	const userGroups = await getUserGroups();
	if (!userGroups) return false;

	for (const group of userGroups) {
		if (GROUP_PERMISSIONS[group]?.includes(permission)) {
			return true;
		}
	}
	return false;
}

export async function getUserPermissions(groups: string[]): Promise<string[]> {
	const permissions: string[] = [];
	for (const group of groups) {
		if (GROUP_PERMISSIONS[group]) {
			permissions.push(...GROUP_PERMISSIONS[group]);
		}
	}
	return Array.from(new Set(permissions));
}
