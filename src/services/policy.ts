import { PERMISSIONS } from "@/constants/permissions";
import { getUserGroups } from "./auth";

export const GROUP_PERMISSIONS: Record<string, string[]> = {
	"wp-veritas-admins_AppGrpU": Object.values(PERMISSIONS).flatMap((category) => Object.values(category)),
	"wp-veritas-editors_AppGrpU": [PERMISSIONS.SITES.LIST, PERMISSIONS.SITES.READ, PERMISSIONS.TAGS.ASSOCIATE, PERMISSIONS.TAGS.DISSOCIATE, PERMISSIONS.TAGS.LIST, PERMISSIONS.TAGS.CREATE, PERMISSIONS.TAGS.DELETE, PERMISSIONS.TAGS.UPDATE],
	public: [PERMISSIONS.SITES.SEARCH],
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

export async function getPermissions(groups: string[]): Promise<string[]> {
	const permissions: string[] = [];
	for (const group of groups) {
		if (GROUP_PERMISSIONS[group]) {
			permissions.push(...GROUP_PERMISSIONS[group]);
		}
	}
	return Array.from(new Set(permissions));
}
